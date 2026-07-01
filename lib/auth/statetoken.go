package auth

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"time"

	goredis "github.com/redis/go-redis/v9"

	"github.com/eviltomorrow/personal-service/lib/redis"
)

// mockable redis functions
var (
	redisHGetAllFn = func(ctx context.Context, key string) (map[string]string, error) {
		return redis.Client.HGetAll(ctx, key).Result()
	}
	redisExistsFn = func(ctx context.Context, key string) (int64, error) {
		return redis.Client.Exists(ctx, key).Result()
	}
	redisHDelFn = func(ctx context.Context, key string, fields ...string) (int64, error) {
		return redis.Client.HDel(ctx, key, fields...).Result()
	}
	redisHLenFn = func(ctx context.Context, key string) (int64, error) {
		return redis.Client.HLen(ctx, key).Result()
	}
	redisSetFn = func(ctx context.Context, key string, value interface{}, expiration time.Duration) error {
		return redis.Client.Set(ctx, key, value, expiration).Err()
	}
	redisHSetFn = func(ctx context.Context, key string, values ...interface{}) (int64, error) {
		return redis.Client.HSet(ctx, key, values...).Result()
	}
	redisDelFn = func(ctx context.Context, keys ...string) (int64, error) {
		return redis.Client.Del(ctx, keys...).Result()
	}
	redisGetFn = func(ctx context.Context, key string) (string, error) {
		return redis.Client.Get(ctx, key).Result()
	}
)

var (
	tokenPrefix        = "token_"
	tokenAccountPrefix = "token_account_"

	TokenLimitPerAccount int64 = 10
)

var (
	redisTTLFn = func(ctx context.Context, key string) (time.Duration, error) {
		return redis.Client.TTL(ctx, key).Result()
	}
)

var ErrorNoAuth = errors.New("no auth")

func StateTokenWithParseJwtToken(jwtToken string) (string, error) {
	h := sha256.New()
	if _, err := h.Write([]byte(jwtToken)); err != nil {
		return "", fmt.Errorf("panic: write sha256 failure, nest error: %v", err)
	}
	return fmt.Sprintf("%x", h.Sum(nil)), nil
}

func StateTokenWithExists(ctx context.Context, jwtToken string) (bool, error) {
	h := sha256.New()
	if _, err := h.Write([]byte(jwtToken)); err != nil {
		return false, fmt.Errorf("panic: write sha256 failure, nest error: %v", err)
	}
	key := fmt.Sprintf("%s%x", tokenPrefix, h.Sum(nil))
	n, err := redisExistsFn(ctx, key)
	if err != nil {
		return false, err
	}
	return n > 0, nil
}

func stateTokenWithCleanExpires(ctx context.Context, id string) error {
	key := fmt.Sprintf("%s%s", tokenAccountPrefix, id)
	data, err := redisHGetAllFn(ctx, key)
	if err != nil {
		return err
	}

	exists := make([]string, 0, len(data))
	for k := range data {
		v, err := redisExistsFn(ctx, fmt.Sprintf("%s%s", tokenPrefix, k))
		if err != nil {
			return err
		}
		if v == 0 {
			exists = append(exists, k)
		}
	}
	if len(exists) != 0 {
		if _, err := redisHDelFn(ctx, key, exists...); err != nil {
			return err
		}
	}

	return nil
}

func StateTokenWithCount(ctx context.Context, id string) (int64, error) {
	if err := stateTokenWithCleanExpires(ctx, id); err != nil {
		return 0, err
	}

	key := fmt.Sprintf("%s%s", tokenAccountPrefix, id)
	return redisHLenFn(ctx, key)
}

func StateTokenWithSearchList(ctx context.Context, id string) ([]string, error) {
	if err := stateTokenWithCleanExpires(ctx, id); err != nil {
		return nil, err
	}

	key := fmt.Sprintf("%s%s", tokenAccountPrefix, id)
	data, err := redisHGetAllFn(ctx, key)
	if err != nil {
		return nil, err
	}

	tokens := make([]string, 0, len(data))
	for k := range data {
		tokens = append(tokens, k)
	}

	return tokens, nil
}

