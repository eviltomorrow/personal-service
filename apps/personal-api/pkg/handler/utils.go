package handler

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func Respond(c echo.Context, httpStatus int, code int, message string, data interface{}) error {
	resp := map[string]interface{}{
		"code":    code,
		"message": message,
	}
	if data != nil {
		resp["data"] = data
	}
	return c.JSON(httpStatus, resp)
}

func GrpcStatusToHTTP(err error) (int, string) {
	st, ok := status.FromError(err)
	if !ok {
		return http.StatusInternalServerError, "internal server error"
	}
	switch st.Code() {
	case codes.InvalidArgument:
		return http.StatusBadRequest, st.Message()
	case codes.Unauthenticated:
		return http.StatusUnauthorized, st.Message()
	case codes.PermissionDenied:
		return http.StatusForbidden, st.Message()
	case codes.NotFound:
		return http.StatusNotFound, st.Message()
	case codes.AlreadyExists:
		return http.StatusConflict, st.Message()
	case codes.ResourceExhausted:
		return http.StatusTooManyRequests, st.Message()
	case codes.FailedPrecondition:
		return http.StatusBadRequest, st.Message()
	case codes.Unimplemented:
		return http.StatusNotImplemented, st.Message()
	case codes.Unavailable:
		return http.StatusServiceUnavailable, st.Message()
	case codes.DeadlineExceeded:
		return http.StatusGatewayTimeout, st.Message()
	default:
		return http.StatusInternalServerError, "internal server error"
	}
}

func setTokenCookies(c echo.Context, accessToken, refreshToken string, expiresIn int64) {
	secure := c.Request().TLS != nil
	c.SetCookie(&http.Cookie{
		Name:     "access_token",
		Value:    accessToken,
		Path:     "/api",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(expiresIn),
	})
	refreshMaxAge := expiresIn * 6
	if refreshMaxAge > 7*24*3600 {
		refreshMaxAge = 7 * 24 * 3600
	}
	c.SetCookie(&http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/api",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   int(refreshMaxAge),
	})
}

func clearTokenCookies(c echo.Context) {
	secure := c.Request().TLS != nil
	c.SetCookie(&http.Cookie{
		Name: "access_token", Path: "/api", HttpOnly: true, Secure: secure,
		SameSite: http.SameSiteLaxMode, MaxAge: -1,
	})
	c.SetCookie(&http.Cookie{
		Name: "refresh_token", Path: "/api", HttpOnly: true, Secure: secure,
		SameSite: http.SameSiteLaxMode, MaxAge: -1,
	})
}
