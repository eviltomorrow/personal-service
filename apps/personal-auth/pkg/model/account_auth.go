package model

import (
	"context"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNameAccountAuths = "account_auths"

const (
	FieldAccountAuthAccountID  = "account_id"
	FieldAccountAuthAuthType   = "auth_type"
	FieldAccountAuthIdentifier = "identifier"
	FieldAccountAuthStatus     = "status"
	FieldAccountAuthVerified   = "verified"
	FieldAccountAuthDeletedAt  = "deleted_at"
	FieldAccountAuthCreatedAt  = "created_at"
	FieldAccountAuthUpdatedAt  = "updated_at"
)

type AccountAuth struct {
	AccountID  string
	AuthType   string
	Identifier string
	Status     int
	Verified   int
	DeletedAt  int64
	CreatedAt  int64
	UpdatedAt  int64
}

func InsertAccountAuth(ctx context.Context, exec dbmysql.Exec, a *AccountAuth) (int64, error) {
	return sqlutil.NewInsert(exec).Table(TableNameAccountAuths).InsertCtx(ctx, map[string]interface{}{
		FieldAccountAuthAccountID:  a.AccountID,
		FieldAccountAuthAuthType:   a.AuthType,
		FieldAccountAuthIdentifier: a.Identifier,
		FieldAccountAuthStatus:     a.Status,
		FieldAccountAuthVerified:   a.Verified,
		FieldAccountAuthDeletedAt:  a.DeletedAt,
		FieldAccountAuthCreatedAt:  a.CreatedAt,
		FieldAccountAuthUpdatedAt:  a.UpdatedAt,
	})
}

func DeleteAccountAuthsByAccountID(ctx context.Context, exec dbmysql.Exec, accountID string) (int64, error) {
	return sqlutil.NewDelete(exec).
		Table(TableNameAccountAuths).
		Where(sqlutil.WithEq(FieldAccountAuthAccountID, accountID)).
		DeleteCtx(ctx)
}

func ReplaceAccountAuthIdentifier(ctx context.Context, exec dbmysql.Exec, accountID, authType, identifier string) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameAccountAuths).
		Field(map[string]interface{}{
			FieldAccountAuthIdentifier: identifier,
		}).
		Where(sqlutil.WithEq(FieldAccountAuthAccountID, accountID), sqlutil.WithEq(FieldAccountAuthAuthType, authType), sqlutil.WithEq(FieldAccountAuthDeletedAt, 0)).
		UpdateCtx(ctx)
}
