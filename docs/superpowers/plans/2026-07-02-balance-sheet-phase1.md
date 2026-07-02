# 资产负债表 (BalanceSheet) Phase 1 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在 personal-core 微服务中新增 BalanceSheet gRPC 服务，提供资产负债表的按月条目 CRUD，并对接前端页面。

**Architecture:** Next.js 前端 → api() fetch → personal-api HTTP → personal-core gRPC → MySQL。单表 `balance_sheet_items`，固定 5 个分类带 section 标识。

**Tech Stack:** Go 1.26, Echo v4, gRPC, protobuf, sqlutil, Next.js 15, React 19

## Global Constraints

- 所有删除使用软删除（deleted_at 时间戳）
- 金额在 Go 层用 int64（分），数据库用 DECIMAL(15,2)
- account_id 通过 gRPC context metadata 传递（key: `x-account-id`）
- HTTP 响应格式 `{ "code": int, "message": string, "data": ?any }`
- 分类固定为：流动资产/固定资产/流动负债/非流动负债/净资产
- section 映射：流动资产/固定资产→1(asset), 流动负债/非流动负债→2(liability), 净资产→3(equity)
- 遵循现有 sqlutil 链式模式、DI 函数变量模式

---

### Task 1: Proto + DDL + 编译

**Files:**
- Create: `apps/personal-core/adapter/balance_sheet.proto`
- Create: `apps/personal-core/scripts/init-sql/03_balance_sheet_items.sql`

**Interfaces:**
- Produces: `pb.BalanceSheetClient`, `pb.BalanceSheetServer`, `pb.BalanceSheetItem`, `pb.BalanceSheetSection`, request/response messages

- [ ] **Step 1: Create `adapter/balance_sheet.proto`**

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

- [ ] **Step 2: Create `scripts/init-sql/03_balance_sheet_items.sql`**

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

- [ ] **Step 3: Run make compile**

Run: `make compile`
Expected:
```
编译文件: .../adapter/balance_sheet.proto => [成功]
```

Verify generated files exist:
- `apps/personal-core/adapter/pb/balance_sheet.pb.go`
- `apps/personal-core/adapter/pb/balance_sheet_grpc.pb.go`

- [ ] **Step 4: Commit**

```bash
git add apps/personal-core/adapter/balance_sheet.proto apps/personal-core/scripts/init-sql/03_balance_sheet_items.sql apps/personal-core/adapter/pb/
git commit -m "feat: add BalanceSheet proto + DDL"
```

---

### Task 2: Model — personal-core 数据访问层

**Files:**
- Create: `apps/personal-core/pkg/model/balance_sheet.go`

**Interfaces:**
- Consumes: `dbmysql.Exec`, `sqlutil` chain builders
- Produces: `model.BalanceSheetItem`, `model.ListItemsFilter`, CRUD functions

- [ ] **Step 1: Create `pkg/model/balance_sheet.go`**

