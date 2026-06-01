# AGENTS.md

## Project overview

Personal account platform (Go 1.26.3). Two microservices:

| Service | Role | Port |
|---------|------|------|
| `apps/personal-api` | HTTP API gateway (Echo v4) | 8080 |
| `apps/personal-auth` | gRPC auth + user profile | 50001 |

API prefix: `/api/v1` (routes in `apps/personal-api/pkg/handler/router.go`)

## Build & dev commands

```sh
make fmt              # gofmt -l -s -w (no linter/typecheck beyond this)
make build            # CGO_ENABLED=0 build all apps → bin/
make build app=X      # build a single app
make race             # CGO_ENABLED=1 + -race flag
make compile          # compile .proto files (apps/<name>/adapter/*.proto → pb/)
make vendor           # go mod vendor (requires GOWORK=off)
make docker           # multi-stage Docker build
make docker app=X     # single-app Docker build
make clear            # rm -rf bin/personal-*
```

Version is in `version` file (currently `7.0.5`). LDFLAGS inject `main.AppName`, `main.MainVersion`, `main.GitSha`, `main.BuildTime` at build time.

## Testing

```sh
go test ./...                         # all tests
go test ./apps/personal-api/...       # all API tests
go test ./apps/personal-auth/...      # all auth tests
- **personal-auth/pkg/model**: tests **require** local MySQL (`root:root@tcp(127.0.0.1:3306)/`). Auto-creates DB `personal_auth_test` + tables in `TestMain`.
- **personal-auth/pkg/service**: most tests use dependency injection via package-level function variables (`selectAccountByEmail`, `redisTTL`, `redisGet`, etc.) swapped with `t.Cleanup()`. Mock-based, no external deps.
- **personal-api/pkg/handler**: mock-based, no external deps. Uses `TestMain` to init nop logger.
- **personal-auth/pkg/cache/profile_test.go**: likely requires Redis.

## Architecture & entrypoints

- `apps/<name>/main.go` — sets `buildinfo` vars from ldflags, calls `system.LoadRuntime()`, then `cmd.Run()`
- `apps/<name>/cmd/root.go` — flag parsing → config load → logging init → infra init → start server → `procutil.WaitForSigterm()` for graceful shutdown
- `lib/` — 30 shared packages. Key ones: `auth` (JWT + state tokens), `encrypt` (PBKDF2, 600K iterations), `grpc/` (server/client wrappers + Hystrix circuit breaker + etcd resolver), `http/` (Echo wrappers), `zlog` (forked from TiDB, zap+lumberjack), `sqlutil` (chainable query builder), `etcd` (service discovery with TTL lease), `snowflake` (ID gen)

## Communication flow

```
Client → personal-api (HTTP/JSON) → gRPC → personal-auth → MySQL + Redis
```

- personal-api discovers personal-auth via etcd custom resolver (`etcd:///grpclb/personal-auth`), round-robin load balancing
- personal-auth registers itself in etcd at `/grpclb/personal-auth/<host>:<port>` on startup

## Response format

All HTTP responses: `{ "code": int, "message": string, "data": ?any }`

gRPC status → HTTP mapping in `apps/personal-api/pkg/handler/route.go:grpcStatusToHTTP`:
- `InvalidArgument` → 400, `Unauthenticated` → 401, `PermissionDenied` → 403
- `NotFound` → 404, `AlreadyExists` → 409, `ResourceExhausted` → 429
- `Unimplemented` → 501, `Unavailable` → 503, `DeadlineExceeded` → 504
- default → 500

## Key conventions & quirks

- **Config**: TOML, loaded via Viper. Default location `<root>/etc/config.toml`. CLI flag `--config` to override.
- **Logging**: `zlog` (zap + lumberjack). Separate `data.log` and `access.log`. Rotation: 100MB, 30-day retain, 90 backups, gzip.
- **DB migration**: auto-creates DB + tables on personal-auth startup via `sqlutil.MigrateData()` with embedded `schema.sql`.
- **ID gen**: Snowflake (19-char zero-padded string IDs). Machine ID 1.
- **Auth tokens**: JWT (HMAC-SHA256, access token) + opaque refresh token in Redis. Default: access 1h, refresh 7d, max 10 tokens/account.
- **Login rate limit**: Redis-based. Default 5 max attempts, 2-min lockout.
- **Profile cache**: Redis cache-aside, 1h TTL.
- **Password hash**: PBKDF2, 600K iterations, SHA-256, 32-byte key, 16-byte random salt.
- **Protobuf**: proto files in `apps/<name>/adapter/`, compiled Go code in `apps/<name>/adapter/pb/`. Uses `protoc` from `third-party/protoc/`.
- **Vendor**: `vendor/` directory is gitignored. Run `make vendor` before Docker build.
- **Startup deps**: all infra (MySQL, Redis, etcd) must be reachable at startup — no graceful degradation.
- **Graceful shutdown**: `finalizer` package registers LIFO cleanup functions; SIGTERM triggers shutdown.
