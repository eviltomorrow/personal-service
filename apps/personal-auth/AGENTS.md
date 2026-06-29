# apps/personal-auth — gRPC Auth & Profile Backend

**Tech:** Go 1.26.3, gRPC + Protobuf, port 50001

## OVERVIEW

Core business logic for authentication, authorization, and user profile management. Self-registers in etcd for service discovery. Auto-migrates MySQL schema on startup.

## KEY FILES

| File | Role |
|------|------|
| `pkg/service/auth.go` | 9 RPC implementations (599 lines) |
| `pkg/model/account.go` | Account CRUD via sqlutil |
| `pkg/model/account_auth.go` | Password hashing, token management |
| `pkg/model/login_history.go` | Rate limit tracking |
| `pkg/server/server.go` | DI: sql→mysql→redis→etcd→resolver→service→grpc |
| `adapter/auth.proto` | Protobuf service definition (9 RPCs) |
| `scripts/init-sql/` | Embedded SQL DDL (auto-migrated) |

## SERVICE LAYER PATTERNS

- **DI via package-level function variables**: `selectAccountByID = model.SelectAccountByAccountID`, `redisTTL = func(...)`, `jwtCreateToken = auth.JwtWithCreateToken`. Tests swap with `t.Cleanup()`.
- **Input validation first**: `status.Error(codes.InvalidArgument, msg)` at method start
- **Transaction pattern**: begin tx → defer Rollback → commit on success
- **Error mapping**: `sql.ErrNoRows` → `model.ErrNotFound` → `codes.NotFound`; MySQL 1062 → `codes.AlreadyExists`
- **Token rotation**: hash old refresh token, create new, delete old from Redis

## PROTO GUIDELINES

- `make compile` regenerates `adapter/pb/` from `adapter/auth.proto`
- DO NOT manually edit `pb/` generated files
- Embed `UnimplementedAuthServer` by VALUE (not pointer) — pointer causes nil dereference panic
- Field numbers increment sequentially, reserve tail for new fields
- Enums start with `UNSPECIFIED = 0`

## TEST COVERAGE GAPS

- `pkg/service/` — ZERO tests (DI pattern ready but unwritten)
- `pkg/model/` — ZERO tests (requires MySQL)
- `pkg/cache/` — ZERO tests (requires Redis)