```go
package model

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"
	"time"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNameBalanceSheetItems = "balance_sheet_items"

const (
	FieldBSIAccountID  = "account_id"
	FieldBSISection    = "section"
	FieldBSICategory   = "category"
	FieldBSIName       = "name"
	FieldBSIAmount     = "amount"
	FieldBSINote       = "note"
	FieldBSIDate       = "date"
	FieldBSISortOrder  = "sort_order"
	FieldBSIDeletedAt  = "deleted_at"
	FieldBSICreatedAt  = "created_at"
	FieldBSIUpdatedAt  = "updated_at"
)

type BalanceSheetItem struct {
	ID        int64
	AccountID string
	Section   int
	Category  string
	Name      string
	Amount    int64
	Note      string
	Date      string
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

var BalanceSheetItemColumns = []string{
	FieldBSIAccountID, FieldBSISection, FieldBSICategory, FieldBSIName,
	FieldBSIAmount, FieldBSINote, FieldBSIDate, FieldBSISortOrder,
	FieldBSIDeletedAt, FieldBSICreatedAt, FieldBSIUpdatedAt,
}

var BalanceSheetItemColumnsWithID = append([]string{"id"}, BalanceSheetItemColumns...)

func scanBSItem(row *sql.Row) (*BalanceSheetItem, error) {
	item := &BalanceSheetItem{}
	var amountDec float64
	err := row.Scan(&item.ID, &item.AccountID, &item.Section, &item.Category,
		&item.Name, &amountDec, &item.Note, &item.Date, &item.SortOrder,
		&item.DeletedAt, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		return nil, err
	}
	item.Amount = int64(math.Round(amountDec * 100))
	return item, nil
}

func scanBSItems(rows *sql.Rows) ([]*BalanceSheetItem, error) {
	var list []*BalanceSheetItem
	for rows.Next() {
		item := &BalanceSheetItem{}
		var amountDec float64
		err := rows.Scan(&item.ID, &item.AccountID, &item.Section, &item.Category,
			&item.Name, &amountDec, &item.Note, &item.Date, &item.SortOrder,
			&item.DeletedAt, &item.CreatedAt, &item.UpdatedAt)
		if err != nil {
			return nil, err
		}
		item.Amount = int64(math.Round(amountDec * 100))
		list = append(list, item)
	}
	return list, nil
}

func InsertBalanceSheetItem(ctx context.Context, exec dbmysql.Exec, item *BalanceSheetItem) (int64, error) {
	return sqlutil.NewInsert(exec).Table(TableNameBalanceSheetItems).InsertCtx(ctx, map[string]interface{}{
		FieldBSIAccountID:  item.AccountID,
		FieldBSISection:    item.Section,
		FieldBSICategory:   item.Category,
		FieldBSIName:       item.Name,
		FieldBSIAmount:     float64(item.Amount) / 100.0,
		FieldBSINote:       item.Note,
		FieldBSIDate:       item.Date,
		FieldBSISortOrder:  item.SortOrder,
		FieldBSIDeletedAt:  item.DeletedAt,
		FieldBSICreatedAt:  item.CreatedAt,
		FieldBSIUpdatedAt:  item.UpdatedAt,
	})
}

func SelectBalanceSheetItems(ctx context.Context, exec dbmysql.Exec, filter *ListItemsFilter) ([]*BalanceSheetItem, error) {
	conds := []sqlutil.Condition{
		sqlutil.WithEq(FieldBSIAccountID, filter.AccountID),
		sqlutil.WithEq(FieldBSIDeletedAt, 0),
	}
	if filter.Year > 0 && filter.Month > 0 {
		dateStr := fmt.Sprintf("%04d-%02d", filter.Year, filter.Month)
		conds = append(conds, sqlutil.WithEq(FieldBSIDate, dateStr))
	}

	var list []*BalanceSheetItem
	err := sqlutil.NewQuery(exec).
		Columns(BalanceSheetItemColumnsWithID).
		Table(TableNameBalanceSheetItems).
		Where(conds...).
		OrderBy(sqlutil.ASC(FieldBSISection), sqlutil.ASC(FieldBSISortOrder)).
		QueryCtx(ctx, func(rows *sql.Rows) error {
			var err error
			list, err = scanBSItems(rows)
			return err
		})
	if err != nil {
		return nil, err
	}
	return list, nil
}

func SelectBalanceSheetItemByID(ctx context.Context, exec dbmysql.Exec, id int64) (*BalanceSheetItem, error) {
	var item *BalanceSheetItem
	err := sqlutil.NewQuery(exec).
		Columns(BalanceSheetItemColumnsWithID).
		Table(TableNameBalanceSheetItems).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldBSIDeletedAt, 0)).
		QueryOneCtx(ctx, func(row *sql.Row) error {
			var err error
			item, err = scanBSItem(row)
			return err
		})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return item, nil
}

func UpdateBalanceSheetItemByID(ctx context.Context, exec dbmysql.Exec, id int64, updates map[string]interface{}) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameBalanceSheetItems).
		Field(updates).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldBSIDeletedAt, 0)).
		UpdateCtx(ctx)
}

func SoftDeleteBalanceSheetItemByID(ctx context.Context, exec dbmysql.Exec, id int64, deletedAt int64) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameBalanceSheetItems).
		Field(map[string]interface{}{FieldBSIDeletedAt: deletedAt, FieldBSIUpdatedAt: deletedAt}).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldBSIDeletedAt, 0)).
		UpdateCtx(ctx)
}
```

