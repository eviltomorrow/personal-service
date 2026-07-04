package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/eviltomorrow/personal-service/lib/auth"
	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/encrypt"
	"github.com/eviltomorrow/personal-service/lib/redis"
	"github.com/eviltomorrow/personal-service/lib/snowflake"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/go-sql-driver/mysql"
	goredis "github.com/redis/go-redis/v9"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "github.com/eviltomorrow/personal-service/apps/personal-auth/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/personal-auth/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-auth/pkg/model"
)

var (
	selectAccountByID     = model.SelectAccountByAccountID
	selectAccountWithAuth = model.SelectAccountWithAuthByIdentifier
	insertAccount         = model.InsertAccount
	insertAccountAuth     = model.InsertAccountAuth
	deleteAccountAuths    = model.DeleteAccountAuthsByAccountID
	softDeleteAccount     = model.SoftDeleteAccountByAccountID
	updateAccountPassword = model.UpdateAccountPassword
	replaceAuthIdentifier = model.ReplaceAccountAuthIdentifier
	insertLoginHistory    = model.InsertLoginHistory
)

var (
	redisTTL = func(ctx context.Context, key string) (time.Duration, error) {
		return redis.Client.TTL(ctx, key).Result()
	}
	redisIncr   = func(ctx context.Context, key string) (int64, error) { return redis.Client.Incr(ctx, key).Result() }
	redisExpire = func(ctx context.Context, key string, dur time.Duration) error {
		return redis.Client.Expire(ctx, key, dur).Err()
	}
	redisSet = func(ctx context.Context, key string, val interface{}, exp time.Duration) error {
		return redis.Client.Set(ctx, key, val, exp).Err()
	}
	redisDel = func(ctx context.Context, keys ...string) error { return redis.Client.Del(ctx, keys...).Err() }
	redisGet = func(ctx context.Context, key string) (string, error) { return redis.Client.Get(ctx, key).Result() }
)

var (
	jwtCreateToken  = auth.JwtWithCreateToken
	stateRenew      = auth.StateTokenWithRenew
	stateTokenHash  = auth.StateTokenWithParseJwtToken
	stateTokenCount = auth.StateTokenWithCount
	stateSearchList = auth.StateTokenWithSearchList
	stateRevoke     = auth.StateTokenWithRevoke
	stateRevokeAll  = auth.StateTokenWithRevokeAll
	jwtParseToken   = auth.JwtWithParseToken
)

type Auth struct {
	pb.UnimplementedAuthServer
	cfg *config.AuthConfig
}

func NewAuth(cfg *config.Config) (*Auth, error) {
	if cfg.Auth.SigningKey == "" {
		return nil, status.Error(codes.InvalidArgument, "signing_key is required")
	}
	auth.SigningKey = []byte(cfg.Auth.SigningKey)
	return &Auth{cfg: &cfg.Auth}, nil
}

func protoAuthTypeToString(t pb.AuthType) (string, error) {
	switch t {
	case pb.AuthType_AUTH_TYPE_EMAIL:
		return "email", nil
	case pb.AuthType_AUTH_TYPE_USERNAME:
		return "username", nil
	case pb.AuthType_AUTH_TYPE_PHONE:
		return "phone", nil
	default:
		return "", status.Error(codes.InvalidArgument, "invalid auth_type")
	}
}