func evictOldestToken(ctx context.Context, id string) error {
	tokens, err := StateTokenWithSearchList(ctx, id)
	if err != nil {
		return err
	}
	if len(tokens) == 0 {
		return nil
	}

	var oldestToken string
	var oldestTTL time.Duration = -1
	for _, token := range tokens {
		key := fmt.Sprintf("%s%s", tokenPrefix, token)
		ttl, err := redisTTLFn(ctx, key)
		if err != nil {
			continue
		}
		if oldestTTL == -1 || ttl < oldestTTL {
			oldestTTL = ttl
			oldestToken = token
		}
	}

	if oldestToken != "" {
		return StateTokenWithRevoke(ctx, oldestToken)
	}
	return StateTokenWithRevoke(ctx, tokens[0])
}

func StateTokenWithRenew(ctx context.Context, oldToken, newToken string, id string, expiresIn time.Duration) error {
	if newToken == "" || id == "" {
		return fmt.Errorf("new_token/id is nil")
	}

	if oldToken != "" {
		key := fmt.Sprintf("%s%s", tokenPrefix, oldToken)
		ok, err := redisExistsFn(ctx, key)
		if err != nil {
			return err
		}
		if ok != 1 {
			return ErrorNoAuth
		}
	}

	count, err := StateTokenWithCount(ctx, id)
	if err != nil {
		return err
	}
	if count >= TokenLimitPerAccount {
		if oldToken == "" {
			// New login at capacity: evict oldest token to make room
			if err := evictOldestToken(ctx, id); err != nil {
				return err
			}
		} else {
			return fmt.Errorf("token apply has reached the maximum")
		}
	}

	tokenKey := fmt.Sprintf("%s%s", tokenPrefix, newToken)
	if err := redisSetFn(ctx, tokenKey, id, expiresIn); err != nil {
		return err
	}

	accountKey := fmt.Sprintf("%s%s", tokenAccountPrefix, id)
	if _, err := redisHSetFn(ctx, accountKey, newToken, 0); err != nil {
		return err
	}

	if oldToken != "" {
		key1 := fmt.Sprintf("%s%s", tokenPrefix, oldToken)
		if _, err := redisDelFn(ctx, key1); err != nil {
			return err
		}

		if _, err := redisHDelFn(ctx, accountKey, oldToken); err != nil {
			return err
		}
	}

	return nil
}

func StateTokenWithRevokeAll(ctx context.Context, id string) error {
	tokens, err := StateTokenWithSearchList(ctx, id)
	if err != nil {
		return err
	}
	keys := make([]string, 0, len(tokens))
	for _, token := range tokens {
		key := fmt.Sprintf("%s%s", tokenPrefix, token)
		keys = append(keys, key)
	}
	if _, err := redisDelFn(ctx, keys...); err != nil {
		return err
	}
	key := fmt.Sprintf("%s%s", tokenAccountPrefix, id)
	if _, err := redisDelFn(ctx, key); err != nil {
		return err
	}
	return nil
}

func StateTokenWithRevoke(ctx context.Context, token string) error {
	if token == "" {
		return nil
	}

	tokenKey := fmt.Sprintf("%s%s", tokenPrefix, token)
	id, err := redisGetFn(ctx, tokenKey)
	if err != nil {
		if errors.Is(err, goredis.Nil) {
			return nil
		}
		return err
	}

	if _, err := redisDelFn(ctx, tokenKey); err != nil {
		return err
	}

	accountKey := fmt.Sprintf("%s%s", tokenAccountPrefix, id)
	if _, err := redisHDelFn(ctx, accountKey, token); err != nil {
		return err
	}
	return nil
}
