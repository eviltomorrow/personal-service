package model

import (
	"context"
	"database/sql"
	"errors"
	"math"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNameTrades = "trades"

const (
	FieldTradeAccountID  = "account_id"
	FieldTradePositionID = "position_id"
	FieldTradeType       = "type"
	FieldTradeDate       = "date"
	FieldTradePrice      = "price"
	FieldTradeQuantity   = "quantity"
	FieldTradeNote       = "note"
	FieldTradeDeletedAt  = "deleted_at"
	FieldTradeCreatedAt  = "created_at"
	FieldTradeUpdatedAt  = "updated_at"
)

type Trade struct {
	ID         int64
	AccountID  string
	PositionID int64
	Type       int
	Date       string
	Price      int64
	Quantity   int
	Note       string
	DeletedAt  int64
	CreatedAt  int64
	UpdatedAt  int64
}

var TradeColumns = []string{
	FieldTradeAccountID, FieldTradePositionID, FieldTradeType, FieldTradeDate,
	FieldTradePrice, FieldTradeQuantity, FieldTradeNote, FieldTradeDeletedAt,
	FieldTradeCreatedAt, FieldTradeUpdatedAt,
}

var TradeColumnsWithID = append([]string{"id"}, TradeColumns...)

func scanTrade(row *sql.Row) (*Trade, error) {
	t := &Trade{}
	var priceDec float64
	err := row.Scan(&t.ID, &t.AccountID, &t.PositionID, &t.Type, &t.Date,
		&priceDec, &t.Quantity, &t.Note, &t.DeletedAt, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	t.Price = int64(math.Round(priceDec * 100))
	return t, nil
}

func scanTrades(rows *sql.Rows) ([]*Trade, error) {
	var list []*Trade
	for rows.Next() {
		t := &Trade{}
		var priceDec float64
		err := rows.Scan(&t.ID, &t.AccountID, &t.PositionID, &t.Type, &t.Date,
			&priceDec, &t.Quantity, &t.Note, &t.DeletedAt, &t.CreatedAt, &t.UpdatedAt)
		if err != nil {
			return nil, err
		}
		t.Price = int64(math.Round(priceDec * 100))
		list = append(list, t)
	}
	return list, nil
}

func InsertTrade(ctx context.Context, exec dbmysql.Exec, t *Trade) (int64, error) {
	return sqlutil.NewInsert(exec).Table(TableNameTrades).InsertCtx(ctx, map[string]interface{}{
		FieldTradeAccountID:  t.AccountID,
		FieldTradePositionID: t.PositionID,
		FieldTradeType:       t.Type,
		FieldTradeDate:       t.Date,
		FieldTradePrice:      float64(t.Price) / 100.0,
		FieldTradeQuantity:   t.Quantity,
		FieldTradeNote:       t.Note,
		FieldTradeDeletedAt:  t.DeletedAt,
		FieldTradeCreatedAt:  t.CreatedAt,
		FieldTradeUpdatedAt:  t.UpdatedAt,
	})
}

func SelectTradesByPositionID(ctx context.Context, exec dbmysql.Exec, positionID int64) ([]*Trade, error) {
	var list []*Trade
	err := sqlutil.NewQuery(exec).
		Columns(TradeColumnsWithID).
		Table(TableNameTrades).
		Where(sqlutil.WithEq(FieldTradePositionID, positionID), sqlutil.WithEq(FieldTradeDeletedAt, 0)).
		OrderBy(sqlutil.DESC(FieldTradeDate)).
		QueryCtx(ctx, func(rows *sql.Rows) error {
			var err error
			list, err = scanTrades(rows)
			return err
		})
	if err != nil {
		return nil, err
	}
	return list, nil
}

func SelectTradeByID(ctx context.Context, exec dbmysql.Exec, id int64) (*Trade, error) {
	var t *Trade
	err := sqlutil.NewQuery(exec).
		Columns(TradeColumnsWithID).
		Table(TableNameTrades).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldTradeDeletedAt, 0)).
		QueryOneCtx(ctx, func(row *sql.Row) error {
			var err error
			t, err = scanTrade(row)
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

func UpdateTradeByID(ctx context.Context, exec dbmysql.Exec, id int64, updates map[string]interface{}) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameTrades).
		Field(updates).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldTradeDeletedAt, 0)).
		UpdateCtx(ctx)
}

func SoftDeleteTradeByID(ctx context.Context, exec dbmysql.Exec, id int64, deletedAt int64) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameTrades).
		Field(map[string]interface{}{FieldTradeDeletedAt: deletedAt, FieldTradeUpdatedAt: deletedAt}).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldTradeDeletedAt, 0)).
		UpdateCtx(ctx)
}

func SoftDeleteTradesByPositionID(ctx context.Context, exec dbmysql.Exec, positionID int64, deletedAt int64) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameTrades).
		Field(map[string]interface{}{FieldTradeDeletedAt: deletedAt, FieldTradeUpdatedAt: deletedAt}).
		Where(sqlutil.WithEq(FieldTradePositionID, positionID), sqlutil.WithEq(FieldTradeDeletedAt, 0)).
		UpdateCtx(ctx)
}
