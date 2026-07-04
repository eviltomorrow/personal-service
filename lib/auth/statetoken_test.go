package auth

import (
	"context"
	"crypto/sha256"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestStateTokenWithParseJwtToken(t *testing.T) {
	jwtToken := "this.is.jwt-token"
	expected := fmt.Sprintf("%x", sha256.Sum256([]byte(jwtToken)))

	token, err := StateTokenWithParseJwtToken(jwtToken)
	assert.Nil(t, err)
	assert.Equal(t, expected, token)
}

func TestStateTokenWithParseJwtToken_Empty(t *testing.T) {
	token, err := StateTokenWithParseJwtToken("")
	assert.Nil(t, err)
	assert.Equal(t, fmt.Sprintf("%x", sha256.Sum256([]byte(""))), token)
}

// ---------- StateTokenWithCount ----------

func TestStateTokenWithCount_HappyPath(t *testing.T) {
	origClean := redisHGetAllFn
	origExists := redisExistsFn
	origHLen := redisHLenFn
	t.Cleanup(func() {
		redisHGetAllFn = origClean
		redisExistsFn = origExists
		redisHLenFn = origHLen
	})

	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return map[string]string{"tok1": "0", "tok2": "0"}, nil
	}
	redisExistsFn = func(_ context.Context, _ string) (int64, error) {
		return 1, nil
	}
	redisHLenFn = func(_ context.Context, _ string) (int64, error) {
		return 2, nil
	}

	count, err := StateTokenWithCount(context.Background(), "user_1")
	assert.Nil(t, err)
	assert.Equal(t, int64(2), count)
}

func TestStateTokenWithCount_CleanExpiresError(t *testing.T) {
	orig := redisHGetAllFn
	t.Cleanup(func() { redisHGetAllFn = orig })

	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return nil, errors.New("redis error")
	}

	_, err := StateTokenWithCount(context.Background(), "user_1")
	assert.NotNil(t, err)
}

// ---------- StateTokenWithSearchList ----------

func TestStateTokenWithSearchList_HappyPath(t *testing.T) {
	origClean := redisHGetAllFn
	origExists := redisExistsFn
	t.Cleanup(func() {
		redisHGetAllFn = origClean
		redisExistsFn = origExists
	})

	redisHGetAllFn = func(_ context.Context, key string) (map[string]string, error) {
		return map[string]string{"tok_a": "0", "tok_b": "0"}, nil
	}
	redisExistsFn = func(_ context.Context, _ string) (int64, error) {
		return 1, nil
	}

	tokens, err := StateTokenWithSearchList(context.Background(), "user_1")
	assert.Nil(t, err)
	assert.ElementsMatch(t, []string{"tok_a", "tok_b"}, tokens)
}

func TestStateTokenWithSearchList_Empty(t *testing.T) {
	origClean := redisHGetAllFn
	origExists := redisExistsFn
	t.Cleanup(func() {
		redisHGetAllFn = origClean
		redisExistsFn = origExists
	})

	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return map[string]string{}, nil
	}
	redisExistsFn = func(_ context.Context, _ string) (int64, error) {
		return 1, nil
	}

	tokens, err := StateTokenWithSearchList(context.Background(), "user_empty")
	assert.Nil(t, err)
	assert.Empty(t, tokens)
}

// ---------- stateTokenWithCleanExpires ----------

func TestCleanExpires_RemovesStaleTokens(t *testing.T) {
	origHGetAll := redisHGetAllFn
	origExists := redisExistsFn
	origHDel := redisHDelFn
	t.Cleanup(func() {
		redisHGetAllFn = origHGetAll
		redisExistsFn = origExists
		redisHDelFn = origHDel
	})

	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return map[string]string{"tok_valid": "0", "tok_stale": "0"}, nil
	}
	var existsCalls []string
	redisExistsFn = func(_ context.Context, key string) (int64, error) {
		existsCalls = append(existsCalls, key)
		if key == "token_tok_stale" {
			return 0, nil
		}
		return 1, nil
	}
	var hdelFields []string
	redisHDelFn = func(_ context.Context, key string, fields ...string) (int64, error) {
		hdelFields = append(hdelFields, fields...)
		return 1, nil
	}

	err := stateTokenWithCleanExpires(context.Background(), "user_1")
	assert.Nil(t, err)
	assert.Contains(t, hdelFields, "tok_stale")
	assert.NotContains(t, hdelFields, "tok_valid")
}

