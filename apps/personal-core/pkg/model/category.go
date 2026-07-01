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
	FieldCategoryAccountID = "account_id"
	FieldCategoryName      = "name"
	FieldCategoryType      = "type"
	FieldCategorySortOrder = "sort_order"
	FieldCategoryDate      = "date"
	FieldCategoryDeletedAt = "deleted_at"
	FieldCategoryCreatedAt = "created_at"
	FieldCategoryUpdatedAt = "updated_at"
)

type Category struct {
	ID        int64
	AccountID string
	Name      string
	Type      int
	SortOrder int
	Date      string
	DeletedAt int64
	CreatedAt int64
	UpdatedAt int64
}

var CategoryColumns = []string{
	FieldCategoryAccountID, FieldCategoryName, FieldCategoryType, FieldCategorySortOrder,
	FieldCategoryDate, FieldCategoryDeletedAt, FieldCategoryCreatedAt, FieldCategoryUpdatedAt,
}

var CategoryColumnsWithID = append([]string{"id"}, CategoryColumns...)

func scanCategory(row *sql.Row) (*Category, error) {
	c := &Category{}
	err := row.Scan(&c.ID, &c.AccountID, &c.Name, &c.Type, &c.SortOrder, &c.Date, &c.DeletedAt, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func scanCategories(rows *sql.Rows) ([]*Category, error) {
	var list []*Category
	for rows.Next() {
		c := &Category{}
		err := rows.Scan(&c.ID, &c.AccountID, &c.Name, &c.Type, &c.SortOrder, &c.Date, &c.DeletedAt, &c.CreatedAt, &c.UpdatedAt)
		if err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func InsertCategory(ctx context.Context, exec dbmysql.Exec, c *Category) (int64, error) {
	return sqlutil.NewInsert(exec).Table(TableNameCategories).InsertCtx(ctx, map[string]interface{}{
		FieldCategoryAccountID: c.AccountID,
		FieldCategoryName:      c.Name,
		FieldCategoryType:      c.Type,
		FieldCategorySortOrder: c.SortOrder,
		FieldCategoryDate:      c.Date,
		FieldCategoryDeletedAt: c.DeletedAt,
		FieldCategoryCreatedAt: c.CreatedAt,
		FieldCategoryUpdatedAt: c.UpdatedAt,
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

func SelectCategoriesByAccountIDAndDate(ctx context.Context, exec dbmysql.Exec, accountID string, date string) ([]*Category, error) {
	var list []*Category
	err := sqlutil.NewQuery(exec).
		Columns(CategoryColumnsWithID).
		Table(TableNameCategories).
		Where(
			sqlutil.WithEq(FieldCategoryAccountID, accountID),
			sqlutil.WithEq(FieldCategoryDate, date),
			sqlutil.WithEq(FieldCategoryDeletedAt, 0),
		).
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
