# 资产负债表微服务设计文档

**日期:** 2026-07-02
**项目:** personal-service (Go)
**版本:** 1.0

## 1. 概述

为 admin dashboard 的资产负债表页面提供后端支持。作为 personal-finance 的 Phase 3 功能，在 `personal-core` 微服务中新增 `BalanceSheet` gRPC 服务。

### 范围

- 仅支持资产负债表条目 CRUD（按年月组织）
- 固定 5 个分类：流动资产、固定资产、流动负债、非流动负债、净资产
- 片区（资产/负债/净资产）由 section 字段显式标识

## 2. 服务拓扑

```
Client → personal-api (HTTP :8080) → personal-core (gRPC :50002) → MySQL
```

同一 `personal-core` 微服务内新增 `BalanceSheet` 服务，与 `CashFlow` 服务（原 `Finance`）并列。

## 3. 数据库设计

### 3.1 `balance_sheet_items` 表

```sql
CREATE TABLE IF NOT EXISTS balance_sheet_items (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT 'FK to accounts.account_id',
    section       TINYINT         NOT NULL COMMENT '1=asset 2=liability 3=equity',
    category      VARCHAR(32)     NOT NULL COMMENT '流动资产/固定资产/流动负债/非流动负债/净资产',
    name          VARCHAR(128)    NOT NULL COMMENT 'item name e.g. 现金及银行存款',
    amount        DECIMAL(15,2)   NOT NULL COMMENT 'positive amount in yuan',
    note          VARCHAR(256)    NOT NULL DEFAULT '' COMMENT 'optional note',
    date          VARCHAR(7)      NOT NULL COMMENT 'YYYY-MM',
    sort_order    INT             NOT NULL DEFAULT 0,
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_account_date (account_id, date, deleted_at),
    KEY idx_account_section (account_id, section, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- 金额统一正数存储，Go 模型用 `int64`（分），数据库用 `DECIMAL(15,2)`（元）
- `date` 为 `VARCHAR(7)`，格式 `YYYY-MM`，支持按年月筛选
- `section` 由后端根据 `category` 自动推导，写入时校验

### 3.2 category→section 映射

| category | section |
|----------|---------|
| 流动资产 | 1 (asset) |
| 固定资产 | 1 (asset) |
| 流动负债 | 2 (liability) |
| 非流动负债 | 2 (liability) |
| 净资产 | 3 (equity) |

## 4. gRPC 接口定义

### 4.1 `balance_sheet.proto`

```protobuf
syntax = "proto3";
package personal.core;
option go_package = "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb";

import "google/protobuf/empty.proto";

enum BalanceSheetSection {
  BALANCE_SHEET_SECTION_UNSPECIFIED = 0;
  BALANCE_SHEET_SECTION_ASSET = 1;
  BALANCE_SHEET_SECTION_LIABILITY = 2;
  BALANCE_SHEET_SECTION_EQUITY = 3;
}

message BalanceSheetItem {
  int64 id = 1;
  string account_id = 2;
  BalanceSheetSection section = 3;
  string category = 4;
  string name = 5;
  int64 amount = 6;
  string note = 7;
  string date = 8;
  int32 sort_order = 9;
  int64 created_at = 10;
  int64 updated_at = 11;
}

message ListItemsRequest {
  int32 year = 1;
  int32 month = 2;
}

message ListItemsResponse {
  repeated BalanceSheetItem items = 1;
}

message CreateItemRequest {
  string category = 1;
  string name = 2;
  int64 amount = 3;
  string note = 4;
  string date = 5;
  int32 sort_order = 6;
}

message UpdateItemRequest {
  int64 id = 1;
  string category = 2;
  string name = 3;
  int64 amount = 4;
  string note = 5;
  string date = 6;
  int32 sort_order = 7;
}

message DeleteItemRequest {
  int64 id = 1;
}

