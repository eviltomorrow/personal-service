package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/eviltomorrow/personal-service/lib/auth"
	"github.com/labstack/echo/v4"
)

type TokenRefresher interface {
	Refresh(ctx context.Context, refreshToken string) (accessToken, newRefreshToken string, expiresIn int64, err error)
}

const (
	ContextKeyAccountID    = "account_id"
	ContextKeyRole         = "role"
	ContextKeyToken        = "token"
	tokenExpiryThreshold   = 5 * time.Minute
	accessTokenCookieName  = "access_token"
	refreshTokenCookieName = "refresh_token"
)

func ServerJWTInterceptor(skipper func(c echo.Context) bool, refresher TokenRefresher) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if skipper != nil && skipper(c) {
				return next(c)
			}

			tokenStr := resolveToken(c)
			if tokenStr == "" {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"code":    http.StatusUnauthorized,
					"message": "missing authorization",
				})
			}

			claims, err := auth.JwtWithParseToken(tokenStr, nil)
			if err != nil && !errors.Is(err, auth.ErrTokenExpired) {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"code":    http.StatusUnauthorized,
					"message": "invalid token",
				})
			}

			if err == nil {
				if claims != nil && refresher != nil && isTokenNearExpiry(claims) {
					return tryRefresh(c, refresher, next)
				}
				setContext(c, claims, tokenStr)
				return next(c)
			}

			if refresher == nil {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"code":    http.StatusUnauthorized,
					"message": "token expired",
				})
			}

			refreshToken := resolveRefreshToken(c)
			if refreshToken == "" {
				return c.JSON(http.StatusUnauthorized, map[string]interface{}{
					"code":    http.StatusUnauthorized,
					"message": "token expired",
				})
			}

			return doRefresh(c, refresher, refreshToken, next)
		}
	}
}

func doRefresh(c echo.Context, refresher TokenRefresher, refreshToken string, next echo.HandlerFunc) error {
	newAccess, newRefresh, expiresIn, refreshErr := refresher.Refresh(c.Request().Context(), refreshToken)
	if refreshErr != nil {
		clearTokenCookies(c)
		return c.JSON(http.StatusUnauthorized, map[string]interface{}{
			"code":    http.StatusUnauthorized,
			"message": "token expired",
		})
	}

	setTokenCookies(c, newAccess, newRefresh, expiresIn)

	newClaims, parseErr := auth.JwtWithParseToken(newAccess, nil)
	if parseErr != nil {
		return c.JSON(http.StatusUnauthorized, map[string]interface{}{
			"code":    http.StatusUnauthorized,
			"message": "invalid token",
		})
	}

	setContext(c, newClaims, newAccess)
	return next(c)
}

func tryRefresh(c echo.Context, refresher TokenRefresher, next echo.HandlerFunc) error {
	refreshToken := resolveRefreshToken(c)
	if refreshToken == "" {
		return next(c)
	}
	return doRefresh(c, refresher, refreshToken, next)
}

func resolveToken(c echo.Context) string {
	if cookie, err := c.Cookie(accessTokenCookieName); err == nil && cookie.Value != "" {
		return cookie.Value
	}
	header := c.Request().Header.Get(echo.HeaderAuthorization)
	if token, ok := strings.CutPrefix(header, "Bearer "); ok {
		return token
	}
	return ""
}

func resolveRefreshToken(c echo.Context) string {
	if cookie, err := c.Cookie(refreshTokenCookieName); err == nil && cookie.Value != "" {
		return cookie.Value
	}
	return ""
}

func isTokenNearExpiry(claims *auth.JwtClaims) bool {
	if claims == nil {
		return false
	}
	return time.Until(claims.ExpiresAt.Time) < tokenExpiryThreshold
}

func setContext(c echo.Context, claims *auth.JwtClaims, tokenStr string) {
	c.Set(ContextKeyAccountID, claims.AccountId)
	c.Set(ContextKeyRole, claims.Role)
	c.Set(ContextKeyToken, tokenStr)
}

func setTokenCookies(c echo.Context, accessToken, refreshToken string, expiresIn int64) {
	secure := c.Request().TLS != nil
	httpOnly := true
	sameSite := http.SameSiteStrictMode

	c.SetCookie(&http.Cookie{
		Name:     accessTokenCookieName,
		Value:    accessToken,
		Path:     "/",
		HttpOnly: httpOnly,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   int(expiresIn),
	})

	c.SetCookie(&http.Cookie{
		Name:     refreshTokenCookieName,
		Value:    refreshToken,
		Path:     "/",
		HttpOnly: httpOnly,
		Secure:   secure,
		SameSite: sameSite,
		MaxAge:   int(expiresIn),
	})
}

func clearTokenCookies(c echo.Context) {
	c.SetCookie(&http.Cookie{
		Name:     accessTokenCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
	c.SetCookie(&http.Cookie{
		Name:     refreshTokenCookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
}
