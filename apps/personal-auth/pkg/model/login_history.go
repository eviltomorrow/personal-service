package model

import (
	"context"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNameLoginHistory = "login_history"

const (
	FieldLoginHistoryAccountID     = "account_id"
	FieldLoginHistoryAuthType      = "auth_type"
	FieldLoginHistoryIdentifier    = "identifier"
	FieldLoginHistoryIPAddress     = "ip_address"
	FieldLoginHistoryUserAgent     = "user_agent"
	FieldLoginHistoryStatus        = "status"
	FieldLoginHistoryFailureReason = "failure_reason"
	FieldLoginHistoryCreatedAt     = "created_at"
)

type LoginHistory struct {
	AccountID     string
	AuthType      string
	Identifier    string
	IPAddress     string
	UserAgent     string
	Status        int
	FailureReason string
	CreatedAt     int64
}

func InsertLoginHistory(ctx context.Context, exec dbmysql.Exec, h *LoginHistory) (int64, error) {
	return sqlutil.NewInsert(exec).Table(TableNameLoginHistory).InsertCtx(ctx, map[string]interface{}{
		FieldLoginHistoryAccountID:     h.AccountID,
		FieldLoginHistoryAuthType:      h.AuthType,
		FieldLoginHistoryIdentifier:    h.Identifier,
		FieldLoginHistoryIPAddress:     h.IPAddress,
		FieldLoginHistoryUserAgent:     h.UserAgent,
		FieldLoginHistoryStatus:        h.Status,
		FieldLoginHistoryFailureReason: h.FailureReason,
		FieldLoginHistoryCreatedAt:     h.CreatedAt,
	})
}