func TestCleanExpires_NoStaleTokens(t *testing.T) {
	origHGetAll := redisHGetAllFn
	origExists := redisExistsFn
	t.Cleanup(func() {
		redisHGetAllFn = origHGetAll
		redisExistsFn = origExists
	})

	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return map[string]string{"tok1": "0", "tok2": "0"}, nil
	}
	redisExistsFn = func(_ context.Context, _ string) (int64, error) {
		return 1, nil
	}

	err := stateTokenWithCleanExpires(context.Background(), "user_1")
	assert.Nil(t, err)
}

func TestCleanExpires_EmptyData(t *testing.T) {
	origHGetAll := redisHGetAllFn
	t.Cleanup(func() { redisHGetAllFn = origHGetAll })

	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return map[string]string{}, nil
	}

	err := stateTokenWithCleanExpires(context.Background(), "user_empty")
	assert.Nil(t, err)
}

// ---------- StateTokenWithRenew ----------

func TestRenew_NewTokenOnly(t *testing.T) {
	origExists := redisExistsFn
	origHLen := redisHLenFn
	origHGetAll := redisHGetAllFn
	origSet := redisSetFn
	origHSet := redisHSetFn
	t.Cleanup(func() {
		redisExistsFn = origExists
		redisHLenFn = origHLen
		redisHGetAllFn = origHGetAll
		redisSetFn = origSet
		redisHSetFn = origHSet
	})

	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return map[string]string{}, nil
	}
	redisHLenFn = func(_ context.Context, _ string) (int64, error) {
		return 0, nil
	}

	var setKey, setVal string
	redisSetFn = func(_ context.Context, key string, val interface{}, _ time.Duration) error {
		setKey = key
		setVal = val.(string)
		return nil
	}

	var hsetKey, hsetField string
	redisHSetFn = func(_ context.Context, key string, vals ...interface{}) (int64, error) {
		hsetKey = key
		hsetField = vals[0].(string)
		return 1, nil
	}

	err := StateTokenWithRenew(context.Background(), "", "new_tok", "user_1", "", time.Hour)
	assert.Nil(t, err)
	assert.Equal(t, "token_new_tok", setKey)
	assert.Equal(t, "user_1", setVal)
	assert.Equal(t, "token_account_user_1", hsetKey)
	assert.Equal(t, "new_tok", hsetField)
}

func TestRenew_WithOldToken(t *testing.T) {
	origExists := redisExistsFn
	origHLen := redisHLenFn
	origHGetAll := redisHGetAllFn
	origSet := redisSetFn
	origHSet := redisHSetFn
	origDel := redisDelFn
	origHDel := redisHDelFn
	t.Cleanup(func() {
		redisExistsFn = origExists
		redisHLenFn = origHLen
		redisHGetAllFn = origHGetAll
		redisSetFn = origSet
		redisHSetFn = origHSet
		redisDelFn = origDel
		redisHDelFn = origHDel
	})

	redisExistsFn = func(_ context.Context, key string) (int64, error) {
		if key == "token_old_tok" {
			return 1, nil
		}
		return 0, nil
	}
	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return map[string]string{}, nil
	}
	redisHLenFn = func(_ context.Context, _ string) (int64, error) {
		return 0, nil
	}
	redisSetFn = func(_ context.Context, _ string, _ interface{}, _ time.Duration) error {
		return nil
	}
	redisHSetFn = func(_ context.Context, _ string, _ ...interface{}) (int64, error) {
		return 1, nil
	}

	var delKeys []string
	redisDelFn = func(_ context.Context, keys ...string) (int64, error) {
		delKeys = append(delKeys, keys...)
		return 1, nil
	}

	var hdelKey string
	var hdelFields []string
	redisHDelFn = func(_ context.Context, key string, fields ...string) (int64, error) {
		hdelKey = key
		hdelFields = append(hdelFields, fields...)
		return 1, nil
	}

	err := StateTokenWithRenew(context.Background(), "old_tok", "new_tok", "user_1", "", time.Hour)
	assert.Nil(t, err)
	assert.Contains(t, delKeys, "token_old_tok")
	assert.Equal(t, "token_account_user_1", hdelKey)
	assert.Contains(t, hdelFields, "old_tok")
}

