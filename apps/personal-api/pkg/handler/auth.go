package handler

import (
	"net/http"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type AuthHandler struct {
	client model.AuthClient
}

func init() {
	Register(func(r *Router, deps *Dependencies) {
		h := &AuthHandler{client: deps.AuthClient}
		r.POST("/auth/register", h.Register)
		r.POST("/auth/login", h.Login)
		r.POST("/auth/token/refresh", h.RefreshToken)
		r.POST("/auth/token/validate", h.ValidateToken)
		r.POST("/auth/token/revoke", h.RevokeToken)
		r.POST("/auth/token/revoke-all", h.RevokeAllTokens)
		r.POST("/auth/account/delete", h.DeleteAccount)
		r.POST("/auth/password/update", h.UpdatePassword)
		r.POST("/auth/identifier/update", h.UpdateIdentifier)
	})
}

func (h *AuthHandler) Register(c echo.Context) error {
	var req model.RegisterRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}

	resp, err := h.client.Register(c.Request().Context(), &req)
	if err != nil {
		zlog.Error("auth register failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}

	setTokenCookies(c, resp.AccessToken, resp.RefreshToken, resp.ExpiresIn)
	return Respond(c, http.StatusOK, 0, "success", map[string]interface{}{
		"expires_in": resp.ExpiresIn,
	})
}

func (h *AuthHandler) Login(c echo.Context) error {
	var req model.LoginRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.IPAddress = c.RealIP()
	req.UserAgent = c.Request().UserAgent()

	resp, err := h.client.Login(c.Request().Context(), &req)
	if err != nil {
		zlog.Error("auth login failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}

	setTokenCookies(c, resp.AccessToken, resp.RefreshToken, resp.ExpiresIn)
	return Respond(c, http.StatusOK, 0, "success", map[string]interface{}{
		"expires_in": resp.ExpiresIn,
	})
}

func (h *AuthHandler) RefreshToken(c echo.Context) error {
	var req model.RefreshTokenRequest

	if cookie, err := c.Cookie("refresh_token"); err == nil && cookie.Value != "" {
		req.RefreshToken = cookie.Value
	} else {
		if err := c.Bind(&req); err != nil {
			return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
		}
	}

	resp, err := h.client.RefreshToken(c.Request().Context(), &req)
	if err != nil {
		zlog.Error("auth refresh token failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}

	setTokenCookies(c, resp.AccessToken, resp.RefreshToken, resp.ExpiresIn)
	return Respond(c, http.StatusOK, 0, "success", map[string]interface{}{
		"expires_in": resp.ExpiresIn,
	})
}

func (h *AuthHandler) ValidateToken(c echo.Context) error {
	var req model.ValidateTokenRequest

	if cookie, err := c.Cookie("access_token"); err == nil && cookie.Value != "" {
		req.AccessToken = cookie.Value
	} else {
		if err := c.Bind(&req); err != nil {
			return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
		}
	}

	resp, err := h.client.ValidateToken(c.Request().Context(), &req)
	if err != nil {
		zlog.Error("auth validate token failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}

	return Respond(c, http.StatusOK, 0, "success", map[string]interface{}{
		"role": resp.Role, "expires_at": resp.ExpiresAt,
	})
}

func (h *AuthHandler) RevokeToken(c echo.Context) error {
	var req model.RevokeTokenRequest

	if cookie, err := c.Cookie("refresh_token"); err == nil && cookie.Value != "" {
		req.RefreshToken = cookie.Value
	} else {
		if err := c.Bind(&req); err != nil {
			return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
		}
	}

	if err := h.client.RevokeToken(c.Request().Context(), &req); err != nil {
		zlog.Error("auth revoke token failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}

	clearTokenCookies(c)
	return Respond(c, http.StatusOK, 0, "success", nil)
}

func (h *AuthHandler) RevokeAllTokens(c echo.Context) error {
	accessToken := ""
	if cookie, err := c.Cookie("access_token"); err == nil {
		accessToken = cookie.Value
	} else if t, ok := c.Get("token").(string); ok {
		accessToken = t
	}
	if accessToken == "" {
		return Respond(c, http.StatusUnauthorized, 401, "unauthorized", nil)
	}

	req := model.RevokeAllTokensRequest{AccessToken: accessToken}

	if err := h.client.RevokeAllTokens(c.Request().Context(), &req); err != nil {
		zlog.Error("auth revoke all tokens failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}

	clearTokenCookies(c)
	return Respond(c, http.StatusOK, 0, "success", nil)
}

func (h *AuthHandler) DeleteAccount(c echo.Context) error {
	var req model.DeleteAccountRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.AccountID = c.Get("account_id").(string)

	err := h.client.DeleteAccount(c.Request().Context(), &req)
	if err != nil {
		zlog.Error("auth delete account failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}

	return Respond(c, http.StatusOK, 0, "success", nil)
}

func (h *AuthHandler) UpdatePassword(c echo.Context) error {
	var req model.UpdatePasswordRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.AccountID = c.Get("account_id").(string)

	if err := h.client.UpdatePassword(c.Request().Context(), &req); err != nil {
		zlog.Error("auth update password failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}

	return Respond(c, http.StatusOK, 0, "success", nil)
}

func (h *AuthHandler) UpdateIdentifier(c echo.Context) error {
	var req model.UpdateIdentifierRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.AccountID = c.Get("account_id").(string)

	if err := h.client.UpdateIdentifier(c.Request().Context(), &req); err != nil {
		zlog.Error("auth update identifier failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}

	return Respond(c, http.StatusOK, 0, "success", nil)
}
