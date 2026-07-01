package auth

import "context"

type contextKey string

const (
	AccountIDKey contextKey = "account_id"
	TokenKey     contextKey = "token"
)

func WithAccountID(ctx context.Context, accountID string) context.Context {
	return context.WithValue(ctx, AccountIDKey, accountID)
}

func AccountIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(AccountIDKey).(string)
	return v, ok
}

func WithToken(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, TokenKey, token)
}

func TokenFromContext(ctx context.Context) string {
	v, _ := ctx.Value(TokenKey).(string)
	return v
}
