# Personal Finance 微服务设计文档

**日期:** 2026-07-01
**项目:** personal-service (Go)
**版本:** 1.0

## 1. 概述

为现有 admin dashboard 的财务功能提供后端支持。新增 `personal-finance` gRPC 微服务，为每个用户提供三段独立的财务数据管理。

### 范围（分阶段）

| 阶段 | 功能 | 优先级 |
|------|------|--------|
| **Phase 1** | 收入与支出 | 当前实现 |
| Phase 2 | 投资组合 | 后续 |
| Phase 3 | 资产负债表 | 后续 |

本文档涵盖 Phase 1（收入与支出）的完整设计。

## 2. 微服务架构

### 2.1 服务拓扑

```
Client → personal-api (HTTP :8080) → personal-finance (gRPC :50002) → MySQL
                                      personal-auth  (gRPC :50001)
```

### 2.2 服务目录

```
apps/personal-finance/
├── main.go
├── cmd/
│   └── root.go              # 启动编排（同 personal-auth 模式）
├── conf/
│   └── etc/
│       └── config.toml       # 监听端口 50002, MySQL, etcd 等配置
├── adapter/
│   ├── finance.proto         # gRPC service + message 定义
│   └── pb/                   # protoc 生成的 .pb.go 文件
├── pkg/
│   ├── config/
│   │   └── config.go         # Viper 加载 TOML → struct
│   ├── model/
│   │   ├── errors.go         # ErrNotFound 哨兵
│   │   ├── category.go       # categories 表 CRUD
│   │   └── transaction.go    # transactions 表 CRUD
│   ├── server/
│   │   └── server.go         # DI: MySQL → etcd → service → gRPC
│   └── service/
│       └── finance.go        # gRPC handler 实现
└── scripts/
    ├── fs.go                 # //go:embed init-sql/*.sql
    └── init-sql/
        ├── 01_categories.sql
        └── 02_transactions.sql
```

### 2.3 与 personal-api 的集成

```
apps/personal-api/
└── pkg/
    ├── model/
    │   └── finance.go        # 请求/响应 struct + FinanceClient interface
    ├── service/
    │   └── finance.go        # model ↔ proto 转换 + gRPC 调用
    ├── handler/
    │   └── finance.go        # Echo handler, 绑定 JSON, 返回统一响应
    ├── provider/
    │   └── finance.go        # gRPC client 初始化
    └── server/
        └── server.go         # DI 加入 finance provider
```

### 2.4 复用

- `lib/grpc/server/` — gRPC 服务端封装 + etcd 注册
- `lib/grpc/middleware/` — 日志、recover、opentrace
- `lib/grpc/client/` — gRPC 客户端（需新增 finance.go）
- `lib/etcd/` — 服务发现
- `lib/db/mysql/` — MySQL client
- `lib/sqlutil/` — SQL 链式构建器
- `lib/finalizer/` — 优雅关闭
- `lib/procutil/` — 信号处理
- `lib/http/middleware/` — JWT 认证等
- `lib/http/server/` — Echo 服务端

### 2.5 用户身份

account_id 通过 JWT token 解析，通过 gRPC context metadata 传递。所有数据查询强制带 `account_id` 条件。

## 3. 数据库设计

### 3.1 `categories` — 收入/支出分类