func TestRenew_OldTokenNotFound(t *testing.T) {
	origExists := redisExistsFn
	t.Cleanup(func() { redisExistsFn = origExists })

	redisExistsFn = func(_ context.Context, _ string) (int64, error) {
		return 0, nil
	}

	err := StateTokenWithRenew(context.Background(), "nonexistent", "new_tok", "user_1", "", time.Hour)
	assert.ErrorIs(t, err, ErrorNoAuth)
}

func TestRenew_ExceedsLimitEvictsOldest(t *testing.T) {
	origExists := redisExistsFn
	origHLen := redisHLenFn
	origHGetAll := redisHGetAllFn
	origTTL := redisTTLFn
	origGet := redisGetFn
	origSet := redisSetFn
	origHSet := redisHSetFn
	origDel := redisDelFn
	origHDel := redisHDelFn
	t.Cleanup(func() {
		redisExistsFn = origExists
		redisHLenFn = origHLen
		redisHGetAllFn = origHGetAll
		redisTTLFn = origTTL
		redisGetFn = origGet
		redisSetFn = origSet
		redisHSetFn = origHSet
		redisDelFn = origDel
		redisHDelFn = origHDel
	})

	redisExistsFn = func(_ context.Context, _ string) (int64, error) {
		return 1, nil
	}
	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return map[string]string{"t1": "0", "t2": "0", "t3": "0", "t4": "0", "t5": "0",
			"t6": "0", "t7": "0", "t8": "0", "t9": "0", "t10": "0"}, nil
	}
	redisHLenFn = func(_ context.Context, _ string) (int64, error) {
		return 10, nil
	}
	redisTTLFn = func(_ context.Context, _ string) (time.Duration, error) {
		return time.Minute, nil
	}
	redisSetFn = func(_ context.Context, _ string, _ interface{}, _ time.Duration) error {
		return nil
	}
	redisHSetFn = func(_ context.Context, _ string, _ ...interface{}) (int64, error) {
		return 1, nil
	}
	redisGetFn = func(_ context.Context, _ string) (string, error) {
		return "user_1", nil
	}
	redisDelFn = func(_ context.Context, _ ...string) (int64, error) {
		return 1, nil
	}
	redisHDelFn = func(_ context.Context, _ string, _ ...string) (int64, error) {
		return 1, nil
	}

	err := StateTokenWithRenew(context.Background(), "old_tok", "new_tok", "user_1", "", time.Hour)
	assert.Nil(t, err)
}

