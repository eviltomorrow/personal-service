package model

import (
	"context"
	"database/sql"
	"errors"
	"math"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNamePositions = "positions"

const (
	FieldPosAccountID    = "account_id"
	FieldPosCode         = "code"
	FieldPosName         = "name"
	FieldPosType         = "type"
	FieldPosDirection    = "direction"
	FieldPosInitialQty   = "initial_qty"
	FieldPosCurrentPrice = "current_price"
	FieldPosMarginRatio  = "margin_ratio"
	FieldPosSortOrder    = "sort_order"
	FieldPosArchived     = "archived"
	FieldPosClosedPnl    = "closed_pnl"
	FieldPosDeletedAt    = "deleted_at"
	FieldPosCreatedAt    = "created_at"
	FieldPosUpdatedAt    = "updated_at"
)

type Position struct {
	ID           int64
	AccountID    string
	Code         string
	Name         string
	Type         int
	Direction    string
	InitialQty   int
	CurrentPrice int64
	MarginRatio  int
	SortOrder    int
	Archived     bool
	ClosedPnl    int64
	DeletedAt    int64
	CreatedAt    int64
	UpdatedAt    int64
}

var PositionColumns = []string{
	FieldPosAccountID, FieldPosCode, FieldPosName, FieldPosType, FieldPosDirection,
	FieldPosInitialQty, FieldPosCurrentPrice, FieldPosMarginRatio, FieldPosSortOrder,
	FieldPosArchived, FieldPosClosedPnl, FieldPosDeletedAt, FieldPosCreatedAt, FieldPosUpdatedAt,
}

var PositionColumnsWithID = append([]string{"id"}, PositionColumns...)

func scanPosition(row *sql.Row) (*Position, error) {
	p := &Position{}
	var currentPriceDec, closedPnlDec float64
	err := row.Scan(&p.ID, &p.AccountID, &p.Code, &p.Name, &p.Type, &p.Direction,
		&p.InitialQty, &currentPriceDec, &p.MarginRatio, &p.SortOrder,
		&p.Archived, &closedPnlDec, &p.DeletedAt, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	p.CurrentPrice = int64(math.Round(currentPriceDec * 100))
	p.ClosedPnl = int64(math.Round(closedPnlDec * 100))
	return p, nil
}

func scanPositions(rows *sql.Rows) ([]*Position, error) {
	var list []*Position
	for rows.Next() {
		p := &Position{}
		var currentPriceDec, closedPnlDec float64
		err := rows.Scan(&p.ID, &p.AccountID, &p.Code, &p.Name, &p.Type, &p.Direction,
			&p.InitialQty, &currentPriceDec, &p.MarginRatio, &p.SortOrder,
			&p.Archived, &closedPnlDec, &p.DeletedAt, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, err
		}
		p.CurrentPrice = int64(math.Round(currentPriceDec * 100))
		p.ClosedPnl = int64(math.Round(closedPnlDec * 100))
		list = append(list, p)
	}
	return list, nil
}

func InsertPosition(ctx context.Context, exec dbmysql.Exec, p *Position) (int64, error) {
	return sqlutil.NewInsert(exec).Table(TableNamePositions).InsertCtx(ctx, map[string]interface{}{
		FieldPosAccountID:    p.AccountID,
		FieldPosCode:         p.Code,
		FieldPosName:         p.Name,
		FieldPosType:         p.Type,
		FieldPosDirection:    p.Direction,
		FieldPosInitialQty:   p.InitialQty,
		FieldPosCurrentPrice: float64(p.CurrentPrice) / 100.0,
		FieldPosMarginRatio:  p.MarginRatio,
		FieldPosSortOrder:    p.SortOrder,
		FieldPosArchived:     p.Archived,
		FieldPosClosedPnl:    float64(p.ClosedPnl) / 100.0,
		FieldPosDeletedAt:    p.DeletedAt,
		FieldPosCreatedAt:    p.CreatedAt,
		FieldPosUpdatedAt:    p.UpdatedAt,
	})
}

func SelectPositionsByAccountID(ctx context.Context, exec dbmysql.Exec, accountID string) ([]*Position, error) {
	var list []*Position
	err := sqlutil.NewQuery(exec).
		Columns(PositionColumnsWithID).
		Table(TableNamePositions).
		Where(sqlutil.WithEq(FieldPosAccountID, accountID), sqlutil.WithEq(FieldPosDeletedAt, 0)).
		OrderBy(sqlutil.ASC(FieldPosSortOrder)).
		QueryCtx(ctx, func(rows *sql.Rows) error {
			var err error
			list, err = scanPositions(rows)
			return err
		})
	if err != nil {
		return nil, err
	}
	return list, nil
}

func SelectPositionByID(ctx context.Context, exec dbmysql.Exec, id int64) (*Position, error) {
	var p *Position
	err := sqlutil.NewQuery(exec).
		Columns(PositionColumnsWithID).
		Table(TableNamePositions).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldPosDeletedAt, 0)).
		QueryOneCtx(ctx, func(row *sql.Row) error {
			var err error
			p, err = scanPosition(row)
			return err
		})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return p, nil
}

func UpdatePositionByID(ctx context.Context, exec dbmysql.Exec, id int64, updates map[string]interface{}) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNamePositions).
		Field(updates).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldPosDeletedAt, 0)).
		UpdateCtx(ctx)
}

func SoftDeletePositionByID(ctx context.Context, exec dbmysql.Exec, id int64, deletedAt int64) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNamePositions).
		Field(map[string]interface{}{FieldPosDeletedAt: deletedAt, FieldPosUpdatedAt: deletedAt}).
		Where(sqlutil.WithEq("id", id), sqlutil.WithEq(FieldPosDeletedAt, 0)).
		UpdateCtx(ctx)
}
