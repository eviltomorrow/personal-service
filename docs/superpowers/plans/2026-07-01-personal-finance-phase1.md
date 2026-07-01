# Personal Finance Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `personal-finance` gRPC microservice + `personal-api` HTTP routes for Income & Expense recording.

**Architecture:** New `personal-finance` gRPC service (port 50002) registered in etcd. `personal-api` proxies HTTP → gRPC. Two MySQL tables (`categories`, `transactions`), per-user data isolation via `account_id` from JWT.

**Tech Stack:** Go 1.26.3, gRPC + Protobuf, Echo v4, etcd, MySQL (via `lib/sqlutil`)

---

## File Map

### personal-finance service (new)

| File | Responsibility |
|------|---------------|
| `apps/personal-finance/main.go` | `package main`, calls `cmd.Run()` |
| `apps/personal-finance/cmd/root.go` | Flag → config → log → server → sigterm (same pattern as personal-auth) |
| `apps/personal-finance/adapter/finance.proto` | 9 RPCs: List/Create/Update/Delete categories + transactions + GetMonthlySummary. Uses `google.protobuf.Empty` |
| `apps/personal-finance/pkg/config/config.go` | Viper TOML config struct (no Redis, no Auth fields) |
| `apps/personal-finance/conf/etc/config.toml` | Default config with port 50002 |
| `apps/personal-finance/scripts/fs.go` | `//go:embed init-sql/*.sql` |
| `apps/personal-finance/scripts/init-sql/01_categories.sql` | CREATE TABLE categories |
| `apps/personal-finance/scripts/init-sql/02_transactions.sql` | CREATE TABLE transactions |
| `apps/personal-finance/pkg/model/errors.go` | `ErrNotFound` sentinel |
| `apps/personal-finance/pkg/model/category.go` | Category struct + CRUD via sqlutil |
| `apps/personal-finance/pkg/model/transaction.go` | Transaction struct + CRUD via sqlutil |
| `apps/personal-finance/pkg/service/finance.go` | 9 gRPC handler methods |
| `apps/personal-finance/pkg/server/server.go` | DI: embed SQL → migrate → MySQL → etcd → resolver → service → gRPC |

### personal-api additions

| File | Responsibility |
|------|---------------|
| `lib/grpc/client/finance.go` | `NewFinanceClient(target)` → returns pb.FinanceClient |
| `apps/personal-api/pkg/model/finance.go` | Request/response DTOs + `FinanceClient` interface |
| `apps/personal-api/pkg/service/finance.go` | model ↔ proto conversion + gRPC calls |
| `apps/personal-api/pkg/handler/finance.go` | 9 Echo handlers, init() route registration |
| `apps/personal-api/pkg/provider/finance.go` | gRPC client init |
| `apps/personal-api/pkg/config/config.go` | Add `FinanceServiceTarget` to `ServiceConfig` |

### Build changes

| File | Change |
|------|--------|
| `Makefile` | Add personal-finance target |
| `build/app_build.sh` | Add personal-finance to build loop |

---

## Task 1: Project Skeleton + Proto + SQL

**Files:**
- Create: `apps/personal-finance/main.go`
- Create: `apps/personal-finance/cmd/root.go`
- Create: `apps/personal-finance/adapter/finance.proto`
- Create: `apps/personal-finance/pkg/config/config.go`
- Create: `apps/personal-finance/conf/etc/config.toml`
- Create: `apps/personal-finance/scripts/fs.go`
- Create: `apps/personal-finance/scripts/init-sql/01_categories.sql`
- Create: `apps/personal-finance/scripts/init-sql/02_transactions.sql`
- Modify: `Makefile`
- Modify: `build/app_build.sh`

**Interfaces:**
- Consumes: nothing (scaffold)
- Produces: protobuf messages + service definition, SQL DDL, compilable binary skeleton

- [ ] **Step 1: Create `adapter/finance.proto`**

```protobuf
syntax = "proto3";

package personal.finance;

option go_package = "github.com/eviltomorrow/personal-service/apps/personal-finance/adapter/pb";

import "google/protobuf/empty.proto";

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
  string date = 7;
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
  int32 month = 2;
  int64 category_id = 3;
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

message CategorySummary {
  int64 category_id = 1;
  string category_name = 2;
  double total_amount = 3;
}

message MonthlySummary {
  double total_income = 1;
  double total_expense = 2;
  double net_balance = 3;
  repeated CategorySummary category_summaries = 4;
}

service Finance {
  rpc ListCategories(google.protobuf.Empty) returns (ListCategoriesResponse);
  rpc CreateCategory(CreateCategoryRequest) returns (Category);
  rpc UpdateCategory(UpdateCategoryRequest) returns (Category);
  rpc DeleteCategory(DeleteCategoryRequest) returns (google.protobuf.Empty);

  rpc ListTransactions(ListTransactionsRequest) returns (ListTransactionsResponse);
  rpc CreateTransaction(CreateTransactionRequest) returns (Transaction);
  rpc UpdateTransaction(UpdateTransactionRequest) returns (Transaction);
  rpc DeleteTransaction(DeleteTransactionRequest) returns (google.protobuf.Empty);

  rpc GetMonthlySummary(GetMonthlySummaryRequest) returns (MonthlySummary);
}
```

- [ ] **Step 2: Create `scripts/init-sql/01_categories.sql`**