service BalanceSheet {
  rpc ListItems(ListItemsRequest) returns (ListItemsResponse);
  rpc CreateItem(CreateItemRequest) returns (BalanceSheetItem);
  rpc UpdateItem(UpdateItemRequest) returns (BalanceSheetItem);
  rpc DeleteItem(DeleteItemRequest) returns (google.protobuf.Empty);
}
```

### 4.2 身份传递

account_id 通过 gRPC context metadata 传递（key: `x-account-id`），复用现有机制。

### 4.3 错误映射

| gRPC Code | 场景 |
|-----------|------|
| InvalidArgument | 请求参数错误（name/amount/category/date/note 为空或无效，或 note 超 256 字符） |
| NotFound | 条目不存在 |
| Internal | 数据库错误 |

## 5. HTTP API 路由

`personal-api` 中注册 `/api/v1/cash-flow/balance-sheet` 前缀路由：

| 方法 | 路径 | gRPC 映射 | 说明 |
|------|------|-----------|------|
| GET | `/api/v1/cash-flow/balance-sheet/items` | ListItems | 列表，`?year=2026&month=7` |
| POST | `/api/v1/cash-flow/balance-sheet/items` | CreateItem | 新建条目 |
| PUT | `/api/v1/cash-flow/balance-sheet/items/:id` | UpdateItem | 更新条目 |
| DELETE | `/api/v1/cash-flow/balance-sheet/items/:id` | DeleteItem | 删除条目 |

响应格式遵循项目规范：`{ "code": int, "message": string, "data": ?any }`，错误映射复用 `grpcStatusToHTTP`。

## 6. 代码结构

### 6.1 personal-core 新增文件

| 文件 | 层 | 职责 |
|------|----|------|
| `adapter/balance_sheet.proto` | 接口定义 | gRPC service + message |
| `adapter/pb/balance_sheet.pb.go` | 生成 | protoc 生成的消息 |
| `adapter/pb/balance_sheet_grpc.pb.go` | 生成 | protoc 生成的接口 |
| `pkg/model/balance_sheet.go` | 数据访问 | 表模型 struct + CRUD (sqlutil 链式) |
| `pkg/service/balance_sheet.go` | 业务逻辑 | gRPC handler 实现 |
| `scripts/init-sql/03_balance_sheet_items.sql` | DDL | 建表 SQL |

### 6.2 personal-api 新增文件

| 文件 | 层 | 职责 |
|------|----|------|
| `pkg/model/balance_sheet.go` | 类型定义 | 请求/响应 struct + BalanceSheetClient interface |
| `pkg/service/balance_sheet.go` | 数据转换 | model ↔ proto 转换 + gRPC 调用 |
| `pkg/handler/balance_sheet.go` | HTTP 处理 | Echo handler, init() 注册路由 |
| `pkg/provider/balance_sheet.go` | 客户端初始化 | gRPC client 初始化 |

### 6.3 lib 新增文件

| 文件 | 职责 |
|------|------|
| `lib/grpc/client/balance_sheet.go` | gRPC 客户端连接工厂 |

### 6.4 修改文件

| 文件 | 修改内容 |
|------|---------|
| `personal-core/pkg/server/server.go` | 注册 BalanceSheet gRPC 服务 |
| `personal-api/pkg/server/server.go` | Dependencies 注入 BalanceSheetClient |

## 7. 数据结构（Go Model）

### balance_sheet.go (personal-core)

```go
type BalanceSheetItem struct {
    ID        int64
    AccountID string
    Section   int       // 1=asset 2=liability 3=equity
    Category  string
    Name      string
    Amount    int64     // cents
    Note      string
    Date      string    // YYYY-MM
    SortOrder int
    DeletedAt int64
    CreatedAt int64
    UpdatedAt int64
}

type ListItemsFilter struct {
    AccountID string
    Year      int
    Month     int
}
```

CRUD:
- `InsertItem(ctx, exec, item) (int64, error)`
- `SelectItems(ctx, exec, filter) ([]*BalanceSheetItem, error)`
- `SelectItemByID(ctx, exec, id) (*BalanceSheetItem, error)`
- `UpdateItemByID(ctx, exec, id, updates) (int64, error)`
- `SoftDeleteItemByID(ctx, exec, id, deletedAt) (int64, error)`

### balance_sheet.go (personal-api)

```go
type BalanceSheetItem struct {
    ID        int64                `json:"id"`
    AccountID string               `json:"account_id"`
    Section   int                  `json:"section"`
    Category  string               `json:"category"`
    Name      string               `json:"name"`
    Amount    int64                `json:"amount"`
    Note      string               `json:"note"`
    Date      string               `json:"date"`
    SortOrder int                  `json:"sort_order"`
    CreatedAt int64                `json:"created_at"`
    UpdatedAt int64                `json:"updated_at"`
}

type CreateItemRequest struct {
    Category  string `json:"category"`
    Name      string `json:"name"`
    Amount    int64  `json:"amount"`
    Note      string `json:"note"`
    Date      string `json:"date"`
    SortOrder int    `json:"sort_order"`
}

type UpdateItemRequest struct {
    ID        int64  `json:"id"`
    Category  string `json:"category"`
    Name      string `json:"name"`
    Amount    int64  `json:"amount"`
    Note      string `json:"note"`
    Date      string `json:"date"`
    SortOrder int    `json:"sort_order"`
}

type BalanceSheetClient interface {
    ListItems(ctx context.Context, accountID string, year int, month int) ([]BalanceSheetItem, error)
    CreateItem(ctx context.Context, accountID string, req *CreateItemRequest) (*BalanceSheetItem, error)
    UpdateItem(ctx context.Context, accountID string, req *UpdateItemRequest) (*BalanceSheetItem, error)
    DeleteItem(ctx context.Context, accountID string, id int64) error
}
```

## 8. 实现顺序

见实施计划（writing-plans 输出）。
