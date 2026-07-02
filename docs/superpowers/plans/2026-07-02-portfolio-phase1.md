# 投资组合 (Portfolio) Phase 1 实施计划

**Goal:** 在 personal-core 中新增 Portfolio gRPC 服务，提供持仓/交易/快照/配置的 CRUD，并对接前端页面。

**Architecture:** Next.js → api() → personal-api HTTP → personal-core gRPC → MySQL。4 张新表：positions, trades, value_snapshots, portfolio_config。

**Tech Stack:** Go 1.26, Echo v4, gRPC, protobuf, sqlutil, Next.js 15

## Global Constraints

- 所有删除使用软删除（deleted_at 时间戳）
- 金额用 int64（分），DB 用 DECIMAL(15,2)
- 保证金比例用 int32（基点），DB 用 INT
- account_id 通过 gRPC context metadata 传递
- HTTP 响应格式 `{ "code": int, "message": string, "data": ?any }`
- 遵循现有 sqlutil 链式模式、DI 函数变量模式

---

### Task 1: Proto + 4 DDL + 编译

**Files:**
- Create: `apps/personal-core/adapter/portfolio.proto`
- Create: `apps/personal-core/scripts/init-sql/04_positions.sql`
- Create: `apps/personal-core/scripts/init-sql/05_trades.sql`
- Create: `apps/personal-core/scripts/init-sql/06_value_snapshots.sql`
- Create: `apps/personal-core/scripts/init-sql/07_portfolio_config.sql`

- [ ] Create `adapter/portfolio.proto` with 4 enums, 12 messages, 4 services (Portfolio with Positions/Trades/Snapshots/Config)
- [ ] Create 4 DDL files per spec
- [ ] Run `make compile`
- [ ] Commit

### Task 2: Model — positions

**File:** `apps/personal-core/pkg/model/portfolio_position.go`

Position struct + ListItemsFilter + CRUD: Insert, SelectByAccountID, SelectByID, UpdateByID, SoftDeleteByID

### Task 3: Model — trades + snapshots + config

**Files:**
- `apps/personal-core/pkg/model/portfolio_trade.go`
- `apps/personal-core/pkg/model/portfolio_snapshot.go`
- `apps/personal-core/pkg/model/portfolio_config.go`

Trade struct + CRUD by position_id. Snapshot struct + Upsert (INSERT ON DUPLICATE KEY UPDATE). Config struct + GetByAccountID + Upsert.

### Task 4: Service — portfolio gRPC handler

**File:** `apps/personal-core/pkg/service/portfolio.go`

Portfolio struct with 12 methods: ListPositions, CreatePosition, UpdatePosition, DeletePosition, ListTrades, CreateTrade, UpdateTrade, DeleteTrade, ListSnapshots, UpsertSnapshot, GetConfig, UpdateConfig.

### Task 5: Server — register Portfolio service

**File:** `apps/personal-core/pkg/server/server.go`

Add `service.NewPortfolio()` and `pb.RegisterPortfolioServer(s, portfolioSrv)`.

### Task 6: lib gRPC client

**File:** `lib/grpc/client/portfolio.go`

`NewPortfolioClient(target string) (pb.PortfolioClient, func() error, error)`

### Task 7: personal-api model

**File:** `apps/personal-api/pkg/model/portfolio.go`

DTOs: Position, Trade, ValueSnapshot, PortfolioConfig. Interfaces: PortfolioClient with 12 methods. Request/response types.

### Task 8: personal-api service

**File:** `apps/personal-api/pkg/service/portfolio.go`

PortfolioService wrapping pb.PortfolioClient, converting model↔proto.

### Task 9: personal-api handler

**File:** `apps/personal-api/pkg/handler/portfolio.go`

PortfolioHandler with 12 Echo handlers, registered via init(). Routes under `/cash-flow/portfolio/`.

### Task 10: personal-api provider + wiring

**Files:**
- Create: `apps/personal-api/pkg/provider/portfolio.go`
- Modify: `apps/personal-api/pkg/provider/provider.go`
- Modify: `apps/personal-api/pkg/server/server.go`

### Task 11: Frontend — portfolio page API integration

**File:** `apps/personal-web-admin/src/app/dashboard/portfolio/page.tsx`

Replace local mock state with API calls. Add loading/error states. Integrate CRUD operations.
