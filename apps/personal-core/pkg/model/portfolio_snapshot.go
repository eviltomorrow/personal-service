package model

import (
	"context"
	"database/sql"
	"fmt"
	"math"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNameValueSnapshots = "value_snapshots"

const (
	FieldSnapAccountID  = "account_id"
	FieldSnapDate       = "date"
	FieldSnapTotalValue = "total_value"
	FieldSnapCreatedAt  = "created_at"
)

type ValueSnapshot struct {
	ID         int64
	AccountID  string
	Date       string
	TotalValue int64
	CreatedAt  int64
}

var SnapshotColumns = []string{
	FieldSnapAccountID, FieldSnapDate, FieldSnapTotalValue, FieldSnapCreatedAt,
}

var SnapshotColumnsWithID = append([]string{"id"}, SnapshotColumns...)

func scanSnapshots(rows *sql.Rows) ([]*ValueSnapshot, error) {
	var list []*ValueSnapshot
	for rows.Next() {
		s := &ValueSnapshot{}
		var totalDec float64
		err := rows.Scan(&s.ID, &s.AccountID, &s.Date, &totalDec, &s.CreatedAt)
		if err != nil {
			return nil, err
		}
		s.TotalValue = int64(math.Round(totalDec * 100))
		list = append(list, s)
	}
	return list, nil
}

func SelectSnapshotsByAccountID(ctx context.Context, exec dbmysql.Exec, accountID string) ([]*ValueSnapshot, error) {
	var list []*ValueSnapshot
	err := sqlutil.NewQuery(exec).
		Columns(SnapshotColumnsWithID).
		Table(TableNameValueSnapshots).
		Where(sqlutil.WithEq(FieldSnapAccountID, accountID)).
		OrderBy(sqlutil.ASC(FieldSnapDate)).
		QueryCtx(ctx, func(rows *sql.Rows) error {
			var err error
			list, err = scanSnapshots(rows)
			return err
		})
	if err != nil {
		return nil, err
	}
	return list, nil
}

func UpsertSnapshot(ctx context.Context, exec dbmysql.Exec, s *ValueSnapshot) error {
	query := fmt.Sprintf(
		"INSERT INTO %s (%s, %s, %s, %s) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE %s = ?",
		TableNameValueSnapshots,
		FieldSnapAccountID, FieldSnapDate, FieldSnapTotalValue, FieldSnapCreatedAt,
		FieldSnapTotalValue,
	)
	_, err := exec.ExecContext(ctx, query,
		s.AccountID, s.Date, float64(s.TotalValue)/100.0, s.CreatedAt,
		float64(s.TotalValue)/100.0,
	)
	return err
}
