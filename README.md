# Personal Service

Personal account platform built with Go — HTTP API gateway (Echo v4) + gRPC auth/profile backend.

```
Client → personal-api (HTTP :8080) → gRPC → personal-auth (gRPC :50000) → MySQL + Redis
                                                ↓
                                             etcd (service discovery)
```

| Service | Role | Port |
|---------|------|------|
| `personal-api` | HTTP API gateway (Echo v4) | 8080 |
| `personal-auth` | gRPC auth + profile backend | 50000 |
| `personal-assets` | Stub (not implemented) | — |

## Quick Start

```sh
# Start dependencies (MySQL, Redis, etcd)
docker compose -f deployments/debug/docker-compose.yaml up -d

# Build and run auth service
make build app=personal-auth
bin/personal-auth -c apps/personal-auth/conf/etc/config.toml

# Build and run API gateway
make build app=personal-api
bin/personal-api -c apps/personal-api/conf/etc/config.toml
```

## API (prefix `/api/v1`)

All responses: `{ "code": int, "message": string, "data": ?any }`

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register account |
| POST | `/api/v1/auth/login` | Login (returns access + refresh token) |
| POST | `/api/v1/auth/token/refresh` | Refresh access token |
| POST | `/api/v1/auth/token/validate` | Validate access token |
| POST | `/api/v1/auth/token/revoke` | Revoke refresh token |

### Profile (requires JWT in `Authorization` header)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/profile/get` | Get profile |
| POST | `/api/v1/profile/update` | Update profile |

## Build

```sh
make fmt          # gofmt
make build        # build all apps → bin/
make build app=X  # build single app
make race         # CGO_ENABLED=1 + -race
make docker       # Docker multi-stage build
make compile      # compile protos → pb/
make clear        # rm -rf bin/personal-*
```

## Configuration

TOML via Viper. Default `<root>/etc/config.toml`, override with `--config`.

**personal-auth** (`apps/personal-auth/conf/etc/config.toml`):

```toml
[network]
bind_ip = "0.0.0.0"
bind_port = 50010

[mysql]
dsn = "root:root@tcp(127.0.0.1:3306)/personal_auth?charset=utf8mb4&parseTime=True&loc=Local"

[redis]
dsn = "redis://127.0.0.1:6379/0"

[etcd]
endpoints = ["127.0.0.1:2379"]

[auth]
access_token_expire = "1h"
refresh_token_expire = "168h"
signing_key = "change-me-to-a-secure-key"
max_login_attempts = 5
login_lock_duration = "2m"
```

**personal-api** (`apps/personal-api/conf/etc/config.toml`):

```toml
[network]
bind_ip = "0.0.0.0"
bind_port = 8080

[etcd]
endpoints = ["127.0.0.1:2379"]

[service]
auth_service_target = "etcd:///grpclb/personal-auth"
```

## Technology Stack

- **HTTP**: Echo v4
- **RPC**: gRPC + Protobuf
- **Discovery**: etcd (custom resolver, round-robin)
- **Database**: MySQL 8.0 (auto-migration on startup)
- **Cache**: Redis 7 (refresh tokens, profile cache, rate limiting)
- **Auth**: JWT (HMAC-SHA256 access token) + opaque refresh token (Redis)
- **Password**: PBKDF2 (SHA-256, 600K iterations, 32-byte key, 16-byte salt)
- **ID**: Snowflake (19-char zero-padded, machine ID 1)
- **Logging**: Zap + Lumberjack (rotation: 100MB, 30 days, 90 backups, gzip)
- **Tracing**: OpenTelemetry (Jaeger-compatible OTLP)
- **Circuit Breaker**: Hystrix (10s timeout, 100 max concurrent, 50% error threshold)
- **Config**: Viper / TOML

## Testing

```sh
go test ./apps/personal-api/...        # mock-based, no deps
go test ./apps/personal-auth/pkg/service/...  # mock-based, no deps
go test ./apps/personal-auth/pkg/model/...    # requires local MySQL
go test ./apps/personal-auth/pkg/cache/...    # requires local Redis
go test ./lib/...
```

## Deployment

```sh
make docker           # build all images
make docker app=X     # build single image

# Or via docker-compose
docker compose -f deployments/release/docker-compose.yaml up -d
```

Images are pushed to `registry.cn-beijing.aliyuncs.com/eviltomorrow`:

```sh
make push
```

## License

Apache 2.0
