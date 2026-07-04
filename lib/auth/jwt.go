package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var (
	SigningKey      []byte
	ErrTokenExpired = errors.New("token is expired")
	ErrTokenIllegal = errors.New("token is illegal")
)

type JwtClaims struct {
	AccountId string `json:"account_id"`
	Role      string `json:"role"`
	jwt.RegisteredClaims
}

func JwtWithCreateToken(accountId string, role string, expireIn time.Duration) (string, error) {
	if len(SigningKey) == 0 {
		panic("auth.SigningKey not initialized")
	}

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
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return SigningKey, nil
	})
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		if errors.Is(err, jwt.ErrTokenNotValidYet) {
			return nil, ErrTokenIllegal
		}
		return nil, ErrTokenIllegal
	}

	claims, ok := token.Claims.(*JwtClaims)
	if !ok || !token.Valid {
		return nil, ErrTokenIllegal
	}

	if f != nil {
		if err := f(claims.AccountId); err != nil {
			return nil, err
		}
	}
	return claims, nil
}