func TestRenew_LoginAtCapacityEvictsOldest(t *testing.T) {
	origExists := redisExistsFn
	origHLen := redisHLenFn
	origHGetAll := redisHGetAllFn
	origSet := redisSetFn
	origHSet := redisHSetFn
	origGet := redisGetFn
	origDel := redisDelFn
	origHDel := redisHDelFn
	origTTL := redisTTLFn
	t.Cleanup(func() {
		redisExistsFn = origExists
		redisHLenFn = origHLen
		redisHGetAllFn = origHGetAll
		redisSetFn = origSet
		redisHSetFn = origHSet
		redisGetFn = origGet
		redisDelFn = origDel
		redisHDelFn = origHDel
		redisTTLFn = origTTL
	})

	tokensAtLimit := map[string]string{
		"t_old": "0", "t2": "0", "t3": "0", "t4": "0", "t5": "0",
		"t6": "0", "t7": "0", "t8": "0", "t9": "0", "t10": "0",
	}

	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return tokensAtLimit, nil
	}
	redisExistsFn = func(_ context.Context, key string) (int64, error) {
		if key == "token_t_old" {
			return 1, nil
		}
		return 0, nil
	}
	redisHLenFn = func(_ context.Context, _ string) (int64, error) {
		return 10, nil
	}
	redisTTLFn = func(_ context.Context, key string) (time.Duration, error) {
		if key == "token_t_old" {
			return 10 * time.Second, nil // oldest (shortest TTL)
		}
		return 3600 * time.Second, nil
	}

	var revokeDelKeys []string
	redisGetFn = func(_ context.Context, key string) (string, error) {
		if key == "token_t_old" {
			return "user_1", nil
		}
		return "", nil
	}
	redisDelFn = func(_ context.Context, keys ...string) (int64, error) {
		revokeDelKeys = append(revokeDelKeys, keys...)
		return 1, nil
	}
	redisHDelFn = func(_ context.Context, key string, fields ...string) (int64, error) {
		return 1, nil
	}

	var setKey, setVal string
	redisSetFn = func(_ context.Context, key string, val interface{}, _ time.Duration) error {
		setKey = key
		setVal = val.(string)
		return nil
	}

	var hsetKey, hsetField string
	redisHSetFn = func(_ context.Context, key string, vals ...interface{}) (int64, error) {
		hsetKey = key
		hsetField = vals[0].(string)
		return 1, nil
	}

	err := StateTokenWithRenew(context.Background(), "", "new_tok", "user_1", "", time.Hour)
	assert.Nil(t, err)
	assert.Contains(t, revokeDelKeys, "token_t_old")
	assert.Equal(t, "token_new_tok", setKey)
	assert.Equal(t, "user_1", setVal)
	assert.Equal(t, "token_account_user_1", hsetKey)
	assert.Equal(t, "new_tok", hsetField)
}

func TestRenew_EmptyNewToken(t *testing.T) {
	err := StateTokenWithRenew(context.Background(), "", "", "user_1", "", time.Hour)
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "nil")
}

func TestRenew_EmptyID(t *testing.T) {
	err := StateTokenWithRenew(context.Background(), "", "new_tok", "", "", time.Hour)
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "nil")
}

// ---------- StateTokenWithRevoke ----------

func TestRevoke_HappyPath(t *testing.T) {
	origGet := redisGetFn
	origDel := redisDelFn
	origHDel := redisHDelFn
	t.Cleanup(func() {
		redisGetFn = origGet
		redisDelFn = origDel
		redisHDelFn = origHDel
	})

	redisGetFn = func(_ context.Context, key string) (string, error) {
		if key == "token_tok_revoke" {
			return "user_1", nil
		}
		return "", errors.New("not found")
	}

	var delKeys []string
	redisDelFn = func(_ context.Context, keys ...string) (int64, error) {
		delKeys = append(delKeys, keys...)
		return 1, nil
	}

	var hdelKey string
	var hdelFields []string
	redisHDelFn = func(_ context.Context, key string, fields ...string) (int64, error) {
		hdelKey = key
		hdelFields = append(hdelFields, fields...)
		return 1, nil
	}

	err := StateTokenWithRevoke(context.Background(), "tok_revoke")
	assert.Nil(t, err)
	assert.Contains(t, delKeys, "token_tok_revoke")
	assert.Equal(t, "token_account_user_1", hdelKey)
	assert.Contains(t, hdelFields, "tok_revoke")
}

func TestRevoke_EmptyToken(t *testing.T) {
	err := StateTokenWithRevoke(context.Background(), "")
	assert.Nil(t, err)
}

func TestRevoke_NotFound(t *testing.T) {
	origGet := redisGetFn
	t.Cleanup(func() { redisGetFn = origGet })

	redisGetFn = func(_ context.Context, _ string) (string, error) {
		return "", errors.New("key not found")
	}

	err := StateTokenWithRevoke(context.Background(), "missing")
	assert.NotNil(t, err)
}

