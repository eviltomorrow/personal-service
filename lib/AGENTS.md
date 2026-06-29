# lib/ — Shared Go Packages

**Tech:** Go 1.26.3, 23 packages, 104+ files

## OVERVIEW

Shared infrastructure library used by both personal-api and personal-auth. Covers auth, database, networking, logging, service discovery, and utilities.

## PACKAGES

### Auth & Security
| Package | Files | Purpose |
|---------|-------|---------|
| `auth/` | 4 | JWT HMAC-SHA256 + opaque Redis state tokens |
| `encrypt/` | 2 | PBKDF2 password hashing (600K iterations) |

### gRPC Infrastructure
| Package | Files | Purpose |
|---------|-------|---------|
| `grpc/server/` | 2 | Server lifecycle + etcd auto-registration |
| `grpc/client/` | 2 | Client dialer (insecure, NoProxy) |
| `grpc/lb/` | 3 | Custom etcd resolver (round-robin + live watch) |
| `grpc/middleware/` | 10 | Log, recover, opentrace, circuitbreaker interceptors |

### HTTP Infrastructure
| Package | Files | Purpose |
|---------|-------|---------|
| `http/server/` | 1 | Echo server factory |
| `http/middleware/` | 3 | JWT, log, recover middleware |

### Storage & DB
| Package | Files | Purpose |
|---------|-------|---------|
| `sqlutil/` | 22 | Chainable SQL query builder (largest package) |
| `mysql/` | 2 | MySQL connection pool wrapper |
| `redis/` | 2 | Redis client wrapper |
| `etcd/` | 6 | Service discovery (register + client + TTL lease) |
| `minio/` | 2 | MinIO object storage client |
| `snowflake/` | 1 | ID generator (machine ID 1, 19-char zero-padded) |

### Utilities
| Package | Files | Purpose |
|---------|-------|---------|
| `zlog/` | 9 | Logging (forked from TiDB: zap + lumberjack) |
| `fsutil/` | 6 | File operations, embed, filelock |
| `timeutil/` | 3 | Duration parsing, tickers (aligned/rolling) |
| `netutil/` | 3 | IP/port utilities |
| `procutil/` | 4 | Signals, PID, daemonization, background |
| `finalizer/` | 1 | LIFO cleanup stack |
| `buildinfo/` | 3 | LDFLAGS-injected version metadata |
| `system/` | 2 | Runtime detection (dirs, hostname) |
| `opentrace/` | 2 | OpenTelemetry / Jaeger OTLP |

## KEY PATTERNS

- **Global package state**: `etcd.Client`, `mysql.DB`, `redis.Client`, `auth.SigningKey` set via `Init*()` functions, no graceful fallback
- **Retry on init**: MySQL/Redis/etcd retry 3 times at 3s intervals, then panic
- **Test isolation**: integration tests skip gracefully if infra unavailable via `os.Exit(0)` in `TestMain`

## IMPORTANT GOTCHAS

- `lib/grpc/client/auth.go` imports personal-auth `pb` types — breaks clean layering (lib depends on app)
- Circuit breaker (`grpc/middleware/circuitbreaker.go`) exists but NOT wired into interceptor chain
- Stream RPCs have NO middleware (no log, no tracing)
- `lib/log/config.go` vs `lib/zlog/config.go` — duplicate config types, overlapping concerns
