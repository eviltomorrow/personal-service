package model

import (
	"context"
	"database/sql"
	"fmt"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNamePortfolioConfig = "portfolio_config"

const (
	FieldCfgAccountID    = "account_id"
	FieldCfgTotalCapital = "total_capital"
	FieldCfgUpdatedAt    = "updated_at"
)

type PortfolioConfig struct {
	ID           int64
	AccountID    string
	TotalCapital int64
	UpdatedAt    int64
}

var ConfigColumns = []string{
	FieldCfgAccountID, FieldCfgTotalCapital, FieldCfgUpdatedAt,
}

var ConfigColumnsWithID = append([]string{"id"}, ConfigColumns...)

func scanConfig(row *sql.Row) (*PortfolioConfig, error) {
	c := &PortfolioConfig{}
	var capitalDec float64
	err := row.Scan(&c.ID, &c.AccountID, &capitalDec, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	c.TotalCapital = int64(capitalDec * 100 + 0.5)
	return c, nil
}

func SelectConfigByAccountID(ctx context.Context, exec dbmysql.Exec, accountID string) (*PortfolioConfig, error) {
	var c *PortfolioConfig
	err := sqlutil.NewQuery(exec).
		Columns(ConfigColumnsWithID).
		Table(TableNamePortfolioConfig).
		Where(sqlutil.WithEq(FieldCfgAccountID, accountID)).
		QueryOneCtx(ctx, func(row *sql.Row) error {
			var err error
			c, err = scanConfig(row)
			return err
		})
	if err != nil {
		return nil, err
	}
	return c, nil
}

func UpsertConfig(ctx context.Context, exec dbmysql.Exec, accountID string, totalCapital int64, updatedAt int64) error {
	query := fmt.Sprintf(
		"INSERT INTO %s (%s, %s, %s) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE %s = ?, %s = ?",
		TableNamePortfolioConfig,
		FieldCfgAccountID, FieldCfgTotalCapital, FieldCfgUpdatedAt,
		FieldCfgTotalCapital, FieldCfgUpdatedAt,
	)
	_, err := exec.ExecContext(ctx, query,
		accountID, float64(totalCapital)/100.0, updatedAt,
		float64(totalCapital)/100.0, updatedAt,
	)
	return err
}
