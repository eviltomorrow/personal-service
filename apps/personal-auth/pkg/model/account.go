package model

import (
	"context"
	"database/sql"
	"errors"
	"time"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNameAccounts = "accounts"

const (
	FieldAccountAccountID    = "account_id"
	FieldAccountRole         = "role"
	FieldAccountStatus       = "status"
	FieldAccountPasswordHash = "password_hash"
	FieldAccountSalt         = "salt"
	FieldAccountDeletedAt    = "deleted_at"
	FieldAccountCreatedAt    = "created_at"
	FieldAccountUpdatedAt    = "updated_at"
)

type Account struct {
	AccountID    string
	Role         string
	Status       int
	PasswordHash string
	Salt         string
	DeletedAt    int64
	CreatedAt    int64
	UpdatedAt    int64
}

func scanAccount(row *sql.Row) (*Account, error) {
	a := &Account{}
	err := row.Scan(&a.AccountID, &a.Role, &a.Status, &a.PasswordHash, &a.Salt, &a.DeletedAt, &a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return a, nil
}

func InsertAccount(ctx context.Context, exec dbmysql.Exec, a *Account) (int64, error) {
	return sqlutil.NewInsert(exec).Table(TableNameAccounts).InsertCtx(ctx, map[string]interface{}{
		FieldAccountAccountID:    a.AccountID,
		FieldAccountRole:         a.Role,
		FieldAccountStatus:       a.Status,
		FieldAccountPasswordHash: a.PasswordHash,
		FieldAccountSalt:         a.Salt,
		FieldAccountDeletedAt:    a.DeletedAt,
		FieldAccountCreatedAt:    a.CreatedAt,
		FieldAccountUpdatedAt:    a.UpdatedAt,
	})
}

func SelectAccountByAccountID(ctx context.Context, exec dbmysql.Exec, accountID string) (*Account, error) {
	var a *Account
	err := sqlutil.NewQuery(exec).
		Columns([]string{FieldAccountAccountID, FieldAccountRole, FieldAccountStatus, FieldAccountPasswordHash, FieldAccountSalt, FieldAccountDeletedAt, FieldAccountCreatedAt, FieldAccountUpdatedAt}).
		Table(TableNameAccounts).
		Where(sqlutil.WithEq(FieldAccountAccountID, accountID), sqlutil.WithEq(FieldAccountDeletedAt, 0)).
		QueryOneCtx(ctx, func(row *sql.Row) error {
			var err error
			a, err = scanAccount(row)
			return err
		})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return a, nil
}

func SoftDeleteAccountByAccountID(ctx context.Context, exec dbmysql.Exec, accountID string) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameAccounts).
		Field(map[string]interface{}{
			FieldAccountDeletedAt: time.Now().Unix(),
			FieldAccountStatus:    0,
		}).
		Where(sqlutil.WithEq(FieldAccountAccountID, accountID), sqlutil.WithEq(FieldAccountDeletedAt, 0)).
		UpdateCtx(ctx)
}

func UpdateAccountPassword(ctx context.Context, exec dbmysql.Exec, accountID, passwordHash, salt string) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameAccounts).
		Field(map[string]interface{}{
			FieldAccountPasswordHash: passwordHash,
			FieldAccountSalt:         salt,
		}).
		Where(sqlutil.WithEq(FieldAccountAccountID, accountID), sqlutil.WithEq(FieldAccountDeletedAt, 0)).
		UpdateCtx(ctx)
}

type AccountWithAuth struct {
	AccountID    string
	Role         string
	Status       int
	PasswordHash string
	Salt         string
	DeletedAt    int64
}

func SelectAccountWithAuthByIdentifier(ctx context.Context, exec dbmysql.Exec, authType, identifier string) (*AccountWithAuth, error) {
	var a AccountWithAuth
	row := exec.QueryRowContext(ctx,
		`SELECT a.account_id, a.role, a.status, a.password_hash, a.salt, a.deleted_at
		 FROM accounts a
		 JOIN account_auths aa ON a.account_id = aa.account_id
		 WHERE aa.auth_type = ? AND aa.identifier = ? AND a.deleted_at = 0 AND aa.deleted_at = 0 AND aa.status = 1`,
		authType, identifier)
	if err := row.Scan(&a.AccountID, &a.Role, &a.Status, &a.PasswordHash, &a.Salt, &a.DeletedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &a, nil
}
