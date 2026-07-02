package model

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"math"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNameBalanceSheetItems = "balance_sheet_items"

const (
	FieldBSIAccountID = "account_id"
	FieldBSISection   = "section"
	FieldBSICategory  = "category"
	FieldBSIName      = "name"
	FieldBSIAmount    = "amount"
	FieldBSINote      = "note"
	FieldBSIDate      = "date"
	FieldBSISortOrder = "sort_order"
	FieldBSIDeletedAt = "deleted_at"
	FieldBSICreatedAt = "created_at"
	FieldBSIUpdatedAt = "updated_at"
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
