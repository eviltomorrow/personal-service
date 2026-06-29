# apps/personal-api — HTTP API Gateway

**Tech:** Go 1.26.3, Echo v4, port 8080

## OVERVIEW

Translates REST/JSON requests into gRPC calls to personal-auth. Handles auth, profile, token management. JWT validation at HTTP middleware level (skips register + login routes).

## KEY FILES

| File | Role |
|------|------|
| `pkg/handler/auth.go` | 8 HTTP handlers, route registration via init() |
| `pkg/handler/router.go` | Route map + grpcStatusToHTTP error mapping |
| `pkg/service/auth.go` | HTTP model ↔ protobuf translation, gRPC client calls |
| `pkg/provider/auth.go` | gRPC auth client wiring (etcd:///grpclb/personal-auth) |
| `pkg/server/server.go` | DI orchestration: etcd → resolver → provider → http |
| `pkg/model/auth.go` | Request/response DTOs |

## ARCHITECTURE

```
Client → Echo Handler → Service (protobuf) → gRPC → personal-auth
                                ↑
                     etcd resolver + round-robin LB
```

- Routes registered via `init()` plugin pattern (`Register()` callback)
- JWT middleware: parses Bearer token, sets `account_id`/`role` in echo context
- gRPC status → HTTP mapping in `utils.go` (NotFound→404, AlreadyExists→409, etc.)
- All responses: `{ "code": int, "message": string, "data": ?any }`

## TESTING

- Mock-based, no external deps
- Manual mock structs with function fields (`mockAuthClient`)
- `TestMain` initializes nop logger
