# model 模块中涉及数据库操作的代码模板

```go
package model

import (
    "context"
    "database/sql"
    "errors"
    "time"

    dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
    "github.com/eviltomorrow/personal-service/lib/sqlutil"
)

// ── 常量 ──────────────────────────────────────────────
const TableNameXxx = "xxx"

const (
    FieldXxxCol1 = "col1"
    FieldXxxCol2 = "col2"
)

// ── 模型 ──────────────────────────────────────────────
type Xxx struct {
    Col1 string
    Col2 int64
}

// ── 行扫描 ────────────────────────────────────────────
func scanXxx(row *sql.Row) (*Xxx, error) {
    x := &Xxx{}
    err := row.Scan(&x.Col1, &x.Col2)
    if err != nil {
        return nil, err
    }
    return x, nil
}

// ── 插入 ──────────────────────────────────────────────
func InsertXxx(ctx context.Context, exec dbmysql.Exec, x *Xxx) (int64, error) {
    return sqlutil.NewInsert(exec).Table(TableNameXxx).InsertCtx(ctx, map[string]interface{}{
        FieldXxxCol1: x.Col1,
        FieldXxxCol2: x.Col2,
    })
}

// ── 单条查询（过滤软删除）──────────────────────────────
func SelectXxxByCol1(ctx context.Context, exec dbmysql.Exec, col1 string) (*Xxx, error) {
    var x *Xxx
    err := sqlutil.NewQuery(exec).
        Columns([]string{FieldXxxCol1, FieldXxxCol2}).
        Table(TableNameXxx).
        Where(sqlutil.WithEq(FieldXxxCol1, col1), sqlutil.WithEq(FieldXxxDeletedAt, 0)).
        QueryOneCtx(ctx, func(row *sql.Row) error {
            var err error
            x, err = scanXxx(row)
            return err
        })
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrNotFound
        }
        return nil, err
    }
    return x, nil
}

// ── 软删除 ────────────────────────────────────────────
func SoftDeleteXxxByCol1(ctx context.Context, exec dbmysql.Exec, col1 string) (int64, error) {
    return sqlutil.NewUpdate(exec).
        Table(TableNameXxx).
        Field(map[string]interface{}{
            FieldXxxDeletedAt: time.Now().Unix(),
            FieldXxxStatus:    0,
        }).
        Where(sqlutil.WithEq(FieldXxxCol1, col1), sqlutil.WithEq(FieldXxxDeletedAt, 0)).
        UpdateCtx(ctx)
}

// ── 更新（部分字段）────────────────────────────────────
func UpdateXxxField(ctx context.Context, exec dbmysql.Exec, col1 string, xxxField string) (int64, error) {
    return sqlutil.NewUpdate(exec).
        Table(TableNameXxx).
        Field(map[string]interface{}{
            FieldXxxField: xxxField,
        }).
        Where(sqlutil.WithEq(FieldXxxCol1, col1), sqlutil.WithEq(FieldXxxDeletedAt, 0)).
        UpdateCtx(ctx)
}

// ── 跨表 JOIN（回退原生 SQL）───────────────────────────
type XxxWithYyy struct {
    Col1 string
    Col2 string
}

func SelectXxxWithYyy(ctx context.Context, exec dbmysql.Exec, authType, identifier string) (*XxxWithYyy, error) {
    var x XxxWithYyy
    row := exec.QueryRowContext(ctx,
        `SELECT a.col1, a.col2
         FROM table_xxx a
         JOIN table_yyy y ON a.col1 = y.col1
         WHERE y.auth_type = ? AND y.identifier = ? AND a.deleted_at = 0 AND y.deleted_at = 0`,
        authType, identifier)
    if err := row.Scan(&x.Col1, &x.Col2); err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, ErrNotFound
        }
        return nil, err
    }
    return &x, nil
}
```
