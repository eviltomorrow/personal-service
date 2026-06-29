# PROJECT KNOWLEDGE BASE

**Generated:** 2026-06-29T09:59:53Z
**Commit:** 2929e52
**Branch:** main
**Version:** 7.0.5

## OVERVIEW

Personal account platform (Go 1.26.3). Two Go microservices + one Next.js frontend:

| Service | Role | Tech | Port |
|---------|------|------|------|
| `apps/personal-api` | HTTP API gateway | Echo v4 | 8080 |
| `apps/personal-auth` | gRPC auth + profile | gRPC + Protobuf | 50001 |
| `apps/personal-web-admin` | Admin dashboard | Next.js 15 + React 19 | — |

API prefix: `/api/v1` (routes in `apps/personal-api/pkg/handler/router.go`)

## STRUCTURE

```
personal-service/
├── apps/
│   ├── personal-api/       # HTTP API gateway (Echo v4)
│   ├── personal-auth/      # gRPC auth service
│   └── personal-web-admin/ # Next.js admin frontend
├── lib/                    # 23 shared Go packages
├── build/                  # Build scripts (app_build.sh, docker_build.sh)
├── scripts/                # Ops scripts (proto compile, backup, docker push/pull)
├── deployments/            # Docker Compose (debug + release)
├── third-party/protoc/     # Vendored protoc binary
└── bin/                    # Build output (gitignored)
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Auth handler (HTTP) | `apps/personal-api/pkg/handler/auth.go` | Echo handlers, route registration via init() |
| Auth service (gRPC) | `apps/personal-auth/pkg/service/auth.go` | Core business logic (599 lines) |
| Route definitions | `apps/personal-api/pkg/handler/router.go` | gRPC→HTTP error mapping |
| JWT + state tokens | `lib/auth/` | HMAC-SHA256 + opaque Redis tokens |
| Password hashing | `lib/encrypt/pbkdf2.go` | PBKDF2, 600K iterations |
| SQL query builder | `lib/sqlutil/` | Chainable builder (22 files) |
| gRPC server wrapper | `lib/grpc/server/grpc.go` | Server lifecycle + etcd registration |
| Custom etcd resolver | `lib/grpc/lb/` | Round-robin LB with live watch |
| gRPC middleware | `lib/grpc/middleware/` | Log, recover, opentrace, circuitbreaker |
| HTTP middleware | `lib/http/middleware/` | JWT, log, recover |
| Service discovery | `lib/etcd/` | Registration + client |
| DB models (auth) | `apps/personal-auth/pkg/model/` | Account, AccountAuth, LoginHistory |
| API models | `apps/personal-api/pkg/model/auth.go` | Request/response DTOs |
| Server setup (API) | `apps/personal-api/pkg/server/server.go` | DI wiring |
| Server setup (Auth) | `apps/personal-auth/pkg/server/server.go` | DI wiring + schema migration |
| Startup orchestration | `apps/*/cmd/root.go` | Identical 3-phase bootstrap |
| Next.js frontend | `apps/personal-web-admin/` | Dashboard + login pages |
| Protobuf definition | `apps/personal-auth/adapter/auth.proto` | 9 RPCs |
| Frontend components | `apps/personal-web-admin/src/components/` | Shared UI |

## CODE MAP

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| `cmd.Run` | Function | `apps/*/cmd/root.go:21` | Startup orchestration entrypoint |
| `system.LoadRuntime` | Function | `lib/system/init.go:9` | Binary path, dirs, hostname detection |
| `finalizer.RunCleanupFuncs` | Function | `lib/finalizer/funcs.go:21` | LIFO cleanup on shutdown |
| `procutil.WaitForSigterm` | Function | `lib/procutil/signal.go:14` | Block until SIGINT/SIGQUIT/SIGTERM |
| `appserver.New` (API) | Function | `apps/personal-api/pkg/server/server.go` | DI wiring: etcd→resolver→provider→handler→http |
| `appserver.New` (Auth) | Function | `apps/personal-auth/pkg/server/server.go` | DI wiring: sql→mysql→redis→etcd→resolver→service→grpc |
| `grpcserver.NewGRPC` | Function | `lib/grpc/server/grpc.go` | gRPC server factory + etcd registration |
| `httpserver.NewHTTP` | Function | `lib/http/server/http.go` | Echo server factory |
| `handler.SetupRoutes` | Function | `apps/personal-api/pkg/handler/router.go` | Plugin-style route registration |
| `lb.NewBuilder` | Function | `lib/grpc/lb/builder.go` | Custom etcd resolver builder |
| `etcd.RegisterService` | Function | `lib/etcd/register.go` | Self-register in etcd with TTL lease |
| `auth.JwtWithCreateToken` | Function | `lib/auth/jwt.go` | Create JWT access token |
| `auth.JwtWithParseToken` | Function | `lib/auth/jwt.go` | Parse + validate JWT |
| `encrypt.Salt` | Function | `lib/encrypt/pbkdf2.go` | Generate 16-byte random salt (panics on failure) |
| `encrypt.Key` | Function | `lib/encrypt/pbkdf2.go` | PBKDF2 key derivation (600K iterations) |
| `sqlutil.Migrate` | Function | `lib/sqlutil/` | Auto-create DB + run DDL from directory |
| `Service.Register/Login/...` | Method | `apps/personal-auth/pkg/service/auth.go` | 9 gRPC service methods (~599 lines) |
| `AuthHandler.Register/Login/...` | Method | `apps/personal-api/pkg/handler/auth.go` | 8 HTTP handler methods |

## CONVENTIONS

### Code
- **No linter**: only `gofmt -l -s -w` (no golangci-lint, no vet)
- **Response format**: `{ "code": int, "message": string, "data": ?any }`
- **gRPC→HTTP mapping**: `utils.go:grpcStatusToHTTP`
- **Testing**: manual mocks only (no mockgen). `t.Cleanup()` for state restoration
- **Assertions**: `testify/assert` + `testify/require`

### Architecture
- **Startup**: All infra must be reachable at startup (MySQL, Redis, etcd) — no graceful degradation
- **DI pattern**: Package-level function variables swapped in tests via `t.Cleanup()`
- **Global state**: `etcd.Client`, `mysql.DB`, `redis.Client` set via `Init*()` at startup
- **Graceful shutdown**: `finalizer.RegisterCleanupFuncs` (LIFO), triggered by SIGTERM
- **Service discovery**: etcd custom resolver (`etcd:///grpclb/personal-auth`), round-robin LB