```sql
CREATE TABLE IF NOT EXISTS categories (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT 'FK to accounts.account_id',
    name          VARCHAR(64)     NOT NULL COMMENT 'category name',
    type          TINYINT         NOT NULL COMMENT '1=income 2=expense',
    sort_order    INT             NOT NULL DEFAULT 0,
    deleted_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    updated_at    BIGINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_account_deleted (account_id, deleted_at),
    KEY idx_account_type (account_id, type, deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 3: Create `scripts/init-sql/02_transactions.sql`**

```sql
CREATE TABLE IF NOT EXISTS transactions (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    VARCHAR(32)     NOT NULL COMMENT 'FK to accounts.account_id',
    category_id   BIGINT UNSIGNED NOT NULL COMMENT 'FK to categories.id',
    type          TINYINT         NOT NULL COMMENT '1=income 2=expense',
    name          VARCHAR(128)    NOT NULL COMMENT 'transaction name',
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

- [ ] **Step 4: Create `scripts/fs.go`**

```go
package scripts

import "embed"

//go:embed init-sql/*.sql
var FS embed.FS
```

- [ ] **Step 5: Create `pkg/config/config.go`**

```go
package config

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/etcd"
	"github.com/eviltomorrow/personal-service/lib/flagsutil"
	"github.com/eviltomorrow/personal-service/lib/log"
	"github.com/eviltomorrow/personal-service/lib/netutil"
	"github.com/eviltomorrow/personal-service/lib/opentrace"
	"github.com/eviltomorrow/personal-service/lib/system"
	jsoniter "github.com/json-iterator/go"
	"github.com/spf13/viper"
)

type Config struct {
	Network   netutil.Config   `json:"network" toml:"network" mapstructure:"network"`
	Log       log.Config       `json:"log" toml:"log" mapstructure:"log"`
	MySQL     mysql.Config     `json:"mysql" toml:"mysql" mapstructure:"mysql"`
	Etcd      etcd.Config      `json:"etcd" toml:"etcd" mapstructure:"etcd"`
	Opentrace opentrace.Config `json:"opentrace" toml:"opentrace" mapstructure:"opentrace"`
}

var DefaultConfig = Config{
	Network: netutil.Config{
		BindIP:     "0.0.0.0",
		BindPort:   50002,
		DisableTLS: true,
	},
	Log: log.Config{
		Level: "info",
	},
	MySQL: mysql.Config{
		DSN:                "root:root@tcp(127.0.0.1:3306)/personal_finance?charset=utf8mb4&parseTime=True&loc=Local",
		MinOpen:            3,
		MaxOpen:            10,
		MaxLifetime:        300 * time.Second,
		ConnectTimeout:     10 * time.Second,
		StartupRetryTimes:  3,
		StartupRetryPeriod: 3 * time.Second,
	},
	Etcd: etcd.Config{
		Endpoints:          []string{"127.0.0.1:2379"},
		ConnectTimeout:     10 * time.Second,
		StartupRetryTimes:  3,
		StartupRetryPeriod: 3 * time.Second,
	},
	Opentrace: opentrace.Config{
		Enable:         false,
		DSN:            "",
		ConnectTimeout: 10 * time.Second,
	},
}

func (c *Config) String() string {
	data := map[string]interface{}{
		"network": c.Network,
		"log":     c.Log,
		"mysql": map[string]interface{}{
			"dsn":                  c.MySQL.DSN,
			"min_open":             c.MySQL.MinOpen,
			"max_open":             c.MySQL.MaxOpen,
			"max_lifetime":         c.MySQL.MaxLifetime.String(),
			"connect_timeout":      c.MySQL.ConnectTimeout.String(),
			"startup_retry_times":  c.MySQL.StartupRetryTimes,
			"startup_retry_period": c.MySQL.StartupRetryPeriod.String(),
		},
		"etcd": map[string]interface{}{
			"endpoints":            c.Etcd.Endpoints,
			"connect_timeout":      c.Etcd.ConnectTimeout.String(),
			"startup_retry_times":  c.Etcd.StartupRetryTimes,
			"startup_retry_period": c.Etcd.StartupRetryPeriod.String(),
		},
		"opentrace": map[string]interface{}{
			"enable":          c.Opentrace.Enable,
			"dsn":             c.Opentrace.DSN,
			"connect_timeout": c.Opentrace.ConnectTimeout.String(),
		},
	}
	buf, _ := jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(data)
	return string(buf)
}

func (c *Config) ApplyOpts(opts *flagsutil.Flags) {
	c.Log.DisableStdlog = opts.DisableStdlog
}

func (c *Config) ResetSystem() {
	if c.Network.BindIP != "" {
		system.Network.SetBindIP(c.Network.BindIP)
	} else {
		system.Network.SetBindIP("0.0.0.0")
	}
	if c.Network.AccessIP != "" {
		system.Network.SetAccessIP(c.Network.AccessIP)
	} else if system.Network.BindIP() == "0.0.0.0" {
		ip, err := netutil.GetInterfaceIPv4First()
		if err != nil {
			system.Network.SetAccessIP("0.0.0.0")
		} else {
			system.Network.SetAccessIP(ip)
		}
	} else {
		system.Network.SetAccessIP(system.Network.BindIP())
	}
}

func ReadConfigFromFile(opts *flagsutil.Flags) (*Config, error) {
	findConfigFile := func(path string) (string, error) {
		for _, p := range []string{
			path,
			filepath.Join(system.Directory.EtcDir(), "config.toml"),
		} {
			fi, err := os.Stat(p)
			if err == nil && !fi.IsDir() {
				return p, nil
			}
		}
		return "", fmt.Errorf("not found config file")
	}

	configFile, err := findConfigFile(opts.ConfigFile)
	if err != nil {
		return nil, err
	}

	v := viper.New()
	v.SetConfigFile(configFile)
	v.SetConfigType("toml")

	if err := v.ReadInConfig(); err != nil {
		return nil, err
	}

	cfg := DefaultConfig
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	cfg.ApplyOpts(opts)
	cfg.ResetSystem()

	return &cfg, nil
}
```

- [ ] **Step 6: Create `conf/etc/config.toml`**

```toml
[network]
bind_ip = "0.0.0.0"
bind_port = 50002
disable_tls = true

[log]
level = "info"

[mysql]
dsn = "root:root@tcp(127.0.0.1:3306)/personal_finance?charset=utf8mb4&parseTime=True&loc=Local"
min_open = 3
max_open = 10
max_lifetime = "300s"
connect_timeout = "10s"
startup_retry_times = 3
startup_retry_period = "3s"

[etcd]
endpoints = ["127.0.0.1:2379"]
connect_timeout = "10s"
startup_retry_times = 3
startup_retry_period = "3s"

[opentrace]
enable = false
dsn = ""
connect_timeout = "10s"
```

- [ ] **Step 7: Create `cmd/root.go`**

Copy from `apps/personal-auth/cmd/root.go`. Replace imports:
- `appconfig "github.com/eviltomorrow/personal-service/apps/personal-finance/pkg/config"`
- `appserver "github.com/eviltomorrow/personal-service/apps/personal-finance/pkg/server"`

Everything else is identical (3-phase bootstrap: flag → config → log → server → sigterm).

- [ ] **Step 8: Create `main.go`**

```go
package main

import (
	"fmt"
	"os"

	"github.com/eviltomorrow/personal-service/apps/personal-finance/cmd"
)

var (
	AppName    = "personal-finance"
	MainVersion = "7.0.5"
	GitSha     = "0000000"
	BuildTime  = "0000-00-00T00:00:00Z"
)

func main() {
	if err := cmd.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "%s\n", err)
		os.Exit(1)
	}
}
```

- [ ] **Step 9: Compile proto**

Run: `make compile` (regenerates `adapter/pb/*.pb.go`)

- [ ] **Step 10: Create `pkg/server/server.go` skeleton**

```go
package server

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	"github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/etcd"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
	"github.com/eviltomorrow/personal-service/lib/fsutil"
	lb "github.com/eviltomorrow/personal-service/lib/grpc/lb"
	grpcserver "github.com/eviltomorrow/personal-service/lib/grpc/server"
	"github.com/eviltomorrow/personal-service/lib/opentrace"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
	"github.com/eviltomorrow/personal-service/lib/system"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/resolver"

	pb "github.com/eviltomorrow/personal-service/apps/personal-finance/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/personal-finance/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-finance/pkg/service"
	"github.com/eviltomorrow/personal-service/apps/personal-finance/scripts"
)

type Server struct {
	*grpcserver.GRPC
}

func initComponent(name string, fn func() (func() error, error)) error {
	close, err := fn()
	if err != nil {
		return fmt.Errorf("init %s failure: %w", name, err)
	}
	if close != nil {
		finalizer.RegisterCleanupFuncs(close)
	}
	zlog.Info(fmt.Sprintf("%s initialized", name))
	return nil
}

func initSchema(c *mysql.Config) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := sqlutil.Migrate(ctx, c.DSN, filepath.Join(system.Directory.UsrDir(), "init-sql")); err != nil {
		return fmt.Errorf("migrate schema failure: %w", err)
	}
	zlog.Info("database schema initialized")
	return nil
}

func New(cfg *config.Config) (*Server, error) {
	if err := fsutil.WriteEmbedFSToDisk(scripts.FS, system.Directory.UsrDir()); err != nil {
		return nil, fmt.Errorf("write embedded scripts to disk failure: %w", err)
	}

	if err := initSchema(&cfg.MySQL); err != nil {
		return nil, fmt.Errorf("init schema failure: %w", err)
	}

	if err := initComponent("mysql", func() (func() error, error) { return mysql.InitMySQL(&cfg.MySQL) }); err != nil {
		return nil, err
	}
	if err := initComponent("etcd", func() (func() error, error) { return etcd.InitEtcd(&cfg.Etcd) }); err != nil {
		return nil, err
	}
	if err := initComponent("opentrace", func() (func() error, error) {
		if !cfg.Opentrace.Enable {
			return nil, nil
		}
		return opentrace.InitTraceProvider(&cfg.Opentrace)
	}); err != nil {
		return nil, err
	}

	resolver.Register(lb.NewBuilder(etcd.Client))

	financeSrv := service.NewFinance()

	grpc := grpcserver.NewGRPC(
		&cfg.Network,
		&cfg.Log,
		func(s *grpc.Server) {
			pb.RegisterFinanceServer(s, financeSrv)
		},
	)

	return &Server{GRPC: grpc}, nil
}
```

- [ ] **Step 11: Update build scripts**

In `Makefile`, add personal-finance to build targets. In `build/app_build.sh`, add the personal-finance app name to the build loop.

Run: `make build app=personal-finance` to verify compilation.

---

## Task 2: Data Model Layer

**Files:**
- Create: `apps/personal-finance/pkg/model/errors.go`
- Create: `apps/personal-finance/pkg/model/category.go`
- Create: `apps/personal-finance/pkg/model/transaction.go`

**Interfaces:**
- Consumes: `lib/sqlutil`, `lib/db/mysql`
- Produces: `model.Category`, `model.Transaction` structs + CRUD functions

- [ ] **Step 1: Create `pkg/model/errors.go`**

```go
package model

import "errors"

var ErrNotFound = errors.New("record not found")
```

- [ ] **Step 2: Create `pkg/model/category.go`**

```go
package model

import (
	"context"
	"database/sql"
	"errors"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNameCategories = "categories"

const (
	FieldCategoryAccountID  = "account_id"
	FieldCategoryName       = "name"
	FieldCategoryType       = "type"
	FieldCategorySortOrder  = "sort_order"
	FieldCategoryDeletedAt  = "deleted_at"
	FieldCategoryCreatedAt  = "created_at"
	FieldCategoryUpdatedAt  = "updated_at"
)

type Category struct {
	ID        int64
	AccountID string
	Name      string
	Type      int
	SortOrder int
	DeletedAt int64
	CreatedAt int64
	UpdatedAt int64
}

var CategoryColumns = []string{
	FieldCategoryAccountID, FieldCategoryName, FieldCategoryType, FieldCategorySortOrder,
	FieldCategoryDeletedAt, FieldCategoryCreatedAt, FieldCategoryUpdatedAt,
}

var CategoryColumnsWithID = append([]string{"id"}, CategoryColumns...)

func scanCategory(row *sql.Row) (*Category, error) {
	c := &Category{}
	err := row.Scan(&c.ID, &c.AccountID, &c.Name, &c.Type, &c.SortOrder, &c.DeletedAt, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func scanCategories(rows *sql.Rows) ([]*Category, error) {
	var list []*Category
	for rows.Next() {
		c := &Category{}
		err := rows.Scan(&c.ID, &c.AccountID, &c.Name, &c.Type, &c.SortOrder, &c.DeletedAt, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func InsertCategory(ctx context.Context, exec dbmysql.Exec, c *Category) (int64, error) {
	return sqlutil.NewInsert(exec).Table(TableNameCategories).InsertCtx(ctx, map[string]interface{}{
		FieldCategoryAccountID:  c.AccountID,
		FieldCategoryName:       c.Name,
		FieldCategoryType:       c.Type,
		FieldCategorySortOrder:  c.SortOrder,
		FieldCategoryDeletedAt:  c.DeletedAt,
		FieldCategoryCreatedAt:  c.CreatedAt,
		FieldCategoryUpdatedAt:  c.UpdatedAt,
	})
}

func SelectCategoriesByAccountID(ctx context.Context, exec dbmysql.Exec, accountID string) ([]*Category, error) {
	var list []*Category
	err := sqlutil.NewQuery(exec).
		Columns(CategoryColumnsWithID).
		Table(TableNameCategories).
		Where(sqlutil.WithEq(FieldCategoryAccountID, accountID), sqlutil.WithEq(FieldCategoryDeletedAt, 0)).
		OrderBy(sqlutil.ASC(FieldCategorySortOrder)).
		QueryCtx(ctx, func(rows *sql.Rows) error {
			var err error
			list, err = scanCategories(rows)
			return err
		})
	if err != nil {
		return nil, err
	}
	return list, nil
}

func SelectCategoryByID(ctx context.Context, exec dbmysql.Exec, id int64) (*Category, error) {
	var c *Category
	err := sqlutil.NewQuery(exec).
		Columns(CategoryColumnsWithID).
		Table(TableNameCategories).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldCategoryDeletedAt, 0)).
		QueryOneCtx(ctx, func(row *sql.Row) error {
			var err error
			c, err = scanCategory(row)
			return err
		})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return c, nil
}

func UpdateCategoryByID(ctx context.Context, exec dbmysql.Exec, id int64, updates map[string]interface{}) (int64, error) {
	updates[FieldCategoryUpdatedAt] = updates[FieldCategoryUpdatedAt]
	return sqlutil.NewUpdate(exec).
		Table(TableNameCategories).
		Field(updates).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldCategoryDeletedAt, 0)).
		UpdateCtx(ctx)
}

func SoftDeleteCategoryByID(ctx context.Context, exec dbmysql.Exec, id int64, deletedAt int64) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameCategories).
		Field(map[string]interface{}{FieldCategoryDeletedAt: deletedAt, FieldCategoryUpdatedAt: deletedAt}).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldCategoryDeletedAt, 0)).
		UpdateCtx(ctx)
}
```

- [ ] **Step 3: Create `pkg/model/transaction.go`**

```go
package model

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNameTransactions = "transactions"

const (
	FieldTransactionAccountID  = "account_id"
	FieldTransactionCategoryID = "category_id"
	FieldTransactionType       = "type"
	FieldTransactionName       = "name"
	FieldTransactionAmount     = "amount"
	FieldTransactionDate       = "date"
	FieldTransactionNote       = "note"
	FieldTransactionDeletedAt  = "deleted_at"
	FieldTransactionCreatedAt  = "created_at"
	FieldTransactionUpdatedAt  = "updated_at"
)

type Transaction struct {
	ID         int64
	AccountID  string
	CategoryID int64
	Type       int
	Name       string
	Amount     float64
	Date       string
	Note       string
	DeletedAt  int64
	CreatedAt  int64
	UpdatedAt  int64
}

type TransactionFilter struct {
	AccountID  string
	Year       int
	Month      int
	CategoryID int64 // 0 = no filter
	Page       int
	PageSize   int
}

var TransactionColumns = []string{
	FieldTransactionAccountID, FieldTransactionCategoryID, FieldTransactionType,
	FieldTransactionName, FieldTransactionAmount, FieldTransactionDate,
	FieldTransactionNote, FieldTransactionDeletedAt, FieldTransactionCreatedAt, FieldTransactionUpdatedAt,
}

var TransactionColumnsWithID = append([]string{"id"}, TransactionColumns...)

func scanTransaction(row *sql.Row) (*Transaction, error) {
	t := &Transaction{}
	err := row.Scan(&t.ID, &t.AccountID, &t.CategoryID, &t.Type, &t.Name, &t.Amount, &t.Date, &t.Note,
		&t.DeletedAt, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func scanTransactions(rows *sql.Rows) ([]*Transaction, error) {
	var list []*Transaction
	for rows.Next() {
		t := &Transaction{}
		err := rows.Scan(&t.ID, &t.AccountID, &t.CategoryID, &t.Type, &t.Name, &t.Amount, &t.Date, &t.Note,
			&t.DeletedAt, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, t)
	}
	return list, nil
}

func InsertTransaction(ctx context.Context, exec dbmysql.Exec, t *Transaction) (int64, error) {
	return sqlutil.NewInsert(exec).Table(TableNameTransactions).InsertCtx(ctx, map[string]interface{}{
		FieldTransactionAccountID:  t.AccountID,
		FieldTransactionCategoryID: t.CategoryID,
		FieldTransactionType:       t.Type,
		FieldTransactionName:       t.Name,
		FieldTransactionAmount:     t.Amount,
		FieldTransactionDate:       t.Date,
		FieldTransactionNote:       t.Note,
		FieldTransactionDeletedAt:  t.DeletedAt,
		FieldTransactionCreatedAt:  t.CreatedAt,
		FieldTransactionUpdatedAt:  t.UpdatedAt,
	})
}

func buildTransactionFilter(filter *TransactionFilter) []sqlutil.Condition {
	conds := []sqlutil.Condition{
		sqlutil.WithEq(FieldTransactionAccountID, filter.AccountID),
		sqlutil.WithEq(FieldTransactionDeletedAt, 0),
	}
	if filter.Year > 0 && filter.Month > 0 {
		datePrefix := fmt.Sprintf("%04d-%02d", filter.Year, filter.Month)
		conds = append(conds, sqlutil.WithParentheses(
			sqlutil.WithEq(FieldTransactionDate, datePrefix+"-%"),
		))
	}
	if filter.CategoryID > 0 {
		conds = append(conds, sqlutil.WithEq(FieldTransactionCategoryID, filter.CategoryID))
	}
	return conds
}

func SelectTransactions(ctx context.Context, exec dbmysql.Exec, filter *TransactionFilter) ([]*Transaction, int, error) {
	conds := buildTransactionFilter(filter)

	var total int
	countRow := sqlutil.NewQuery(exec).
		Columns([]string{"COUNT(*)"}).
		Table(TableNameTransactions).
		Where(conds...)
	err := countRow.QueryOneCtx(ctx, func(row *sql.Row) error {
		return row.Scan(&total)
	})
	if err != nil {
		return nil, 0, err
	}

	q := sqlutil.NewQuery(exec).
		Columns(TransactionColumnsWithID).
		Table(TableNameTransactions).
		Where(conds...).
		OrderBy(sqlutil.DESC(FieldTransactionDate), sqlutil.DESC("id"))

	if filter.PageSize > 0 {
		offset := (filter.Page - 1) * filter.PageSize
		if offset < 0 {
			offset = 0
		}
		q = q.Limit(filter.PageSize, offset)
	}

	var list []*Transaction
	err = q.QueryCtx(ctx, func(rows *sql.Rows) error {
		var err error
		list, err = scanTransactions(rows)
		return err
	})
	if err != nil {
		return nil, 0, err
	}
	return list, total, nil
}

func SelectTransactionByID(ctx context.Context, exec dbmysql.Exec, id int64) (*Transaction, error) {
	var t *Transaction
	err := sqlutil.NewQuery(exec).
		Columns(TransactionColumnsWithID).
		Table(TableNameTransactions).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldTransactionDeletedAt, 0)).
		QueryOneCtx(ctx, func(row *sql.Row) error {
			var err error
			t, err = scanTransaction(row)
			return err
		})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return t, nil
}

func UpdateTransactionByID(ctx context.Context, exec dbmysql.Exec, id int64, updates map[string]interface{}) (int64, error) {
	updates[FieldTransactionUpdatedAt] = updates[FieldTransactionUpdatedAt]
	return sqlutil.NewUpdate(exec).
		Table(TableNameTransactions).
		Field(updates).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldTransactionDeletedAt, 0)).
		UpdateCtx(ctx)
}

func SoftDeleteTransactionByID(ctx context.Context, exec dbmysql.Exec, id int64, deletedAt int64) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameTransactions).
		Field(map[string]interface{}{FieldTransactionDeletedAt: deletedAt, FieldTransactionUpdatedAt: deletedAt}).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldTransactionDeletedAt, 0)).
		UpdateCtx(ctx)
}
```

- [ ] **Step 4: Compile verify**

Run: `go build ./apps/personal-finance/...` to confirm model package compiles.

---

## Task 3: gRPC Service Layer

**Files:**
- Create: `apps/personal-finance/pkg/service/finance.go`

**Interfaces:**
- Consumes: `model.Category`, `model.Transaction`, protobuf types from `adapter/pb`
- Produces: `service.Finance` gRPC server with 9 methods

- [ ] **Step 1: Create `pkg/service/finance.go`**

```go
package service

import (
	"context"
	"errors"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.uber.org/zap"

	pb "github.com/eviltomorrow/personal-service/apps/personal-finance/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/personal-finance/pkg/model"
)

var (
	insertCategory           = model.InsertCategory
	selectCategoriesByAcctID = model.SelectCategoriesByAccountID
	selectCategoryByID       = model.SelectCategoryByID
	updateCategoryByID       = model.UpdateCategoryByID
	softDeleteCategoryByID   = model.SoftDeleteCategoryByID

	insertTransaction       = model.InsertTransaction
	selectTransactions      = model.SelectTransactions
	selectTransactionByID   = model.SelectTransactionByID
	updateTransactionByID   = model.UpdateTransactionByID
	softDeleteTransactionByID = model.SoftDeleteTransactionByID
)

var selectDB = func(ctx context.Context) dbmysql.Exec {
	return dbmysql.DB
}

func accountIDFromCtx(ctx context.Context) (string, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return "", status.Error(codes.Unauthenticated, "missing metadata")
	}
	vals := md.Get("x-account-id")
	if len(vals) == 0 {
		return "", status.Error(codes.Unauthenticated, "missing account_id")
	}
	return vals[0], nil
}

type Finance struct {
	pb.UnimplementedFinanceServer
}

func NewFinance() *Finance {
	return &Finance{}
}

func now() int64 {
	return time.Now().Unix()
}

// --- Categories ---

func (s *Finance) ListCategories(ctx context.Context, _ *emptypb.Empty) (*pb.ListCategoriesResponse, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	cats, err := selectCategoriesByAcctID(ctx, selectDB(ctx), accountID)
	if err != nil {
		zlog.Error("list categories failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	result := make([]*pb.Category, 0, len(cats))
	for _, c := range cats {
		result = append(result, &pb.Category{
			Id:        c.ID,
			AccountId: c.AccountID,
			Name:      c.Name,
			Type:      pb.FinanceType(c.Type),
			SortOrder: int32(c.SortOrder),
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
		})
	}
	return &pb.ListCategoriesResponse{Categories: result}, nil
}

func (s *Finance) CreateCategory(ctx context.Context, req *pb.CreateCategoryRequest) (*pb.Category, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if req.Type != pb.FinanceType_FINANCE_TYPE_INCOME && req.Type != pb.FinanceType_FINANCE_TYPE_EXPENSE {
		return nil, status.Error(codes.InvalidArgument, "invalid type")
	}

	n := now()
	c := &model.Category{
		AccountID: accountID,
		Name:      req.Name,
		Type:      int(req.Type),
		SortOrder: int(req.SortOrder),
		DeletedAt: 0,
		CreatedAt: n,
		UpdatedAt: n,
	}
	id, err := insertCategory(ctx, selectDB(ctx), c)
	if err != nil {
		zlog.Error("create category failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	c.ID = id
	return &pb.Category{
		Id:        c.ID,
		AccountId: c.AccountID,
		Name:      c.Name,
		Type:      pb.FinanceType(c.Type),
		SortOrder: int32(c.SortOrder),
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}, nil
}

func (s *Finance) UpdateCategory(ctx context.Context, req *pb.UpdateCategoryRequest) (*pb.Category, error) {
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

	existing, err := selectCategoryByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "category not found")
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return nil, status.Error(codes.NotFound, "category not found")
	}

	n := now()
	_, err = updateCategoryByID(ctx, selectDB(ctx), req.Id, map[string]interface{}{
		model.FieldCategoryName:      req.Name,
		model.FieldCategoryType:      int(req.Type),
		model.FieldCategorySortOrder: int(req.SortOrder),
		model.FieldCategoryUpdatedAt: n,
	})
	if err != nil {
		zlog.Error("update category failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	existing.Name = req.Name
	existing.Type = int(req.Type)
	existing.SortOrder = int(req.SortOrder)
	existing.UpdatedAt = n
	return &pb.Category{
		Id:        existing.ID,
		AccountId: existing.AccountID,
		Name:      existing.Name,
		Type:      pb.FinanceType(existing.Type),
		SortOrder: int32(existing.SortOrder),
		CreatedAt: existing.CreatedAt,
		UpdatedAt: existing.UpdatedAt,
	}, nil
}

func (s *Finance) DeleteCategory(ctx context.Context, req *pb.DeleteCategoryRequest) (*emptypb.Empty, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	existing, err := selectCategoryByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return &emptypb.Empty{}, nil
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return &emptypb.Empty{}, nil
	}

	_, err = softDeleteCategoryByID(ctx, selectDB(ctx), req.Id, now())
	if err != nil {
		zlog.Error("delete category failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	return &emptypb.Empty{}, nil
}

// --- Transactions ---

func (s *Finance) ListTransactions(ctx context.Context, req *pb.ListTransactionsRequest) (*pb.ListTransactionsResponse, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	filter := &model.TransactionFilter{
		AccountID:  accountID,
		Year:       int(req.Year),
		Month:      int(req.Month),
		CategoryID: req.CategoryId,
		Page:       int(req.Page),
		PageSize:   int(req.PageSize),
	}
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 50
	}

	list, total, err := selectTransactions(ctx, selectDB(ctx), filter)
	if err != nil {
		zlog.Error("list transactions failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	result := make([]*pb.Transaction, 0, len(list))
	for _, t := range list {
		result = append(result, &pb.Transaction{
			Id:         t.ID,
			AccountId:  t.AccountID,
			CategoryId: t.CategoryID,
			Type:       pb.FinanceType(t.Type),
			Name:       t.Name,
			Amount:     t.Amount,
			Date:       t.Date,
			Note:       t.Note,
			CreatedAt:  t.CreatedAt,
			UpdatedAt:  t.UpdatedAt,
		})
	}
	return &pb.ListTransactionsResponse{Transactions: result, Total: int32(total)}, nil
}

func (s *Finance) CreateTransaction(ctx context.Context, req *pb.CreateTransactionRequest) (*pb.Transaction, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if req.Amount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be positive")
	}
	if req.Date == "" {
		return nil, status.Error(codes.InvalidArgument, "date is required")
	}
	if req.Type != pb.FinanceType_FINANCE_TYPE_INCOME && req.Type != pb.FinanceType_FINANCE_TYPE_EXPENSE {
		return nil, status.Error(codes.InvalidArgument, "invalid type")
	}

	n := now()
	t := &model.Transaction{
		AccountID:  accountID,
		CategoryID: req.CategoryId,
		Type:       int(req.Type),
		Name:       req.Name,
		Amount:     req.Amount,
		Date:       req.Date,
		Note:       req.Note,
		DeletedAt:  0,
		CreatedAt:  n,
		UpdatedAt:  n,
	}
	id, err := insertTransaction(ctx, selectDB(ctx), t)
	if err != nil {
		zlog.Error("create transaction failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	t.ID = id
	return &pb.Transaction{
		Id:         t.ID,
		AccountId:  t.AccountID,
		CategoryId: t.CategoryID,
		Type:       pb.FinanceType(t.Type),
		Name:       t.Name,
		Amount:     t.Amount,
		Date:       t.Date,
		Note:       t.Note,
		CreatedAt:  t.CreatedAt,
		UpdatedAt:  t.UpdatedAt,
	}, nil
}

func (s *Finance) UpdateTransaction(ctx context.Context, req *pb.UpdateTransactionRequest) (*pb.Transaction, error) {
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
	if req.Amount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be positive")
	}

	existing, err := selectTransactionByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "transaction not found")
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return nil, status.Error(codes.NotFound, "transaction not found")
	}

	n := now()
	_, err = updateTransactionByID(ctx, selectDB(ctx), req.Id, map[string]interface{}{
		model.FieldTransactionCategoryID: req.CategoryId,
		model.FieldTransactionType:       int(req.Type),
		model.FieldTransactionName:       req.Name,
		model.FieldTransactionAmount:     req.Amount,
		model.FieldTransactionDate:       req.Date,
		model.FieldTransactionNote:       req.Note,
		model.FieldTransactionUpdatedAt:  n,
	})
	if err != nil {
		zlog.Error("update transaction failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	return &pb.Transaction{
		Id:         existing.ID,
		AccountId:  existing.AccountID,
		CategoryId: req.CategoryId,
		Type:       req.Type,
		Name:       req.Name,
		Amount:     req.Amount,
		Date:       req.Date,
		Note:       req.Note,
		CreatedAt:  existing.CreatedAt,
		UpdatedAt:  n,
	}, nil
}

func (s *Finance) DeleteTransaction(ctx context.Context, req *pb.DeleteTransactionRequest) (*emptypb.Empty, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	existing, err := selectTransactionByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return &emptypb.Empty{}, nil
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return &emptypb.Empty{}, nil
	}

	_, err = softDeleteTransactionByID(ctx, selectDB(ctx), req.Id, now())
	if err != nil {
		zlog.Error("delete transaction failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	return &emptypb.Empty{}, nil
}

// --- Summary ---

func (s *Finance) GetMonthlySummary(ctx context.Context, req *pb.GetMonthlySummaryRequest) (*pb.MonthlySummary, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	filter := &model.TransactionFilter{
		AccountID: accountID,
		Year:      int(req.Year),
		Month:     int(req.Month),
		PageSize:  1000,
	}

	list, _, err := selectTransactions(ctx, selectDB(ctx), filter)
	if err != nil {
		zlog.Error("get monthly summary failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	var totalIncome, totalExpense float64
	catMap := make(map[int64]*pb.CategorySummary)
	for _, t := range list {
		if t.Type == 1 {
			totalIncome += t.Amount
		} else {
			totalExpense += t.Amount
		}
		if cs, ok := catMap[t.CategoryID]; ok {
			cs.TotalAmount += t.Amount
		} else {
			catMap[t.CategoryID] = &pb.CategorySummary{
				CategoryId:   t.CategoryID,
				CategoryName: "",
				TotalAmount:  t.Amount,
			}
		}
	}

	catSummaries := make([]*pb.CategorySummary, 0, len(catMap))
	for _, cs := range catMap {
		catSummaries = append(catSummaries, cs)
	}

	return &pb.MonthlySummary{
		TotalIncome:       totalIncome,
		TotalExpense:      totalExpense,
		NetBalance:        totalIncome - totalExpense,
		CategorySummaries: catSummaries,
	}, nil
}
```

- [ ] **Step 2: Compile verify**

Run: `go build ./apps/personal-finance/...`

---

## Task 4: personal-api Finance Integration

**Files:**
- Create: `lib/grpc/client/finance.go`
- Create: `apps/personal-api/pkg/model/finance.go`
- Create: `apps/personal-api/pkg/service/finance.go`
- Create: `apps/personal-api/pkg/handler/finance.go`
- Create: `apps/personal-api/pkg/provider/finance.go`
- Modify: `apps/personal-api/pkg/provider/provider.go` — add `initFinance` call
- Modify: `apps/personal-api/pkg/config/config.go` — add `FinanceServiceTarget`

- [ ] **Step 1: Create `lib/grpc/client/finance.go`**

```go
package client

import (
	"fmt"

	pb "github.com/eviltomorrow/personal-service/apps/personal-finance/adapter/pb"
)

func NewFinanceClient(target string) (pb.FinanceClient, func() error, error) {
	conn, err := dial(target)
	if err != nil {
		return nil, nil, fmt.Errorf("dial finance service failure: %w", err)
	}
	return pb.NewFinanceClient(conn), conn.Close, nil
}
```

- [ ] **Step 2: Create `apps/personal-api/pkg/model/finance.go`**

```go
package model

import "context"

type FinanceType string

const (
	FinanceTypeIncome  FinanceType = "income"
	FinanceTypeExpense FinanceType = "expense"
)

type Category struct {
	ID        int64       `json:"id"`
	AccountID string      `json:"account_id"`
	Name      string      `json:"name"`
	Type      FinanceType `json:"type"`
	SortOrder int         `json:"sort_order"`
	CreatedAt int64       `json:"created_at"`
	UpdatedAt int64       `json:"updated_at"`
}

type CreateCategoryRequest struct {
	Name      string      `json:"name"`
	Type      FinanceType `json:"type"`
	SortOrder int         `json:"sort_order"`
}

type UpdateCategoryRequest struct {
	ID        int64       `json:"id"`
	Name      string      `json:"name"`
	Type      FinanceType `json:"type"`
	SortOrder int         `json:"sort_order"`
}

type Transaction struct {
	ID         int64       `json:"id"`
	AccountID  string      `json:"account_id"`
	CategoryID int64       `json:"category_id"`
	Type       FinanceType `json:"type"`
	Name       string      `json:"name"`
	Amount     float64     `json:"amount"`
	Date       string      `json:"date"`
	Note       string      `json:"note"`
	CreatedAt  int64       `json:"created_at"`
	UpdatedAt  int64       `json:"updated_at"`
}

type ListTransactionsRequest struct {
	Year       int   `json:"year"`
	Month      int   `json:"month"`
	CategoryID int64 `json:"category_id"`
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
}

type CreateTransactionRequest struct {
	CategoryID int64       `json:"category_id"`
	Type       FinanceType `json:"type"`
	Name       string      `json:"name"`
	Amount     float64     `json:"amount"`
	Date       string      `json:"date"`
	Note       string      `json:"note"`
}

type UpdateTransactionRequest struct {
	ID         int64       `json:"id"`
	CategoryID int64       `json:"category_id"`
	Type       FinanceType `json:"type"`
	Name       string      `json:"name"`
	Amount     float64     `json:"amount"`
	Date       string      `json:"date"`
	Note       string      `json:"note"`
}

type CategorySummary struct {
	CategoryID   int64   `json:"category_id"`
	CategoryName string  `json:"category_name"`
	TotalAmount  float64 `json:"total_amount"`
}

type MonthlySummary struct {
	TotalIncome       float64           `json:"total_income"`
	TotalExpense      float64           `json:"total_expense"`
	NetBalance        float64           `json:"net_balance"`
	CategorySummaries []CategorySummary `json:"category_summaries"`
}

type ListTransactionsResult struct {
	Transactions []Transaction `json:"transactions"`
	Total        int           `json:"total"`
}

type FinanceClient interface {
	ListCategories(ctx context.Context, accountID string) ([]Category, error)
	CreateCategory(ctx context.Context, accountID string, req *CreateCategoryRequest) (*Category, error)
	UpdateCategory(ctx context.Context, accountID string, req *UpdateCategoryRequest) (*Category, error)
	DeleteCategory(ctx context.Context, accountID string, id int64) error

	ListTransactions(ctx context.Context, accountID string, req *ListTransactionsRequest) (*ListTransactionsResult, error)
	CreateTransaction(ctx context.Context, accountID string, req *CreateTransactionRequest) (*Transaction, error)
	UpdateTransaction(ctx context.Context, accountID string, req *UpdateTransactionRequest) (*Transaction, error)
	DeleteTransaction(ctx context.Context, accountID string, id int64) error

	GetMonthlySummary(ctx context.Context, accountID string, year, month int) (*MonthlySummary, error)
}
```

- [ ] **Step 3: Create `apps/personal-api/pkg/service/finance.go`**

```go
package service

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	pb "github.com/eviltomorrow/personal-service/apps/personal-finance/adapter/pb"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
)

func withAccountID(ctx context.Context, accountID string) context.Context {
	return metadata.AppendToOutgoingContext(ctx, "x-account-id", accountID)
}

type FinanceService struct {
	client pb.FinanceClient
}

func NewFinanceService(client pb.FinanceClient) *FinanceService {
	return &FinanceService{client: client}
}

func financeTypeToProto(t model.FinanceType) (pb.FinanceType, error) {
	switch t {
	case model.FinanceTypeIncome:
		return pb.FinanceType_FINANCE_TYPE_INCOME, nil
	case model.FinanceTypeExpense:
		return pb.FinanceType_FINANCE_TYPE_EXPENSE, nil
	default:
		return pb.FinanceType_FINANCE_TYPE_UNSPECIFIED, status.Error(codes.InvalidArgument, "unsupported finance_type")
	}
}

func financeTypeFromProto(t pb.FinanceType) model.FinanceType {
	switch t {
	case pb.FinanceType_FINANCE_TYPE_INCOME:
		return model.FinanceTypeIncome
	case pb.FinanceType_FINANCE_TYPE_EXPENSE:
		return model.FinanceTypeExpense
	default:
		return ""
	}
}

func (s *FinanceService) ListCategories(ctx context.Context, accountID string) ([]model.Category, error) {
	pbResp, err := s.client.ListCategories(withAccountID(ctx, accountID), nil)
	if err != nil {
		return nil, err
	}
	result := make([]model.Category, 0, len(pbResp.Categories))
	for _, c := range pbResp.Categories {
		result = append(result, model.Category{
			ID:        c.Id,
			AccountID: c.AccountId,
			Name:      c.Name,
			Type:      financeTypeFromProto(c.Type),
			SortOrder: int(c.SortOrder),
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
		})
	}
	return result, nil
}

func (s *FinanceService) CreateCategory(ctx context.Context, accountID string, req *model.CreateCategoryRequest) (*model.Category, error) {
	pbType, err := financeTypeToProto(req.Type)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.CreateCategory(withAccountID(ctx, accountID), &pb.CreateCategoryRequest{
		Name:      req.Name,
		Type:      pbType,
		SortOrder: int32(req.SortOrder),
	})
	if err != nil {
		return nil, err
	}
	return &model.Category{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Name:      pbResp.Name,
		Type:      financeTypeFromProto(pbResp.Type),
		SortOrder: int(pbResp.SortOrder),
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *FinanceService) UpdateCategory(ctx context.Context, accountID string, req *model.UpdateCategoryRequest) (*model.Category, error) {
	pbType, err := financeTypeToProto(req.Type)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.UpdateCategory(withAccountID(ctx, accountID), &pb.UpdateCategoryRequest{
		Id:        req.ID,
		Name:      req.Name,
		Type:      pbType,
		SortOrder: int32(req.SortOrder),
	})
	if err != nil {
		return nil, err
	}
	return &model.Category{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Name:      pbResp.Name,
		Type:      financeTypeFromProto(pbResp.Type),
		SortOrder: int(pbResp.SortOrder),
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *FinanceService) DeleteCategory(ctx context.Context, accountID string, id int64) error {
	_, err := s.client.DeleteCategory(withAccountID(ctx, accountID), &pb.DeleteCategoryRequest{Id: id})
	return err
}

func (s *FinanceService) ListTransactions(ctx context.Context, accountID string, req *model.ListTransactionsRequest) (*model.ListTransactionsResult, error) {
	pbResp, err := s.client.ListTransactions(withAccountID(ctx, accountID), &pb.ListTransactionsRequest{
		Year:       int32(req.Year),
		Month:      int32(req.Month),
		CategoryId: req.CategoryID,
		Page:       int32(req.Page),
		PageSize:   int32(req.PageSize),
	})
	if err != nil {
		return nil, err
	}
	result := make([]model.Transaction, 0, len(pbResp.Transactions))
	for _, t := range pbResp.Transactions {
		result = append(result, model.Transaction{
			ID:         t.Id,
			AccountID:  t.AccountId,
			CategoryID: t.CategoryId,
			Type:       financeTypeFromProto(t.Type),
			Name:       t.Name,
			Amount:     t.Amount,
			Date:       t.Date,
			Note:       t.Note,
			CreatedAt:  t.CreatedAt,
			UpdatedAt:  t.UpdatedAt,
		})
	}
	return &model.ListTransactionsResult{
		Transactions: result,
		Total:        int(pbResp.Total),
	}, nil
}

func (s *FinanceService) CreateTransaction(ctx context.Context, accountID string, req *model.CreateTransactionRequest) (*model.Transaction, error) {
	pbType, err := financeTypeToProto(req.Type)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.CreateTransaction(withAccountID(ctx, accountID), &pb.CreateTransactionRequest{
		CategoryId: req.CategoryID,
		Type:       pbType,
		Name:       req.Name,
		Amount:     req.Amount,
		Date:       req.Date,
		Note:       req.Note,
	})
	if err != nil {
		return nil, err
	}
	return &model.Transaction{
		ID:         pbResp.Id,
		AccountID:  pbResp.AccountId,
		CategoryID: pbResp.CategoryId,
		Type:       financeTypeFromProto(pbResp.Type),
		Name:       pbResp.Name,
		Amount:     pbResp.Amount,
		Date:       pbResp.Date,
		Note:       pbResp.Note,
		CreatedAt:  pbResp.CreatedAt,
		UpdatedAt:  pbResp.UpdatedAt,
	}, nil
}

func (s *FinanceService) UpdateTransaction(ctx context.Context, accountID string, req *model.UpdateTransactionRequest) (*model.Transaction, error) {
	pbType, err := financeTypeToProto(req.Type)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.UpdateTransaction(withAccountID(ctx, accountID), &pb.UpdateTransactionRequest{
		Id:         req.ID,
		CategoryId: req.CategoryID,
		Type:       pbType,
		Name:       req.Name,
		Amount:     req.Amount,
		Date:       req.Date,
		Note:       req.Note,
	})
	if err != nil {
		return nil, err
	}
	return &model.Transaction{
		ID:         pbResp.Id,
		AccountID:  pbResp.AccountId,
		CategoryID: pbResp.CategoryId,
		Type:       financeTypeFromProto(pbResp.Type),
		Name:       pbResp.Name,
		Amount:     pbResp.Amount,
		Date:       pbResp.Date,
		Note:       pbResp.Note,
		CreatedAt:  pbResp.CreatedAt,
		UpdatedAt:  pbResp.UpdatedAt,
	}, nil
}

func (s *FinanceService) DeleteTransaction(ctx context.Context, accountID string, id int64) error {
	_, err := s.client.DeleteTransaction(withAccountID(ctx, accountID), &pb.DeleteTransactionRequest{Id: id})
	return err
}

func (s *FinanceService) GetMonthlySummary(ctx context.Context, accountID string, year, month int) (*model.MonthlySummary, error) {
	pbResp, err := s.client.GetMonthlySummary(withAccountID(ctx, accountID), &pb.GetMonthlySummaryRequest{
		Year:  int32(year),
		Month: int32(month),
	})
	if err != nil {
		return nil, err
	}
	catSummaries := make([]model.CategorySummary, 0, len(pbResp.CategorySummaries))
	for _, cs := range pbResp.CategorySummaries {
		catSummaries = append(catSummaries, model.CategorySummary{
			CategoryID:   cs.CategoryId,
			CategoryName: cs.CategoryName,
			TotalAmount:  cs.TotalAmount,
		})
	}
	return &model.MonthlySummary{
		TotalIncome:       pbResp.TotalIncome,
		TotalExpense:      pbResp.TotalExpense,
		NetBalance:        pbResp.NetBalance,
		CategorySummaries: catSummaries,
	}, nil
}
```

- [ ] **Step 4: Create `apps/personal-api/pkg/provider/finance.go`**

```go
package provider

import (
	grpcclient "github.com/eviltomorrow/personal-service/lib/grpc/client"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/service"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
)

var financeCli model.FinanceClient

func initFinance(cfg *config.Config) error {
	pbFinance, cleanup, err := grpcclient.NewFinanceClient(cfg.Service.FinanceServiceTarget)
	if err != nil {
		return err
	}
	finalizer.RegisterCleanupFuncs(cleanup)
	financeCli = service.NewFinanceService(pbFinance)
	return nil
}

func GetFinanceClient() model.FinanceClient {
	return financeCli
}
```

- [ ] **Step 5: Modify `provider/provider.go`**

```go
func Init(cfg *config.Config) error {
	if err := initAuth(cfg); err != nil {
		return err
	}
	return initFinance(cfg)
}
```

- [ ] **Step 6: Modify `config/config.go` — add `FinanceServiceTarget` to `ServiceConfig`**

```go
type ServiceConfig struct {
	AuthServiceTarget    string `json:"auth_service_target" toml:"auth_service_target" mapstructure:"auth_service_target"`
	FinanceServiceTarget string `json:"finance_service_target" toml:"finance_service_target" mapstructure:"finance_service_target"`
	SigningKey           string `json:"signing_key" toml:"signing_key" mapstructure:"signing_key"`
}
```

Add default:
```go
FinanceServiceTarget: "etcd:///grpclb/personal-finance",
```

Add to `String()`:
```go
"finance_service_target": c.FinanceServiceTarget,
```

Add to config.toml template:
```toml
finance_service_target = "etcd:///grpclb/personal-finance"
```

- [ ] **Step 7: Update `server/server.go` — add FinanceClient to Dependencies**

```go
deps := &handler.Dependencies{
    AuthClient:    provider.GetAuthClient(),
    FinanceClient: provider.GetFinanceClient(),
}
```

Add `FinanceClient` field to `handler.Dependencies` in `handler/router.go`:
```go
type Dependencies struct {
    AuthClient    model.AuthClient
    FinanceClient model.FinanceClient
}
```

- [ ] **Step 8: Create `apps/personal-api/pkg/handler/finance.go`**

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

type FinanceHandler struct {
	client model.FinanceClient
}

func init() {
	Register(func(r *Router, deps *Dependencies) {
		h := &FinanceHandler{client: deps.FinanceClient}

		// Categories
		r.GET("/finance/categories", h.ListCategories)
		r.POST("/finance/categories", h.CreateCategory)
		r.PUT("/finance/categories/:id", h.UpdateCategory)
		r.DELETE("/finance/categories/:id", h.DeleteCategory)

		// Transactions
		r.GET("/finance/transactions", h.ListTransactions)
		r.POST("/finance/transactions", h.CreateTransaction)
		r.PUT("/finance/transactions/:id", h.UpdateTransaction)
		r.DELETE("/finance/transactions/:id", h.DeleteTransaction)

		// Summary
		r.GET("/finance/summary", h.GetMonthlySummary)
	})
}

func accountID(c echo.Context) string {
	v, _ := c.Get("account_id").(string)
	return v
}

func (h *FinanceHandler) ListCategories(c echo.Context) error {
	resp, err := h.client.ListCategories(c.Request().Context(), accountID(c))
	if err != nil {
		zlog.Error("finance list categories failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) CreateCategory(c echo.Context) error {
	var req model.CreateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	resp, err := h.client.CreateCategory(c.Request().Context(), accountID(c), &req)
	if err != nil {
		zlog.Error("finance create category failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) UpdateCategory(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	var req model.UpdateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.ID = id
	resp, err := h.client.UpdateCategory(c.Request().Context(), accountID(c), &req)
	if err != nil {
		zlog.Error("finance update category failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) DeleteCategory(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	if err := h.client.DeleteCategory(c.Request().Context(), accountID(c), id); err != nil {
		zlog.Error("finance delete category failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", nil)
}

func (h *FinanceHandler) ListTransactions(c echo.Context) error {
	year, _ := strconv.Atoi(c.QueryParam("year"))
	month, _ := strconv.Atoi(c.QueryParam("month"))
	catID, _ := strconv.ParseInt(c.QueryParam("category_id"), 10, 64)
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	resp, err := h.client.ListTransactions(c.Request().Context(), accountID(c), &model.ListTransactionsRequest{
		Year:       year,
		Month:      month,
		CategoryID: catID,
		Page:       page,
		PageSize:   pageSize,
	})
	if err != nil {
		zlog.Error("finance list transactions failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) CreateTransaction(c echo.Context) error {
	var req model.CreateTransactionRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	resp, err := h.client.CreateTransaction(c.Request().Context(), accountID(c), &req)
	if err != nil {
		zlog.Error("finance create transaction failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) UpdateTransaction(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	var req model.UpdateTransactionRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.ID = id
	resp, err := h.client.UpdateTransaction(c.Request().Context(), accountID(c), &req)
	if err != nil {
		zlog.Error("finance update transaction failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) DeleteTransaction(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	if err := h.client.DeleteTransaction(c.Request().Context(), accountID(c), id); err != nil {
		zlog.Error("finance delete transaction failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", nil)
}

func (h *FinanceHandler) GetMonthlySummary(c echo.Context) error {
	year, _ := strconv.Atoi(c.QueryParam("year"))
	month, _ := strconv.Atoi(c.QueryParam("month"))

	resp, err := h.client.GetMonthlySummary(c.Request().Context(), accountID(c), year, month)
	if err != nil {
		zlog.Error("finance get monthly summary failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}
```

- [ ] **Step 9: Verify compilation**

Run: `go build ./apps/personal-api/...` and `go build ./apps/personal-finance/...`

---

## Task 5: End-to-End Integration + Build

**Files:**
- Modify: `Makefile` — add personal-finance build target

- [ ] **Step 1: Update Makefile**

Add personal-finance to the default build targets loop (alongside personal-api and personal-auth):
```makefile
APPS = personal-api personal-auth personal-finance
```

- [ ] **Step 2: Full build verification**

Run: `make build` or `make build app=personal-finance`

- [ ] **Step 3: Final compile check for whole project**

Run: `go build ./...` — should compile all packages without errors.