func (s *Auth) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	authType, err := protoAuthTypeToString(req.AuthType)
	if err != nil {
		return nil, err
	}
	if req.Identifier == "" {
		return nil, status.Error(codes.InvalidArgument, "identifier is required")
	}
	if req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "password is required")
	}

	salt, err := encrypt.Salt()
	if err != nil {
		zlog.Error("generate salt failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "register account failure")
	}
	passwordHash := encrypt.Key(salt, req.Password)
	accountID := snowflake.GenerateID()
	now := time.Now().Unix()

	authRec := &model.AccountAuth{
		AccountID:  accountID,
		AuthType:   authType,
		Identifier: req.Identifier,
		Status:     1,
		Verified:   0,
		CreatedAt:  now,
		UpdatedAt:  now,
	}

	tx, err := dbmysql.DB.BeginTx(ctx, nil)
	if err != nil {
		zlog.Error("begin transaction failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "register account failure")
	}

	isCommit := false
	defer func() {
		if !isCommit {
			if err := tx.Rollback(); err != nil {
				zlog.Error("rollback transaction failure", zap.Error(err))
			}
		}
	}()

	if _, err := insertAccountAuth(ctx, tx, authRec); err != nil {
		var mysqlErr *mysql.MySQLError
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			return nil, status.Error(codes.AlreadyExists, "identifier already registered")
		}
		zlog.Error("register account auth failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "register account failure")
	}

	account := &model.Account{
		AccountID:    accountID,
		Role:         "user",
		Status:       1,
		PasswordHash: passwordHash,
		Salt:         salt,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if _, err := insertAccount(ctx, tx, account); err != nil {
		zlog.Error("register account failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "register account failure")
	}

	if err := tx.Commit(); err != nil {
		zlog.Error("commit transaction failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "register account failure")
	}
	isCommit = true

	tokenExpire := s.cfg.AccessTokenExpire
	accessToken, err := jwtCreateToken(accountID, "user", tokenExpire)
	if err != nil {
		zlog.Error("create access token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "create token failure")
	}

	refreshExpire := s.cfg.RefreshTokenExpire
	refreshTokenStr, err := jwtCreateToken(accountID, "user", refreshExpire)
	if err != nil {
		zlog.Error("create refresh token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "create refresh token failure")
	}
	refreshTokenHash, err := stateTokenHash(refreshTokenStr)
	if err != nil {
		zlog.Error("hash refresh token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "create refresh token failure")
	}
	if err := stateRenew(ctx, "", refreshTokenHash, accountID, accountID+":user", refreshExpire); err != nil {
		zlog.Error("store refresh token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "create refresh token failure")
	}

	return &pb.RegisterResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshTokenStr,
		ExpiresIn:    int64(tokenExpire.Seconds()),
	}, nil
}

func (s *Auth) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	authType, err := protoAuthTypeToString(req.AuthType)
	if err != nil {
		return nil, err
	}
	if req.Identifier == "" {
		return nil, status.Error(codes.InvalidArgument, "identifier is required")
	}
	if req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "password is required")
	}

	identifier := req.Identifier
	ipAddr := req.IpAddress

	if ipAddr != "" {
		ipLockKey := fmt.Sprintf("login_lock:ip:%s", ipAddr)
		ipTTL, err := redisTTL(ctx, ipLockKey)
		if err != nil {
			zlog.Error("check ip lock failure", zap.Error(err))
		} else if ipTTL > 0 {
			return nil, status.Errorf(codes.ResourceExhausted, "ip locked, retry after %.0f seconds", ipTTL.Seconds())
		}
	}

	lockKey := fmt.Sprintf("login_lock:%s", identifier)
	ttl, err := redisTTL(ctx, lockKey)
	if err != nil {
		zlog.Error("check login lock failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "check login lock failure")
	}
	if ttl > 0 {
		return nil, status.Errorf(codes.ResourceExhausted, "account locked, retry after %.0f seconds", ttl.Seconds())
	}

	account, err := selectAccountWithAuth(ctx, dbmysql.DB, authType, identifier)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			if _, histErr := insertLoginHistory(ctx, dbmysql.DB, &model.LoginHistory{
				AuthType:      authType,
				Identifier:    identifier,
				IPAddress:     ipAddr,
				UserAgent:     req.UserAgent,
				Status:        0,
				FailureReason: "account not found",
				CreatedAt:     time.Now().Unix(),
			}); histErr != nil {
				zlog.Error("insert login history failure", zap.Error(histErr))
			}
			return nil, status.Error(codes.NotFound, "account not found")
		}
		zlog.Error("query account with auth failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "query account failure")
	}

	if account.Status != 1 {
		return nil, status.Error(codes.PermissionDenied, "account is frozen or inactive")
	}

	if encrypt.Key(account.Salt, req.Password) != account.PasswordHash {
		if err := s.recordFailedAttempt(ctx, identifier); err != nil {
			zlog.Error("record failed login attempt failure", zap.Error(err))
		}
		if ipAddr != "" {
			if err := s.recordIPFailedAttempt(ctx, ipAddr); err != nil {
				zlog.Error("record failed ip attempt failure", zap.Error(err))
			}
		}
		if _, histErr := insertLoginHistory(ctx, dbmysql.DB, &model.LoginHistory{
			AccountID:     account.AccountID,
			AuthType:      authType,
			Identifier:    identifier,
			IPAddress:     ipAddr,
			UserAgent:     req.UserAgent,
			Status:        0,
			FailureReason: "invalid password",
			CreatedAt:     time.Now().Unix(),
		}); histErr != nil {
			zlog.Error("insert login history failure", zap.Error(histErr))
		}
		return nil, status.Error(codes.Unauthenticated, "invalid password")
	}

	attemptKey := fmt.Sprintf("login_attempt:%s", identifier)
	redisDel(ctx, attemptKey, lockKey)
	if ipAddr != "" {
		redisDel(ctx, fmt.Sprintf("login_attempt:ip:%s", ipAddr), fmt.Sprintf("login_lock:ip:%s", ipAddr))
	}

	tokenExpire := s.cfg.AccessTokenExpire
	accessToken, err := jwtCreateToken(account.AccountID, account.Role, tokenExpire)
	if err != nil {
		zlog.Error("create access token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "create token failure")
	}

	refreshExpire := s.cfg.RefreshTokenExpire
	refreshTokenStr, err := jwtCreateToken(account.AccountID, account.Role, refreshExpire)
	if err != nil {
		zlog.Error("create refresh token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "create refresh token failure")
	}
	refreshTokenHash, err := stateTokenHash(refreshTokenStr)
	if err != nil {
		zlog.Error("hash refresh token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "create refresh token failure")
	}
	if err := stateRenew(ctx, "", refreshTokenHash, account.AccountID, account.AccountID+":"+account.Role, refreshExpire); err != nil {
		zlog.Error("store refresh token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "create refresh token failure")
	}

	if _, histErr := insertLoginHistory(ctx, dbmysql.DB, &model.LoginHistory{
		AccountID:  account.AccountID,
		AuthType:   authType,
		Identifier: identifier,
		IPAddress:  ipAddr,
		UserAgent:  req.UserAgent,
		Status:     1,
		CreatedAt:  time.Now().Unix(),
	}); histErr != nil {
		zlog.Error("insert login history failure", zap.Error(histErr))
	}

	return &pb.LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshTokenStr,
		ExpiresIn:    int64(tokenExpire.Seconds()),
	}, nil
}

func (s *Auth) recordFailedAttempt(ctx context.Context, identity string) error {
	attemptKey := fmt.Sprintf("login_attempt:%s", identity)
	attempts, err := redisIncr(ctx, attemptKey)
	if err != nil {
		return err
	}
	if attempts == 1 {
		redisExpire(ctx, attemptKey, s.cfg.LoginLockDuration)
	}
	if int(attempts) >= s.cfg.MaxLoginAttempts {
		lockKey := fmt.Sprintf("login_lock:%s", identity)
		redisSet(ctx, lockKey, "1", s.cfg.LoginLockDuration)
		redisDel(ctx, attemptKey)
	}
	return nil
}

func (s *Auth) recordIPFailedAttempt(ctx context.Context, ipAddr string) error {
	attemptKey := fmt.Sprintf("login_attempt:ip:%s", ipAddr)
	attempts, err := redisIncr(ctx, attemptKey)
	if err != nil {
		return err
	}
	if attempts == 1 {
		redisExpire(ctx, attemptKey, s.cfg.IPLoginLockDuration)
	}
	if int(attempts) >= s.cfg.MaxIPLoginAttempts {
		lockKey := fmt.Sprintf("login_lock:ip:%s", ipAddr)
		redisSet(ctx, lockKey, "1", s.cfg.IPLoginLockDuration)
		redisDel(ctx, attemptKey)
	}
	return nil
}

func (s *Auth) RefreshToken(ctx context.Context, req *pb.RefreshTokenRequest) (*pb.RefreshTokenResponse, error) {
	if req.RefreshToken == "" {
		return nil, status.Error(codes.InvalidArgument, "refresh_token is required")
	}

	oldTokenHash, err := stateTokenHash(req.RefreshToken)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid refresh token")
	}
	oldKey := fmt.Sprintf("token_%s", oldTokenHash)

	val, err := redisGet(ctx, oldKey)
	if err != nil {
		if errors.Is(err, goredis.Nil) {
			return nil, status.Error(codes.Unauthenticated, "refresh token not found or revoked")
		}
		zlog.Error("get refresh token from redis failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	parts := strings.SplitN(val, ":", 2)
	accountID := parts[0]
	role := "user"
	if len(parts) == 2 {
		role = parts[1]
	}

	newRefreshToken, err := jwtCreateToken(accountID, role, s.cfg.RefreshTokenExpire)
	if err != nil {
		zlog.Error("create new refresh token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "create token failure")
	}
	newRefreshTokenHash, err := stateTokenHash(newRefreshToken)
	if err != nil {
		return nil, status.Error(codes.Internal, "hash token failure")
	}

	if err := stateRenew(ctx, oldTokenHash, newRefreshTokenHash, accountID, accountID+":"+role, s.cfg.RefreshTokenExpire); err != nil {
		zlog.Error("rotate refresh token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "rotate token failure")
	}

	newAccessToken, err := jwtCreateToken(accountID, role, s.cfg.AccessTokenExpire)
	if err != nil {
		zlog.Error("create new access token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "create token failure")
	}

	return &pb.RefreshTokenResponse{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    int64(s.cfg.AccessTokenExpire.Seconds()),
	}, nil
}

func (s *Auth) RevokeToken(ctx context.Context, req *pb.RevokeTokenRequest) (*pb.RevokeTokenResponse, error) {
	if req.RefreshToken == "" {
		return nil, status.Error(codes.InvalidArgument, "refresh_token is required")
	}

	refreshTokenHash, err := stateTokenHash(req.RefreshToken)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid refresh token")
	}
	if err := stateRevoke(ctx, refreshTokenHash); err != nil {
		zlog.Error("revoke token failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "revoke token failure")
	}

	return &pb.RevokeTokenResponse{}, nil
}

func (s *Auth) RevokeAllTokens(ctx context.Context, req *pb.RevokeAllTokensRequest) (*pb.RevokeAllTokensResponse, error) {
	if req.AccessToken == "" {
		return nil, status.Error(codes.InvalidArgument, "access_token is required")
	}

	claims, err := jwtParseToken(req.AccessToken, nil)
	if err != nil {
		if errors.Is(err, auth.ErrTokenExpired) {
			return nil, status.Error(codes.Unauthenticated, "token expired, please use a valid access token")
		}
		return nil, status.Error(codes.Unauthenticated, "invalid token")
	}

	if err := stateRevokeAll(ctx, claims.AccountId); err != nil {
		zlog.Error("revoke all tokens failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "revoke all tokens failure")
	}

	return &pb.RevokeAllTokensResponse{}, nil
}

func (s *Auth) UpdatePassword(ctx context.Context, req *pb.UpdatePasswordRequest) (*pb.UpdatePasswordResponse, error) {
	if req.AccountId == "" {
		return nil, status.Error(codes.InvalidArgument, "account_id is required")
	}
	if req.OldPassword == "" {
		return nil, status.Error(codes.InvalidArgument, "old_password is required")
	}
	if req.NewPassword == "" {
		return nil, status.Error(codes.InvalidArgument, "new_password is required")
	}

	account, err := selectAccountByID(ctx, dbmysql.DB, req.AccountId)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "account not found")
		}
		zlog.Error("query account for update password failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "query account failure")
	}

	if account.Status != 1 {
		return nil, status.Error(codes.PermissionDenied, "account is frozen or inactive")
	}

	if encrypt.Key(account.Salt, req.OldPassword) != account.PasswordHash {
		return nil, status.Error(codes.Unauthenticated, "invalid old password")
	}

	salt, err := encrypt.Salt()
	if err != nil {
		zlog.Error("generate salt failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "update password failure")
	}
	passwordHash := encrypt.Key(salt, req.NewPassword)
	if _, err := updateAccountPassword(ctx, dbmysql.DB, req.AccountId, passwordHash, salt); err != nil {
		zlog.Error("update password failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "update password failure")
	}

	if err := stateRevokeAll(ctx, req.AccountId); err != nil {
		zlog.Error("revoke tokens after password change failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "revoke tokens after password change failure")
	}

	return &pb.UpdatePasswordResponse{}, nil
}

func (s *Auth) UpdateIdentifier(ctx context.Context, req *pb.UpdateIdentifierRequest) (*pb.UpdateIdentifierResponse, error) {
	if req.AccountId == "" {
		return nil, status.Error(codes.InvalidArgument, "account_id is required")
	}
	authType, err := protoAuthTypeToString(req.AuthType)
	if err != nil {
		return nil, err
	}
	if req.NewIdentifier == "" {
		return nil, status.Error(codes.InvalidArgument, "new_identifier is required")
	}

	account, err := selectAccountByID(ctx, dbmysql.DB, req.AccountId)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "account not found")
		}
		zlog.Error("query account for update identifier failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "query account failure")
	}

	if account.Status != 1 {
		return nil, status.Error(codes.PermissionDenied, "account is frozen or inactive")
	}

	n, err := replaceAuthIdentifier(ctx, dbmysql.DB, req.AccountId, authType, req.NewIdentifier)
	if err != nil {
		var mysqlErr *mysql.MySQLError
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			return nil, status.Error(codes.AlreadyExists, "identifier already exists")
		}
		zlog.Error("update identifier failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "update identifier failure")
	}
	if n == 0 {
		return nil, status.Error(codes.NotFound, "auth identifier not found")
	}

	if err := stateRevokeAll(ctx, req.AccountId); err != nil {
		zlog.Error("revoke tokens after identifier change failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "revoke tokens after identifier change failure")
	}

	return &pb.UpdateIdentifierResponse{}, nil
}

func (s *Auth) ValidateToken(ctx context.Context, req *pb.ValidateTokenRequest) (*pb.ValidateTokenResponse, error) {
	if req.AccessToken == "" {
		return nil, status.Error(codes.InvalidArgument, "access_token is required")
	}

	claims, err := jwtParseToken(req.AccessToken, nil)
	if err != nil {
		if errors.Is(err, auth.ErrTokenExpired) {
			return nil, status.Error(codes.Unauthenticated, "token expired")
		}
		return nil, status.Error(codes.Unauthenticated, "invalid token")
	}

	count, err := stateTokenCount(ctx, claims.AccountId)
	if err != nil {
		zlog.Error("count account sessions failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "validate token failure")
	}
	if count == 0 {
		return nil, status.Error(codes.Unauthenticated, "token revoked")
	}

	return &pb.ValidateTokenResponse{
		Role:      claims.Role,
		ExpiresAt: claims.ExpiresAt.Time.Unix(),
	}, nil
}

func (s *Auth) DeleteAccount(ctx context.Context, req *pb.DeleteAccountRequest) (*pb.DeleteAccountResponse, error) {
	if req.AccountId == "" {
		return nil, status.Error(codes.InvalidArgument, "account_id is required")
	}
	if req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "password is required")
	}

	account, err := selectAccountByID(ctx, dbmysql.DB, req.AccountId)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "account not found")
		}
		zlog.Error("query account for delete failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "query account failure")
	}

	if encrypt.Key(account.Salt, req.Password) != account.PasswordHash {
		return nil, status.Error(codes.Unauthenticated, "invalid password")
	}

	if err := stateRevokeAll(ctx, req.AccountId); err != nil {
		zlog.Error("revoke tokens before delete failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "revoke tokens before delete failure")
	}

	if _, err := softDeleteAccount(ctx, dbmysql.DB, req.AccountId); err != nil {
		zlog.Error("soft delete account failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "delete account failure")
	}

	if _, err := deleteAccountAuths(ctx, dbmysql.DB, req.AccountId); err != nil {
		zlog.Error("delete account auths failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "delete account failure")
	}

	return &pb.DeleteAccountResponse{}, nil
}
