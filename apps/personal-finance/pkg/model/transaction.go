package model

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

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
		firstDay := fmt.Sprintf("%04d-%02d-01", filter.Year, filter.Month)
		lastDay := time.Date(filter.Year, time.Month(filter.Month)+1, 0, 0, 0, 0, 0, time.UTC).Format("2006-01-02")
		conds = append(conds, sqlutil.WithBetweenAnd(FieldTransactionDate, firstDay, lastDay))
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
		q = q.Limit(int64(offset), int64(filter.PageSize))
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
