# 投资组合 (Portfolio) 微服务设计文档

**日期:** 2026-07-02
**项目:** personal-service (Go)
**版本:** 1.0

## 1. 概述

为 admin dashboard 的投资组合页面提供后端支持。作为 personal-finance 的 Phase 2 功能，在 `personal-core` 微服务中新增 `Portfolio` gRPC 服务。

### 范围

- 持仓管理（股票/期货，做多/做空）
- 交易记录 CRUD（建仓/买入/卖出/清仓）
- 市值快照自动记录
- 用户配置（总本金）

## 2. 服务拓扑

```
Client → personal-api (HTTP :8080) → personal-core (gRPC :50002) → MySQL
```

同一 `personal-core` 微服务内新增 `Portfolio` 服务，与 `CashFlow`、`BalanceSheet` 并列。

## 3. 数据库设计

### 3.1 `positions` — 持仓

```sql
CREATE TABLE IF NOT EXISTS positions (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT 'FK to accounts.account_id',
    code          VARCHAR(32)     NOT NULL COMMENT '股票/期货代码, e.g. 600519.SH',
    name          VARCHAR(64)     NOT NULL COMMENT '名称, e.g. 贵州茅台',
    type          TINYINT         NOT NULL COMMENT '1=股票 2=期货',
    direction     TINYINT         NOT NULL COMMENT '1=做多 2=做空',
    initial_qty   INT             NOT NULL DEFAULT 0 COMMENT '初始持仓量',
    current_price DECIMAL(15,2)   NOT NULL DEFAULT 0 COMMENT '当前价格',
    margin_ratio  INT             NOT NULL DEFAULT 0 COMMENT '期货保证金比例, e.g. 1000=10.00%',
    sort_order    INT             NOT NULL DEFAULT 0 COMMENT '排序',
    archived      TINYINT(1)      NOT NULL DEFAULT 0 COMMENT '1=已归档',
    closed_pnl    DECIMAL(15,2)   NOT NULL DEFAULT 0 COMMENT '清仓盈亏',
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_account (account_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.2 `trades` — 交易记录

```sql
CREATE TABLE IF NOT EXISTS trades (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL,
    position_id   BIGINT UNSIGNED NOT NULL COMMENT 'FK to positions.id',
    type          TINYINT         NOT NULL COMMENT '1=建仓 2=买入 3=卖出 4=清仓',
    date          DATE            NOT NULL,
    price         DECIMAL(15,2)   NOT NULL COMMENT '成交价',
    quantity      INT             NOT NULL COMMENT '数量',
    note          VARCHAR(256)    NOT NULL DEFAULT '',
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_position (position_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.3 `value_snapshots` — 市值快照

```sql
CREATE TABLE IF NOT EXISTS value_snapshots (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL,
    date          DATE            NOT NULL,
    total_value   DECIMAL(15,2)   NOT NULL,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_account_date (account_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 3.4 `portfolio_config` — 用户配置

```sql
CREATE TABLE IF NOT EXISTS portfolio_config (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL,
    total_capital DECIMAL(15,2)   NOT NULL DEFAULT 0 COMMENT '总本金',
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_account (account_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 4. gRPC 接口定义

### 4.1 `portfolio.proto`

```protobuf
syntax = "proto3";
package personal.core;
option go_package = "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb";

import "google/protobuf/empty.proto";

enum PositionType {
  POSITION_TYPE_UNSPECIFIED = 0;
  POSITION_TYPE_STOCK = 1;
  POSITION_TYPE_FUTURES = 2;
}

enum TradeType {
  TRADE_TYPE_UNSPECIFIED = 0;
  TRADE_TYPE_OPEN = 1;    // 建仓
  TRADE_TYPE_BUY = 2;     // 买入
  TRADE_TYPE_SELL = 3;    // 卖出
  TRADE_TYPE_CLOSE = 4;   // 清仓
}

message Position {
  int64 id = 1;
  string account_id = 2;
  string code = 3;
  string name = 4;
  PositionType type = 5;
  string direction = 6;     // "做多" | "做空"
  int32 initial_qty = 7;
  int64 current_price = 8;  // cents
  int32 margin_ratio = 9;   // basis points (e.g. 1000 = 10%)
  int32 sort_order = 10;
  bool archived = 11;
  int64 closed_pnl = 12;    // cents
  int64 created_at = 13;
  int64 updated_at = 14;
}

message Trade {
  int64 id = 1;
  string account_id = 2;
  int64 position_id = 3;
  TradeType type = 4;
  string date = 5;
  int64 price = 6;          // cents
  int32 quantity = 7;
  string note = 8;
  int64 created_at = 9;
  int64 updated_at = 10;
}

message ValueSnapshot {
  string date = 1;
  int64 total_value = 2;
}

message PortfolioConfig {
  int64 total_capital = 1;  // cents
}

message ListPositionsResponse {
  repeated Position positions = 1;
}

message CreatePositionRequest {
  string code = 1;
  string name = 2;
  PositionType type = 3;
  string direction = 4;
  int32 initial_qty = 5;
  int64 current_price = 6;  // cents
  int32 margin_ratio = 7;
  int32 sort_order = 8;
}

message UpdatePositionRequest {
  int64 id = 1;
  string code = 2;
  string name = 3;
  PositionType type = 4;
  string direction = 5;
  int32 initial_qty = 6;
  int64 current_price = 7;
  int32 margin_ratio = 8;
  int32 sort_order = 9;
  bool archived = 10;
  int64 closed_pnl = 11;
}

message DeletePositionRequest {
  int64 id = 1;
}

message ListTradesRequest {
  int64 position_id = 1;
}

message ListTradesResponse {
  repeated Trade trades = 1;
}

message CreateTradeRequest {
  int64 position_id = 1;
  TradeType type = 2;
  string date = 3;
  int64 price = 4;
  int32 quantity = 5;
  string note = 6;
}

message UpdateTradeRequest {
  int64 id = 1;
  TradeType type = 2;
  string date = 3;
  int64 price = 4;
  int32 quantity = 5;
  string note = 6;
}

message DeleteTradeRequest {
  int64 id = 1;
}

message ListSnapshotsResponse {
  repeated ValueSnapshot snapshots = 1;
}

message UpsertSnapshotRequest {
  string date = 1;
  int64 total_value = 2;
}

message UpdateConfigRequest {
  int64 total_capital = 1;
}

service Portfolio {
  // Positions
  rpc ListPositions(google.protobuf.Empty) returns (ListPositionsResponse);
  rpc CreatePosition(CreatePositionRequest) returns (Position);
  rpc UpdatePosition(UpdatePositionRequest) returns (Position);
  rpc DeletePosition(DeletePositionRequest) returns (google.protobuf.Empty);

  // Trades
  rpc ListTrades(ListTradesRequest) returns (ListTradesResponse);
  rpc CreateTrade(CreateTradeRequest) returns (Trade);
  rpc UpdateTrade(UpdateTradeRequest) returns (Trade);
  rpc DeleteTrade(DeleteTradeRequest) returns (google.protobuf.Empty);

  // Snapshots
  rpc ListSnapshots(google.protobuf.Empty) returns (ListSnapshotsResponse);
  rpc UpsertSnapshot(UpsertSnapshotRequest) returns (ValueSnapshot);

  // Config
  rpc GetConfig(google.protobuf.Empty) returns (PortfolioConfig);
  rpc UpdateConfig(UpdateConfigRequest) returns (PortfolioConfig);
}
```

### 4.2 错误映射

| gRPC Code | 场景 |
|-----------|------|
| InvalidArgument | 请求参数错误（code/name/price/quantity 为空或无效） |
| NotFound | 持仓/交易不存在 |
| Internal | 数据库错误 |

## 5. HTTP API 路由

`personal-api` 中注册 `/api/v1/cash-flow/portfolio` 前缀路由：

| 方法 | 路径 | gRPC 映射 | 说明 |
|------|------|-----------|------|
| GET | `/api/v1/cash-flow/portfolio/positions` | ListPositions | 持仓列表 |
| POST | `/api/v1/cash-flow/portfolio/positions` | CreatePosition | 新增持仓 |
| PUT | `/api/v1/cash-flow/portfolio/positions/:id` | UpdatePosition | 更新持仓 |
| DELETE | `/api/v1/cash-flow/portfolio/positions/:id` | DeletePosition | 删除持仓 |
| GET | `/api/v1/cash-flow/portfolio/positions/:id/trades` | ListTrades | 交易记录 |
| POST | `/api/v1/cash-flow/portfolio/positions/:id/trades` | CreateTrade | 新增交易 |
| PUT | `/api/v1/cash-flow/portfolio/trades/:id` | UpdateTrade | 更新交易 |
| DELETE | `/api/v1/cash-flow/portfolio/trades/:id` | DeleteTrade | 删除交易 |
| GET | `/api/v1/cash-flow/portfolio/snapshots` | ListSnapshots | 市值快照 |
| POST | `/api/v1/cash-flow/portfolio/snapshots` | UpsertSnapshot | 创建/更新快照 |
| GET | `/api/v1/cash-flow/portfolio/config` | GetConfig | 获取配置 |
| PUT | `/api/v1/cash-flow/portfolio/config` | UpdateConfig | 更新总本金 |

## 6. 实现顺序

见实施计划（writing-plans 输出）。
