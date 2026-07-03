package model

import (
	"context"
	"database/sql"
	"errors"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNameProfiles = "profiles"

const (
	FieldProfileAccountID = "account_id"
	FieldProfileNickname  = "nickname"
	FieldProfileEmail     = "email"
	FieldProfileBio       = "bio"
	FieldProfileAvatarURL = "avatar_url"
	FieldProfileDeletedAt = "deleted_at"
	FieldProfileCreatedAt = "created_at"
	FieldProfileUpdatedAt = "updated_at"
)

type Profile struct {
	ID        int64
	AccountID string
	Nickname  string
	Email     string
	Bio       string
	AvatarURL string
	DeletedAt int64
	CreatedAt int64
	UpdatedAt int64
}

var ProfileColumns = []string{
	FieldProfileAccountID, FieldProfileNickname, FieldProfileEmail,
	FieldProfileBio, FieldProfileAvatarURL,
	FieldProfileDeletedAt, FieldProfileCreatedAt, FieldProfileUpdatedAt,
}

var ProfileColumnsWithID = append([]string{"id"}, ProfileColumns...)

func scanProfile(row *sql.Row) (*Profile, error) {
	p := &Profile{}
	err := row.Scan(&p.ID, &p.AccountID, &p.Nickname, &p.Email,
		&p.Bio, &p.AvatarURL, &p.DeletedAt, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func InsertProfile(ctx context.Context, exec dbmysql.Exec, p *Profile) (int64, error) {
	return sqlutil.NewInsert(exec).Table(TableNameProfiles).InsertCtx(ctx, map[string]interface{}{
		FieldProfileAccountID: p.AccountID,
		FieldProfileNickname:  p.Nickname,
		FieldProfileEmail:     p.Email,
		FieldProfileBio:       p.Bio,
		FieldProfileAvatarURL: p.AvatarURL,
		FieldProfileDeletedAt: p.DeletedAt,
		FieldProfileCreatedAt: p.CreatedAt,
		FieldProfileUpdatedAt: p.UpdatedAt,
	})
}

func SelectProfileByAccountID(ctx context.Context, exec dbmysql.Exec, accountID string) (*Profile, error) {
	var p *Profile
	err := sqlutil.NewQuery(exec).
		Columns(ProfileColumnsWithID).
		Table(TableNameProfiles).
		Where(sqlutil.WithEq(FieldProfileAccountID, accountID), sqlutil.WithEq(FieldProfileDeletedAt, 0)).
		QueryOneCtx(ctx, func(row *sql.Row) error {
			var err error
			p, err = scanProfile(row)
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

func UpdateProfileByAccountID(ctx context.Context, exec dbmysql.Exec, accountID string, updates map[string]interface{}) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameProfiles).
		Field(updates).
		Where(sqlutil.WithEq(FieldProfileAccountID, accountID), sqlutil.WithEq(FieldProfileDeletedAt, 0)).
		UpdateCtx(ctx)
}
