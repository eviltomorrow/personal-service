package middleware

import (
	"net/http"
	"strings"

	"github.com/eviltomorrow/personal-service/lib/auth"
	"github.com/labstack/echo/v4"
)

const (
	ContextKeyAccountID = "account_id"
	ContextKeyRole      = "role"
	ContextKeyToken     = "token"
)

func ServerJWTInterceptor(skipper func(c echo.Context) bool) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if skipper != nil && skipper(c) {
				return next(c)
			}

			header := c.Request().Header.Get(echo.HeaderAuthorization)
			if header == "" {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"code":    http.StatusUnauthorized,
					"message": "missing authorization header",
				})
			}

			tokenStr, ok := strings.CutPrefix(header, "Bearer ")
			if !ok {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"code":    http.StatusUnauthorized,
					"message": "invalid authorization format, expected: Bearer <token>",
				})
			}

			claims, err := auth.JwtWithParseToken(tokenStr, nil)
			if err != nil {
				code := http.StatusUnauthorized
				msg := err.Error()
				if err == auth.ErrTokenExpired {
					msg = "token is expired"
				}
				return c.JSON(code, map[string]interface{}{
					"code":    code,
					"message": msg,
				})
			}

			c.Set(ContextKeyAccountID, claims.AccountId)
			c.Set(ContextKeyRole, claims.Role)
			c.Set(ContextKeyToken, tokenStr)

			return next(c)
		}
	}
}