// ---------- StateTokenWithRevokeAll ----------

func TestRevokeAll_HappyPath(t *testing.T) {
	origHGetAll := redisHGetAllFn
	origExists := redisExistsFn
	origDel := redisDelFn
	t.Cleanup(func() {
		redisHGetAllFn = origHGetAll
		redisExistsFn = origExists
		redisDelFn = origDel
	})

	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return map[string]string{"tok1": "0", "tok2": "0"}, nil
	}
	redisExistsFn = func(_ context.Context, _ string) (int64, error) {
		return 1, nil
	}

	var delCalls [][]string
	redisDelFn = func(_ context.Context, keys ...string) (int64, error) {
		delCalls = append(delCalls, keys)
		return int64(len(keys)), nil
	}

	err := StateTokenWithRevokeAll(context.Background(), "user_1")
	assert.Nil(t, err)
	assert.Len(t, delCalls, 2)
	assert.ElementsMatch(t, []string{"token_tok1", "token_tok2"}, delCalls[0])
	assert.ElementsMatch(t, []string{"token_account_user_1"}, delCalls[1])
}

func TestDefaultRedisFuncs_ShouldPanicWithNilClient(t *testing.T) {
	origHGetAll := redisHGetAllFn
	origExists := redisExistsFn
	origHDel := redisHDelFn
	origHLen := redisHLenFn
	origSet := redisSetFn
	origHSet := redisHSetFn
	origDel := redisDelFn
	origGet := redisGetFn
	origTTL := redisTTLFn
	t.Cleanup(func() {
		redisHGetAllFn = origHGetAll
		redisExistsFn = origExists
		redisHDelFn = origHDel
		redisHLenFn = origHLen
		redisSetFn = origSet
		redisHSetFn = origHSet
		redisDelFn = origDel
		redisGetFn = origGet
		redisTTLFn = origTTL
	})

	redisHGetAllFn = origHGetAll
	redisExistsFn = origExists
	redisHDelFn = origHDel
	redisHLenFn = origHLen
	redisSetFn = origSet
	redisHSetFn = origHSet
	redisDelFn = origDel
	redisGetFn = origGet
	redisTTLFn = origTTL

	assert.Panics(t, func() {
		redisHGetAllFn(nil, "")
	})
	assert.Panics(t, func() {
		redisExistsFn(nil, "")
	})
	assert.Panics(t, func() {
		redisHDelFn(nil, "")
	})
	assert.Panics(t, func() {
		redisHLenFn(nil, "")
	})
	assert.Panics(t, func() {
		redisSetFn(nil, "", nil, 0)
	})
	assert.Panics(t, func() {
		redisHSetFn(nil, "")
	})
	assert.Panics(t, func() {
		redisDelFn(nil)
	})
	assert.Panics(t, func() {
		redisGetFn(nil, "")
	})
	assert.Panics(t, func() {
		redisTTLFn(nil, "")
	})
}

func TestRevokeAll_EmptyTokens(t *testing.T) {
	origHGetAll := redisHGetAllFn
	origExists := redisExistsFn
	origDel := redisDelFn
	t.Cleanup(func() {
		redisHGetAllFn = origHGetAll
		redisExistsFn = origExists
		redisDelFn = origDel
	})

	redisHGetAllFn = func(_ context.Context, _ string) (map[string]string, error) {
		return map[string]string{}, nil
	}
	redisExistsFn = func(_ context.Context, _ string) (int64, error) {
		return 1, nil
	}

	var delCalls [][]string
	redisDelFn = func(_ context.Context, keys ...string) (int64, error) {
		delCalls = append(delCalls, keys)
		return int64(len(keys)), nil
	}

	err := StateTokenWithRevokeAll(context.Background(), "user_empty")
	assert.Nil(t, err)
	assert.Len(t, delCalls, 2)
	assert.Empty(t, delCalls[0])
	assert.ElementsMatch(t, []string{"token_account_user_empty"}, delCalls[1])
}