```sql
CREATE TABLE categories (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT 'FK to accounts.account_id',
    name          VARCHAR(64)     NOT NULL COMMENT 'category name, e.g. 餐饮',
    type          TINYINT         NOT NULL COMMENT '1=income 2=expense',
    sort_order    INT             NOT NULL DEFAULT 0 COMMENT 'display order',
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_account_deleted (account_id, deleted_at),
    KEY idx_account_type (account_id, type, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- 每个用户的自定义分类列表（非全局预设）
- 软删除，`deleted_at = 0` 表示未删除
- 删除分类时，该分类下的交易记录保留（`category_id` 保留原值）

### 3.2 `transactions` — 交易记录

```sql
CREATE TABLE transactions (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT 'FK to accounts.account_id',
    category_id   BIGINT UNSIGNED NOT NULL COMMENT 'FK to categories.id',
    type          TINYINT         NOT NULL COMMENT '1=income 2=expense',
    name          VARCHAR(128)    NOT NULL COMMENT 'transaction name, e.g. 工资',
    amount        DECIMAL(15,2)   NOT NULL COMMENT 'positive amount',
    date          DATE            NOT NULL COMMENT 'transaction date',
    note          VARCHAR(256)    NOT NULL DEFAULT '' COMMENT 'optional note',
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_account_date (account_id, date, deleted_at),
    KEY idx_account_category (account_id, category_id, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- 金额统一正数存储，收入/支出通过 `type` 字段区分
- `date` 为 DATE 类型，支持按年月筛选
- `category_id` 为外键，允许级联到已删除分类

## 4. gRPC 接口定义

### 4.1 Proto 文件 (`adapter/finance.proto`)

```protobuf
syntax = "proto3";
package personal.finance;
option go_package = "apps/personal-finance/adapter/pb;pb";

// --- Messages ---

message Empty {}

enum FinanceType {
  FINANCE_TYPE_UNSPECIFIED = 0;
  FINANCE_TYPE_INCOME = 1;
  FINANCE_TYPE_EXPENSE = 2;
}

message Category {
  int64 id = 1;
  string account_id = 2;
  string name = 3;
  FinanceType type = 4;
  int32 sort_order = 5;
  int64 created_at = 6;
  int64 updated_at = 7;
}

message Transaction {
  int64 id = 1;
  string account_id = 2;
  int64 category_id = 3;
  FinanceType type = 4;
  string name = 5;
  double amount = 6;
  string date = 7;       // "YYYY-MM-DD"
  string note = 8;
  int64 created_at = 9;
  int64 updated_at = 10;
}

message ListCategoriesResponse {
  repeated Category categories = 1;
}

message CreateCategoryRequest {
  string name = 1;
  FinanceType type = 2;
  int32 sort_order = 3;
}

message UpdateCategoryRequest {
  int64 id = 1;
  string name = 2;
  FinanceType type = 3;
  int32 sort_order = 4;
}

message DeleteCategoryRequest {
  int64 id = 1;
}

message ListTransactionsRequest {
  int32 year = 1;
  int32 month = 2;        // 1-12
  int64 category_id = 3;  // optional filter
  int32 page = 4;
  int32 page_size = 5;
}

message ListTransactionsResponse {
  repeated Transaction transactions = 1;
  int32 total = 2;
}

message CreateTransactionRequest {
  int64 category_id = 1;
  FinanceType type = 2;
  string name = 3;
  double amount = 4;
  string date = 5;
  string note = 6;
}

message UpdateTransactionRequest {
  int64 id = 1;
  int64 category_id = 2;
  FinanceType type = 3;
  string name = 4;
  double amount = 5;
  string date = 6;
  string note = 7;
}

message DeleteTransactionRequest {
  int64 id = 1;
}

message GetMonthlySummaryRequest {
  int32 year = 1;
  int32 month = 2;
}

message MonthlySummary {
  double total_income = 1;
  double total_expense = 2;
  double net_balance = 3;
  repeated CategorySummary category_summaries = 4;
}

message CategorySummary {
  int64 category_id = 1;
  string category_name = 2;
  double total_amount = 3;
}

// --- Service ---

service Finance {
  // 分类管理
  rpc ListCategories(Empty) returns (ListCategoriesResponse);
  rpc CreateCategory(CreateCategoryRequest) returns (Category);
  rpc UpdateCategory(UpdateCategoryRequest) returns (Category);
  rpc DeleteCategory(DeleteCategoryRequest) returns (Empty);

  // 交易管理
  rpc ListTransactions(ListTransactionsRequest) returns (ListTransactionsResponse);
  rpc CreateTransaction(CreateTransactionRequest) returns (Transaction);
  rpc UpdateTransaction(UpdateTransactionRequest) returns (Transaction);
  rpc DeleteTransaction(DeleteTransactionRequest) returns (Empty);

  // 月度汇总
  rpc GetMonthlySummary(GetMonthlySummaryRequest) returns (MonthlySummary);
}
```

### 4.2 身份传递

account_id 通过 gRPC context metadata 传递（key: `x-account-id`），在 `personal-api` 的 Echo middleware 中从 JWT 解析后注入。

### 4.3 错误映射

| gRPC Code | 场景 |
|-----------|------|
| InvalidArgument | 请求参数错误 |
| NotFound | 分类/交易不存在 |
| FailedPrecondition | 删除分类时仍有交易引用（可选） |
| Internal | 数据库错误 |

## 5. HTTP API 路由

`personal-api` 中注册 `/api/v1/finance` 前缀路由：

| 方法 | 路径 | gRPC 映射 | 说明 |
|------|------|-----------|------|
| GET | `/api/v1/finance/categories` | ListCategories | 分类列表 |
| POST | `/api/v1/finance/categories` | CreateCategory | 新建分类 |
| PUT | `/api/v1/finance/categories/:id` | UpdateCategory | 更新分类 |
| DELETE | `/api/v1/finance/categories/:id` | DeleteCategory | 删除分类 |
| GET | `/api/v1/finance/transactions` | ListTransactions | 交易列表，支持 `year`、`month`、`category_id`、`page`、`page_size` query params |
| POST | `/api/v1/finance/transactions` | CreateTransaction | 新建交易 |
| PUT | `/api/v1/finance/transactions/:id` | UpdateTransaction | 更新交易 |
| DELETE | `/api/v1/finance/transactions/:id` | DeleteTransaction | 删除交易 |
| GET | `/api/v1/finance/summary` | GetMonthlySummary | 月度汇总，`?year=2026&month=7` |

响应格式遵循项目规范：`{ "code": int, "message": string, "data": ?any }`，错误映射使用现有的 `grpcStatusToHTTP`。

## 6. 数据结构（Go Model）

### category.go

```go
type Category struct {
    ID        int64
    AccountID string
    Name      string
    Type      int       // 1=income 2=expense
    SortOrder int
    DeletedAt int64
    CreatedAt int64
    UpdatedAt int64
}
```

CRUD: InsertCategory, SelectCategoriesByAccountID, SelectCategoryByID, UpdateCategoryByID, SoftDeleteCategoryByID

### transaction.go

```go
type Transaction struct {
    ID         int64
    AccountID  string
    CategoryID int64
    Type       int
    Name       string
    Amount     float64
    Date       string   // "2006-01-02"
    Note       string
    DeletedAt  int64
    CreatedAt  int64
    UpdatedAt  int64
}
```

CRUD: InsertTransaction, SelectTransactions, SelectTransactionByID, UpdateTransactionByID, SoftDeleteTransactionByID

查询条件：account_id + year/month + optional category_id + pagination

## 7. 实现顺序（Phase 1）

见 [writing-plans] 输出的实施计划。

## 8. 后续阶段（非当前范围）

### Phase 2: 投资组合
- 单独的服务扩展或合入 personal-finance
- 表：positions, trades, value_snapshots
- 需处理持仓计算、盈亏计算等业务逻辑

### Phase 3: 资产负债表
- 表：balance_sheet_items
- CRUD 风格，按年月组织