- [ ] **Step 2: Build check**

Run: `go build ./apps/personal-core/pkg/model/...`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/personal-core/pkg/model/balance_sheet.go
git commit -m "feat: add balance sheet model + CRUD"
```

---

### Task 3: Service — personal-core gRPC handler

**Files:**
- Create: `apps/personal-core/pkg/service/balance_sheet.go`

**Interfaces:**
- Consumes: `model.BalanceSheetItem`, `model.ListItemsFilter`, CRUD functions (DI variables), `pb.BalanceSheetServer`
- Produces: `service.BalanceSheet` struct with 4 methods

- [ ] **Step 1: Create `pkg/service/balance_sheet.go`**

```go
package service

import (
	"context"
	"errors"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.uber.org/zap"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/personal-core/pkg/model"
)

var (
	insertBSItem         = model.InsertBalanceSheetItem
	selectBSItems        = model.SelectBalanceSheetItems
	selectBSItemByID     = model.SelectBalanceSheetItemByID
	updateBSItemByID     = model.UpdateBalanceSheetItemByID
	softDeleteBSItemByID = model.SoftDeleteBalanceSheetItemByID
)

func categoryToSection(category string) (pb.BalanceSheetSection, error) {
	switch category {
	case "流动资产", "固定资产":
		return pb.BalanceSheetSection_BALANCE_SHEET_SECTION_ASSET, nil
	case "流动负债", "非流动负债":
		return pb.BalanceSheetSection_BALANCE_SHEET_SECTION_LIABILITY, nil
	case "净资产":
		return pb.BalanceSheetSection_BALANCE_SHEET_SECTION_EQUITY, nil
	default:
		return pb.BalanceSheetSection_BALANCE_SHEET_SECTION_UNSPECIFIED, status.Error(codes.InvalidArgument, "invalid category")
	}
}

type BalanceSheet struct {
	pb.UnimplementedBalanceSheetServer
}

func NewBalanceSheet() *BalanceSheet {
	return &BalanceSheet{}
}

