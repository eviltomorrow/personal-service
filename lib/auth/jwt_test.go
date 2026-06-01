package auth

import (
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestJwtWithCreateToken(t *testing.T) {
	token, err := JwtWithCreateToken("shepard", "admin", 3*time.Second)
	assert.Nil(t, err)
	assert.NotEmpty(t, token)
	t.Logf("token: %s", token)
}

func TestJwtWithParseToken_Valid(t *testing.T) {
	token, err := JwtWithCreateToken("acc_001", "user", time.Hour)
	assert.Nil(t, err)

	claims, err := JwtWithParseToken(token, nil)
	assert.Nil(t, err)
	assert.Equal(t, "acc_001", claims.AccountId)
	assert.Equal(t, "user", claims.Role)
}

func TestJwtWithParseToken_WithValidatorSuccess(t *testing.T) {
	token, err := JwtWithCreateToken("acc_002", "admin", time.Hour)
	assert.Nil(t, err)

	var calledAccountID string
	claims, err := JwtWithParseToken(token, func(accountID string) error {
		calledAccountID = accountID
		return nil
	})
	assert.Nil(t, err)
	assert.Equal(t, "acc_002", claims.AccountId)
	assert.Equal(t, "acc_002", calledAccountID)
}

func TestJwtWithParseToken_WithValidatorFailure(t *testing.T) {
	token, err := JwtWithCreateToken("acc_003", "user", time.Hour)
	assert.Nil(t, err)

	_, err = JwtWithParseToken(token, func(_ string) error {
		return errors.New("validation failed")
	})
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "validation failed")
}

func TestJwtWithParseToken_Expired(t *testing.T) {
	token, err := JwtWithCreateToken("acc_004", "user", -1*time.Second)
	assert.Nil(t, err)

	_, err = JwtWithParseToken(token, nil)
	assert.ErrorIs(t, err, ErrTokenExpired)
}

func TestJwtWithParseToken_NotYetValid(t *testing.T) {
	SigningKey = []byte("test-key")
	defer func() { SigningKey = []byte("123") }()

	token, err := JwtWithCreateToken("acc_005", "user", time.Hour)
	assert.Nil(t, err)

	SigningKey = []byte("wrong-key")
	_, err = JwtWithParseToken(token, nil)
	assert.ErrorIs(t, err, ErrTokenIllegal)
}

func TestJwtWithParseToken_InvalidToken(t *testing.T) {
	_, err := JwtWithParseToken("this.is.not.a.valid.jwt", nil)
	assert.ErrorIs(t, err, ErrTokenIllegal)
}

func TestJwtWithParseToken_EmptyToken(t *testing.T) {
	_, err := JwtWithParseToken("", nil)
	assert.NotNil(t, err)
}

func TestJwtWithParseToken_GarbageToken(t *testing.T) {
	_, err := JwtWithParseToken("some.random.garbage.string", nil)
	assert.ErrorIs(t, err, ErrTokenIllegal)
}
