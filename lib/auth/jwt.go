package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	SigningKey      = []byte("123")
	ErrTokenExpired = errors.New("token is expired")
	ErrTokenIllegal = errors.New("token is illegal")
)

type JwtClaims struct {
	AccountId string `json:"account_id"`
	Role      string `json:"role"`
	jwt.RegisteredClaims
}

func JwtWithCreateToken(accountId string, role string, expireIn time.Duration) (string, error) {
	claims := JwtClaims{
		AccountId: accountId,
		Role:      role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expireIn)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(SigningKey)
	if err != nil {
		return "", err
	}
	return signed, nil
}

func JwtWithParseToken(tokenStr string, f func(string) error) (*JwtClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &JwtClaims{}, func(token *jwt.Token) (interface{}, error) {
		return SigningKey, nil
	})

	if token == nil {
		switch {
		case errors.Is(err, jwt.ErrTokenExpired):
			return nil, ErrTokenExpired
		case errors.Is(err, jwt.ErrTokenNotValidYet):
			return nil, ErrTokenIllegal
		default:
			return nil, ErrTokenIllegal
		}
	}

	switch {
	case token.Valid:
		claims, ok := token.Claims.(*JwtClaims)
		if !ok {
			return nil, fmt.Errorf("panic: invalid claims")
		}
		if f != nil {
			if err := f(claims.AccountId); err != nil {
				return nil, err
			}
		}
		return claims, nil

	case errors.Is(err, jwt.ErrTokenExpired):
		return nil, ErrTokenExpired
	case errors.Is(err, jwt.ErrTokenNotValidYet):
		return nil, ErrTokenIllegal

	default:
		return nil, ErrTokenIllegal

	}
}