func (s *BalanceSheet) ListItems(ctx context.Context, req *pb.ListItemsRequest) (*pb.ListItemsResponse, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	filter := &model.ListItemsFilter{
		AccountID: accountID,
		Year:      int(req.Year),
		Month:     int(req.Month),
	}

	list, err := selectBSItems(ctx, selectDB(ctx), filter)
	if err != nil {
		zlog.Error("list balance sheet items failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	result := make([]*pb.BalanceSheetItem, 0, len(list))
	for _, item := range list {
		result = append(result, &pb.BalanceSheetItem{
			Id:        item.ID,
			AccountId: item.AccountID,
			Section:   pb.BalanceSheetSection(item.Section),
			Category:  item.Category,
			Name:      item.Name,
			Amount:    item.Amount,
			Note:      item.Note,
			Date:      item.Date,
			SortOrder: int32(item.SortOrder),
			CreatedAt: item.CreatedAt,
			UpdatedAt: item.UpdatedAt,
		})
	}
	return &pb.ListItemsResponse{Items: result}, nil
}

func (s *BalanceSheet) CreateItem(ctx context.Context, req *pb.CreateItemRequest) (*pb.BalanceSheetItem, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if len(req.Name) > 128 {
		return nil, status.Error(codes.InvalidArgument, "name too long")
	}
	if len(req.Note) > 256 {
		return nil, status.Error(codes.InvalidArgument, "note too long")
	}
	if req.Amount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be positive")
	}
	if req.Date == "" {
		return nil, status.Error(codes.InvalidArgument, "date is required")
	}

	section, err := categoryToSection(req.Category)
	if err != nil {
		return nil, err
	}

	n := now()
	item := &model.BalanceSheetItem{
		AccountID: accountID,
		Section:   int(section),
		Category:  req.Category,
		Name:      req.Name,
		Amount:    req.Amount,
		Note:      req.Note,
		Date:      req.Date,
		SortOrder: int(req.SortOrder),
		DeletedAt: 0,
		CreatedAt: n,
		UpdatedAt: n,
	}
	id, err := insertBSItem(ctx, selectDB(ctx), item)
	if err != nil {
		zlog.Error("create balance sheet item failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	item.ID = id
	return &pb.BalanceSheetItem{
		Id:        item.ID,
		AccountId: item.AccountID,
		Section:   pb.BalanceSheetSection(item.Section),
		Category:  item.Category,
		Name:      item.Name,
		Amount:    item.Amount,
		Note:      item.Note,
		Date:      item.Date,
		SortOrder: int32(item.SortOrder),
		CreatedAt: item.CreatedAt,
		UpdatedAt: item.UpdatedAt,
	}, nil
}

func (s *BalanceSheet) UpdateItem(ctx context.Context, req *pb.UpdateItemRequest) (*pb.BalanceSheetItem, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if len(req.Name) > 128 {
		return nil, status.Error(codes.InvalidArgument, "name too long")
	}
	if len(req.Note) > 256 {
		return nil, status.Error(codes.InvalidArgument, "note too long")
	}
	if req.Amount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be positive")
	}

	existing, err := selectBSItemByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "item not found")
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return nil, status.Error(codes.NotFound, "item not found")
	}

	section, err := categoryToSection(req.Category)
	if err != nil {
		return nil, err
	}

	n := now()
	_, err = updateBSItemByID(ctx, selectDB(ctx), req.Id, map[string]interface{}{
		model.FieldBSISection:   int(section),
		model.FieldBSICategory:  req.Category,
		model.FieldBSIName:      req.Name,
		model.FieldBSIAmount:    float64(req.Amount) / 100.0,
		model.FieldBSINote:      req.Note,
		model.FieldBSIDate:      req.Date,
		model.FieldBSISortOrder: int(req.SortOrder),
		model.FieldBSIUpdatedAt: n,
	})
	if err != nil {
		zlog.Error("update balance sheet item failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	return &pb.BalanceSheetItem{
		Id:        existing.ID,
		AccountId: existing.AccountID,
		Section:   section,
		Category:  req.Category,
		Name:      req.Name,
		Amount:    req.Amount,
		Note:      req.Note,
		Date:      req.Date,
		SortOrder: int32(req.SortOrder),
		CreatedAt: existing.CreatedAt,
		UpdatedAt: n,
	}, nil
}

func (s *BalanceSheet) DeleteItem(ctx context.Context, req *pb.DeleteItemRequest) (*emptypb.Empty, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	existing, err := selectBSItemByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return &emptypb.Empty{}, nil
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return &emptypb.Empty{}, nil
	}

	_, err = softDeleteBSItemByID(ctx, selectDB(ctx), req.Id, now())
	if err != nil {
		zlog.Error("delete balance sheet item failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	return &emptypb.Empty{}, nil
}
```

- [ ] **Step 2: Build check**

Run: `go build ./apps/personal-core/pkg/service/...`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/personal-core/pkg/service/balance_sheet.go
git commit -m "feat: add balance sheet gRPC handler"
```

---

### Task 4: Server — 注册 BalanceSheet 服务

**Files:**
- Modify: `apps/personal-core/pkg/server/server.go`

- [ ] **Step 1: Edit `pkg/server/server.go`**

Insert after `cashFlowSrv := service.NewCashFlow()`:

```go
	balanceSheetSrv := service.NewBalanceSheet()
```

Add to the gRPC registration function:

```go
		func(s *grpc.Server) {
			pb.RegisterCashFlowServer(s, cashFlowSrv)
			pb.RegisterBalanceSheetServer(s, balanceSheetSrv)
		},
```

- [ ] **Step 2: Verify imports**

Ensure `pb.RegisterBalanceSheetServer` resolves (from `pb` package). If the pb package was compiled correctly in Task 1, it should.

- [ ] **Step 3: Build check**

Run: `go build ./apps/personal-core/...`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/personal-core/pkg/server/server.go
git commit -m "feat: register BalanceSheet gRPC server"
```

---

### Task 5: lib gRPC client — 连接工厂

**Files:**
- Create: `lib/grpc/client/balance_sheet.go`

- [ ] **Step 1: Create `lib/grpc/client/balance_sheet.go`**

```go
package client

import (
	"fmt"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
)

func NewBalanceSheetClient(target string) (pb.BalanceSheetClient, func() error, error) {
	conn, err := dial(target)
	if err != nil {
		return nil, nil, fmt.Errorf("dial balance sheet service failure: %w", err)
	}
	return pb.NewBalanceSheetClient(conn), conn.Close, nil
}
```

- [ ] **Step 2: Build check**

Run: `go build ./lib/grpc/client/...`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/grpc/client/balance_sheet.go
git commit -m "feat: add BalanceSheet gRPC client factory"
```

---

### Task 6: personal-api model — DTO + interface

**Files:**
- Create: `apps/personal-api/pkg/model/balance_sheet.go`

- [ ] **Step 1: Create `pkg/model/balance_sheet.go`**

```go
package model

import "context"

type BalanceSheetItem struct {
	ID        int64  `json:"id"`
	AccountID string `json:"account_id"`
	Section   int    `json:"section"`
	Category  string `json:"category"`
	Name      string `json:"name"`
	Amount    int64  `json:"amount"`
	Note      string `json:"note"`
	Date      string `json:"date"`
	SortOrder int    `json:"sort_order"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

type CreateBSItemRequest struct {
	Category  string `json:"category"`
	Name      string `json:"name"`
	Amount    int64  `json:"amount"`
	Note      string `json:"note"`
	Date      string `json:"date"`
	SortOrder int    `json:"sort_order"`
}

type UpdateBSItemRequest struct {
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
	CreateItem(ctx context.Context, accountID string, req *CreateBSItemRequest) (*BalanceSheetItem, error)
	UpdateItem(ctx context.Context, accountID string, req *UpdateBSItemRequest) (*BalanceSheetItem, error)
	DeleteItem(ctx context.Context, accountID string, id int64) error
}
```

- [ ] **Step 2: Build check**

Run: `go build ./apps/personal-api/pkg/model/...`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/personal-api/pkg/model/balance_sheet.go
git commit -m "feat: add balance sheet DTOs + interface (api)"
```

---

### Task 7: personal-api service — 转换层

**Files:**
- Create: `apps/personal-api/pkg/service/balance_sheet.go`

- [ ] **Step 1: Create `pkg/service/balance_sheet.go`**

```go
package service

import (
	"context"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
)

type BalanceSheetService struct {
	client pb.BalanceSheetClient
}

func NewBalanceSheetService(client pb.BalanceSheetClient) *BalanceSheetService {
	return &BalanceSheetService{client: client}
}

func (s *BalanceSheetService) ListItems(ctx context.Context, accountID string, year int, month int) ([]model.BalanceSheetItem, error) {
	pbResp, err := s.client.ListItems(withAccountID(ctx, accountID), &pb.ListItemsRequest{
		Year:  int32(year),
		Month: int32(month),
	})
	if err != nil {
		return nil, err
	}
	result := make([]model.BalanceSheetItem, 0, len(pbResp.Items))
	for _, item := range pbResp.Items {
		result = append(result, model.BalanceSheetItem{
			ID:        item.Id,
			AccountID: item.AccountId,
			Section:   int(item.Section),
			Category:  item.Category,
			Name:      item.Name,
			Amount:    item.Amount,
			Note:      item.Note,
			Date:      item.Date,
			SortOrder: int(item.SortOrder),
			CreatedAt: item.CreatedAt,
			UpdatedAt: item.UpdatedAt,
		})
	}
	return result, nil
}

func (s *BalanceSheetService) CreateItem(ctx context.Context, accountID string, req *model.CreateBSItemRequest) (*model.BalanceSheetItem, error) {
	pbResp, err := s.client.CreateItem(withAccountID(ctx, accountID), &pb.CreateItemRequest{
		Category:  req.Category,
		Name:      req.Name,
		Amount:    req.Amount,
		Note:      req.Note,
		Date:      req.Date,
		SortOrder: int32(req.SortOrder),
	})
	if err != nil {
		return nil, err
	}
	return &model.BalanceSheetItem{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Section:   int(pbResp.Section),
		Category:  pbResp.Category,
		Name:      pbResp.Name,
		Amount:    pbResp.Amount,
		Note:      pbResp.Note,
		Date:      pbResp.Date,
		SortOrder: int(pbResp.SortOrder),
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *BalanceSheetService) UpdateItem(ctx context.Context, accountID string, req *model.UpdateBSItemRequest) (*model.BalanceSheetItem, error) {
	pbResp, err := s.client.UpdateItem(withAccountID(ctx, accountID), &pb.UpdateItemRequest{
		Id:        req.ID,
		Category:  req.Category,
		Name:      req.Name,
		Amount:    req.Amount,
		Note:      req.Note,
		Date:      req.Date,
		SortOrder: int32(req.SortOrder),
	})
	if err != nil {
		return nil, err
	}
	return &model.BalanceSheetItem{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Section:   int(pbResp.Section),
		Category:  pbResp.Category,
		Name:      pbResp.Name,
		Amount:    pbResp.Amount,
		Note:      pbResp.Note,
		Date:      pbResp.Date,
		SortOrder: int(pbResp.SortOrder),
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *BalanceSheetService) DeleteItem(ctx context.Context, accountID string, id int64) error {
	_, err := s.client.DeleteItem(withAccountID(ctx, accountID), &pb.DeleteItemRequest{Id: id})
	return err
}
```

- [ ] **Step 2: Build check**

Run: `go build ./apps/personal-api/pkg/service/...`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add apps/personal-api/pkg/service/balance_sheet.go
git commit -m "feat: add balance sheet service layer (api)"
```

---

### Task 8: personal-api handler — HTTP 路由

**Files:**
- Create: `apps/personal-api/pkg/handler/balance_sheet.go`
- Modify: `apps/personal-api/pkg/handler/router.go`

- [ ] **Step 1: Create `pkg/handler/balance_sheet.go`**

```go
package handler

import (
	"net/http"
	"strconv"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type BalanceSheetHandler struct {
	client model.BalanceSheetClient
}

func init() {
	Register(func(r *Router, deps *Dependencies) {
		h := &BalanceSheetHandler{client: deps.BalanceSheetClient}
		r.GET("/cash-flow/balance-sheet/items", h.ListItems)
		r.POST("/cash-flow/balance-sheet/items", h.CreateItem)
		r.PUT("/cash-flow/balance-sheet/items/:id", h.UpdateItem)
		r.DELETE("/cash-flow/balance-sheet/items/:id", h.DeleteItem)
	})
}

func (h *BalanceSheetHandler) ListItems(c echo.Context) error {
	year, _ := strconv.Atoi(c.QueryParam("year"))
	month, _ := strconv.Atoi(c.QueryParam("month"))
	resp, err := h.client.ListItems(tokenCtx(c), accountID(c), year, month)
	if err != nil {
		zlog.Error("balance sheet list items failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *BalanceSheetHandler) CreateItem(c echo.Context) error {
	var req model.CreateBSItemRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	resp, err := h.client.CreateItem(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("balance sheet create item failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *BalanceSheetHandler) UpdateItem(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	var req model.UpdateBSItemRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.ID = id
	resp, err := h.client.UpdateItem(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("balance sheet update item failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *BalanceSheetHandler) DeleteItem(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	if err := h.client.DeleteItem(tokenCtx(c), accountID(c), id); err != nil {
		zlog.Error("balance sheet delete item failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", nil)
}
```

- [ ] **Step 2: Modify `pkg/handler/router.go` — add BalanceSheetClient to Dependencies**

```go
type Dependencies struct {
	AuthClient        model.AuthClient
	CashFlowClient    model.CashFlowClient
	BalanceSheetClient model.BalanceSheetClient
}
```

- [ ] **Step 3: Build check**

Run: `go build ./apps/personal-api/pkg/handler/...`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/personal-api/pkg/handler/balance_sheet.go apps/personal-api/pkg/handler/router.go
git commit -m "feat: add balance sheet HTTP handlers"
```

---

### Task 9: personal-api provider — 初始化 + 注入

**Files:**
- Create: `apps/personal-api/pkg/provider/balance_sheet.go`
- Modify: `apps/personal-api/pkg/provider/provider.go`
- Modify: `apps/personal-api/pkg/server/server.go`

- [ ] **Step 1: Create `pkg/provider/balance_sheet.go`**

```go
package provider

import (
	grpcclient "github.com/eviltomorrow/personal-service/lib/grpc/client"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/service"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
)

var balanceSheetCli model.BalanceSheetClient

func initBalanceSheet(cfg *config.Config) error {
	pbClient, cleanup, err := grpcclient.NewBalanceSheetClient(cfg.Service.CoreServiceTarget)
	if err != nil {
		return err
	}
	finalizer.RegisterCleanupFuncs(cleanup)
	balanceSheetCli = service.NewBalanceSheetService(pbClient)
	return nil
}

func GetBalanceSheetClient() model.BalanceSheetClient {
	return balanceSheetCli
}
```

- [ ] **Step 2: Modify `pkg/provider/provider.go`**

```go
func Init(cfg *config.Config) error {
	if err := initAuth(cfg); err != nil {
		return err
	}
	if err := initCashFlow(cfg); err != nil {
		return err
	}
	return initBalanceSheet(cfg)
}
```

- [ ] **Step 3: Modify `pkg/server/server.go`**

```go
	deps := &handler.Dependencies{
		AuthClient:         provider.GetAuthClient(),
		CashFlowClient:     provider.GetCashFlowClient(),
		BalanceSheetClient: provider.GetBalanceSheetClient(),
	}
```

- [ ] **Step 4: Full build check**

Run: `go build ./apps/personal-core/... && go build ./apps/personal-api/... && go build ./lib/grpc/client/...`
Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add apps/personal-api/pkg/provider/balance_sheet.go apps/personal-api/pkg/provider/provider.go apps/personal-api/pkg/server/server.go
git commit -m "feat: wire BalanceSheet client into personal-api"
```

---

### Task 10: 前端 — 资产负债表对接 API

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/balance-sheet/page.tsx`

- [ ] **Step 1: Update imports and add API helper**

Add `import { api } from "@/lib/api";` (replace mock data approach with API calls).

- [ ] **Step 2: Refactor page to use API data instead of `createDefaultData()`**

Key changes:
- Replace `createDefaultData()` with `useEffect` that calls `api("/api/v1/cash-flow/balance-sheet/items?year=...&month=...")`
- Add loading, error states (same pattern as cash-flow page)
- Amounts come as cents from API → divide by 100 for display
- Add note field to add/edit modal (below date, "备注（可选）" text input)
- Keep the same fixed category/section grouping logic
- CRUD operations call POST/PUT/DELETE API endpoints
- Delete modal for category is removed (categories are fixed)

Detailed transformations:
- Response items have `section: 1|2|3`, `category: string`, `name`, `amount: int64(cents)`, `note`, `date: "YYYY-MM"`
- Frontend groups: section 1→assets, 2→liabilities, 3→equity
- Within each section, group by `category` field
- display: `formatCNY(item.amount / 100)`
- Submit: `amount: Math.round(parseFloat(value) * 100)`

- [ ] **Step 3: Build check**

Run: `cd apps/personal-web-admin && npx next build`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add apps/personal-web-admin/src/app/dashboard/balance-sheet/page.tsx
git commit -m "feat: connect balance sheet page to API"
```