### Database
- **Soft delete**: all tables must have `deleted_at` field
- **Hard delete**: Only for association tables (e.g., `account_auths`)
- **Schema migration**: Embedded SQL via `//go:embed`, `sqlutil.Migrate()` on startup
- **Error mapping**: `sql.ErrNoRows` → `model.ErrNotFound` → gRPC `codes.NotFound`

### Auth
- **JWT**: HMAC-SHA256, default access 1h, refresh 7d, max 10 tokens/account
- **Rate limit**: 5 max attempts, 2-min lockout (Redis counter + lock)
- **Profile cache**: Redis cache-aside, 1h TTL
- **Password hash**: PBKDF2, 600K iterations, SHA-256, 32-byte key, 16-byte random salt

### Proto
- **Field numbers**: increment sequentially, reserve tail numbers for new fields
- **Enums**: must start with `UNSPECIFIED = 0`
- **DO NOT** manually edit `pb/` files — use `make compile`

## ANTI-PATTERNS (THIS PROJECT)

- **Circuit breaker fallback swallows errors**: `lib/grpc/middleware/circuitbreaker.go` returns `nil` on open circuit
- **JWT Parse doesn't validate signing algorithm**: `lib/auth/jwt.go:43` — potential algorithm confusion
- **PBKDF2 salt panics on failure**: `lib/encrypt/pbkdf2.go:14` — `panic(err)` instead of error return
- **Hardcoded Snowflake machine ID**: `lib/snowflake/id.go:11` — always 1
- **Default JWT signing key**: `lib/auth/jwt.go:12` — `[]byte("123")`, overridden at startup but weak default
- **No TLS in gRPC**: `lib/grpc/client/client.go:15` — `insecure.NewCredentials()`
- **Global mutable state**: `etcd.Client`, `mysql.DB`, `redis.Client`, `auth.SigningKey`
- **No CI pipeline**: zero `.github/workflows/` — no automated tests, lint, or build
- **Dockerfile uses `latest` tags**: `golang:latest`, `alpine:latest` — non-deterministic
- **No `.dockerignore`**: bloated Docker context (node_modules, vendor, bin)
- **Stream RPCs lack middleware**: no logging or tracing for streaming gRPC calls
- **personal-auth service/model/cache**: zero test coverage (documented but absent)

## UNIQUE STYLES

- **`apps/` instead of `cmd/`**: monorepo-style service directory with Go + Next.js
- **`init()` route registration**: handlers self-register via `Register()` in `init()` — plugin pattern
- **`lib/` imports `app/` pb types**: `lib/grpc/client/auth.go` imports personal-auth's generated pb — breaks clean layering
- **Double-fork daemonization**: custom `procutil.RunAppInBackground` with TCP pingback
- **Two log files**: `data.log` (app) + `access.log` (HTTP/gRPC access), both Lumberjack-rotated
- **`make fmt` runs before every build**: controversial — `make build` depends on `make fmt`

## COMMANDS

```sh
make fmt              # gofmt -l -s -w (no linter/typecheck beyond this)
make build            # CGO_ENABLED=0 build all apps → bin/
make build app=X      # build a single app
make race             # CGO_ENABLED=1 + -race flag, all apps
make compile          # compile .proto files → pb/
make vendor           # go mod vendor (requires GOWORK=off)
make docker           # multi-stage Docker build (all apps)
make docker app=X     # single-app Docker build
make clear            # rm -rf bin/personal-*
make push             # docker push to registry.cn-beijing.aliyuncs.com/eviltomorrow

go test ./...                         # all tests
go test ./apps/personal-api/...       # mock-based, no deps
go test ./apps/personal-auth/pkg/service/...  # mock-based (NO TESTS EXIST)
go test ./lib/...                     # mixed unit + integration
```

## NOTES

- **Version**: in `version` file (currently 7.0.5), no git tags
- **LDFLAGS**: inject `main.AppName`, `main.MainVersion`, `main.GitSha`, `main.BuildTime`
- **Vendor**: `vendor/` is gitignored. Run `make vendor` before Docker build
- **Config**: TOML, loaded via Viper. Default `<root>/etc/config.toml`, CLI `--config` to override
- **Config search**: both apps look for `<etcDir>/config.toml` where `etcDir` is detected by `LoadRuntime()`
- **No go.work**: single Go module, `GOWORK=off go mod vendor`
- **Hystrix circuit breaker**: configured (10s timeout, 50% threshold) but NOT wired into interceptor chain
- **Default dev configs differ**: template defaults (5m/30m token expiry) differ from documented defaults (1h/7d)
- **Port inconsistency**: docs say 50000 for personal-auth gRPC, but default config uses 50001
