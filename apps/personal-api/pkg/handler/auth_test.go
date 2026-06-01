package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type mockAuthClient struct {
	registerFunc         func(context.Context, *model.RegisterRequest) (*model.RegisterResponse, error)
	loginFunc            func(context.Context, *model.LoginRequest) (*model.LoginResponse, error)
	refreshTokenFunc     func(context.Context, *model.RefreshTokenRequest) (*model.RefreshTokenResponse, error)
	revokeTokenFunc      func(context.Context, *model.RevokeTokenRequest) error
	revokeAllTokensFunc  func(context.Context, *model.RevokeAllTokensRequest) error
	deleteAccountFunc    func(context.Context, *model.DeleteAccountRequest) (*model.DeleteAccountResponse, error)
	updatePasswordFunc   func(context.Context, *model.UpdatePasswordRequest) error
	updateIdentifierFunc func(context.Context, *model.UpdateIdentifierRequest) error
	validateTokenFunc    func(context.Context, *model.ValidateTokenRequest) (*model.ValidateTokenResponse, error)
}

func (m *mockAuthClient) Register(ctx context.Context, req *model.RegisterRequest) (*model.RegisterResponse, error) {
	if m.registerFunc != nil {
		return m.registerFunc(ctx, req)
	}
	return nil, status.Error(codes.Unimplemented, "mock not implemented")
}

func (m *mockAuthClient) Login(ctx context.Context, req *model.LoginRequest) (*model.LoginResponse, error) {
	if m.loginFunc != nil {
		return m.loginFunc(ctx, req)
	}
	return nil, status.Error(codes.Unimplemented, "mock not implemented")
}

func (m *mockAuthClient) RefreshToken(ctx context.Context, req *model.RefreshTokenRequest) (*model.RefreshTokenResponse, error) {
	if m.refreshTokenFunc != nil {
		return m.refreshTokenFunc(ctx, req)
	}
	return nil, status.Error(codes.Unimplemented, "mock not implemented")
}

func (m *mockAuthClient) RevokeToken(ctx context.Context, req *model.RevokeTokenRequest) error {
	if m.revokeTokenFunc != nil {
		return m.revokeTokenFunc(ctx, req)
	}
	return status.Error(codes.Unimplemented, "mock not implemented")
}

func (m *mockAuthClient) RevokeAllTokens(ctx context.Context, req *model.RevokeAllTokensRequest) error {
	if m.revokeAllTokensFunc != nil {
		return m.revokeAllTokensFunc(ctx, req)
	}
	return status.Error(codes.Unimplemented, "mock not implemented")
}

func (m *mockAuthClient) DeleteAccount(ctx context.Context, req *model.DeleteAccountRequest) (*model.DeleteAccountResponse, error) {
	if m.deleteAccountFunc != nil {
		return m.deleteAccountFunc(ctx, req)
	}
	return nil, status.Error(codes.Unimplemented, "mock not implemented")
}

func (m *mockAuthClient) UpdatePassword(ctx context.Context, req *model.UpdatePasswordRequest) error {
	if m.updatePasswordFunc != nil {
		return m.updatePasswordFunc(ctx, req)
	}
	return status.Error(codes.Unimplemented, "mock not implemented")
}

func (m *mockAuthClient) UpdateIdentifier(ctx context.Context, req *model.UpdateIdentifierRequest) error {
	if m.updateIdentifierFunc != nil {
		return m.updateIdentifierFunc(ctx, req)
	}
	return status.Error(codes.Unimplemented, "mock not implemented")
}

func (m *mockAuthClient) ValidateToken(ctx context.Context, req *model.ValidateTokenRequest) (*model.ValidateTokenResponse, error) {
	if m.validateTokenFunc != nil {
		return m.validateTokenFunc(ctx, req)
	}
	return nil, status.Error(codes.Unimplemented, "mock not implemented")
}

func TestMain(m *testing.M) {
	zlog.ReplaceGlobals(zap.NewNop(), &zlog.ZapProperties{
		Level: zap.NewAtomicLevel(),
	})
	os.Exit(m.Run())
}

func setupEcho() *echo.Echo {
	return echo.New()
}

func newJSONRequest(method, path, body string) (*http.Request, *httptest.ResponseRecorder) {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	return req, httptest.NewRecorder()
}

func TestRegister_Success(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		registerFunc: func(ctx context.Context, req *model.RegisterRequest) (*model.RegisterResponse, error) {
			assert.Equal(t, model.AuthTypeEmail, req.AuthType)
			assert.Equal(t, "test@test.com", req.Identifier)
			assert.Equal(t, "secret123", req.Password)
			return &model.RegisterResponse{
				AccessToken:  "eyJhbGciOiJIUzI1NiJ9.eyJhY2NvdW50X2lkIjoiMTIzNDU2Nzg5MDEyMzQ1Njc4OSJ9.fakesig",
				RefreshToken: "refresh_token_xyz",
				ExpiresIn:    3600,
			}, nil
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/register",
		`{"auth_type":"email","identifier":"test@test.com","password":"secret123"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.Register(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "success")
}

func TestRegister_InvalidBody(t *testing.T) {
	e := setupEcho()
	handler := AuthHandler{client: &mockAuthClient{}}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/register", `{invalid json}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.Register(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
	assert.Contains(t, rec.Body.String(), "invalid request body")
}

func TestRegister_EmptyBody(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		registerFunc: func(ctx context.Context, req *model.RegisterRequest) (*model.RegisterResponse, error) {
			return nil, status.Error(codes.InvalidArgument, "password is required")
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/register", `{}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.Register(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
	assert.Contains(t, rec.Body.String(), "password is required")
}

func TestRegister_GRPCError(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		registerFunc: func(ctx context.Context, req *model.RegisterRequest) (*model.RegisterResponse, error) {
			return nil, status.Error(codes.Internal, "db error")
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/register",
		`{"auth_type":"email","identifier":"test@test.com","password":"secret123"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.Register(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
	assert.Contains(t, rec.Body.String(), "internal server error")
}

func TestRefreshToken_InternalError(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		refreshTokenFunc: func(ctx context.Context, req *model.RefreshTokenRequest) (*model.RefreshTokenResponse, error) {
			return nil, status.Error(codes.Internal, "db error")
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/token/refresh",
		`{"refresh_token":"token"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.RefreshToken(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
	assert.Contains(t, rec.Body.String(), "internal server error")
}

func TestRevokeToken_Success(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		revokeTokenFunc: func(ctx context.Context, req *model.RevokeTokenRequest) error {
			assert.Equal(t, "refresh_token_xyz", req.RefreshToken)
			return nil
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/token/revoke",
		`{"refresh_token":"refresh_token_xyz"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.RevokeToken(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "success")
}

func TestRevokeToken_InvalidBody(t *testing.T) {
	e := setupEcho()
	handler := AuthHandler{client: &mockAuthClient{}}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/token/revoke", `!`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.RevokeToken(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestRevokeToken_InternalError(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		revokeTokenFunc: func(ctx context.Context, req *model.RevokeTokenRequest) error {
			return status.Error(codes.Internal, "revoke failed")
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/token/revoke",
		`{"refresh_token":"invalid"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.RevokeToken(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
	assert.Contains(t, rec.Body.String(), "internal server error")
}

func TestRevokeAllTokens_Success(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		revokeAllTokensFunc: func(ctx context.Context, req *model.RevokeAllTokensRequest) error {
			assert.Equal(t, "access_token_abc", req.AccessToken)
			return nil
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/token/revoke-all",
		`{"access_token":"access_token_abc"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.RevokeAllTokens(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "success")
}

func TestRevokeAllTokens_InvalidBody(t *testing.T) {
	e := setupEcho()
	handler := AuthHandler{client: &mockAuthClient{}}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/token/revoke-all", `!`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.RevokeAllTokens(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestRevokeAllTokens_InternalError(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		revokeAllTokensFunc: func(ctx context.Context, req *model.RevokeAllTokensRequest) error {
			return status.Error(codes.Internal, "revoke all failed")
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/token/revoke-all",
		`{"access_token":"invalid"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.RevokeAllTokens(c))
	assert.Equal(t, http.StatusInternalServerError, rec.Code)
	assert.Contains(t, rec.Body.String(), "internal server error")
}

func TestRevokeToken_ResourceExhausted(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		revokeTokenFunc: func(ctx context.Context, req *model.RevokeTokenRequest) error {
			return status.Error(codes.ResourceExhausted, "rate limited")
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/token/revoke",
		`{"access_token":"token"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.RevokeToken(c))
	assert.Equal(t, http.StatusTooManyRequests, rec.Code)
	assert.Contains(t, rec.Body.String(), "rate limited")
}

func TestDeleteAccount_Success(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		deleteAccountFunc: func(ctx context.Context, req *model.DeleteAccountRequest) (*model.DeleteAccountResponse, error) {
			assert.Equal(t, "acc_123", req.AccountID)
			assert.Equal(t, "pwd123", req.Password)
			return &model.DeleteAccountResponse{}, nil
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/account/delete",
		`{"account_id":"acc_123","password":"pwd123"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.DeleteAccount(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "success")
}

func TestDeleteAccount_InvalidBody(t *testing.T) {
	e := setupEcho()
	handler := AuthHandler{client: &mockAuthClient{}}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/account/delete", `bad`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.DeleteAccount(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestDeleteAccount_InvalidPassword(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		deleteAccountFunc: func(ctx context.Context, req *model.DeleteAccountRequest) (*model.DeleteAccountResponse, error) {
			return nil, status.Error(codes.Unauthenticated, "invalid password")
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/account/delete",
		`{"account_id":"acc_1","password":"wrong"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.DeleteAccount(c))
	assert.Equal(t, http.StatusUnauthorized, rec.Code)
	assert.Contains(t, rec.Body.String(), "invalid password")
}

func TestRespond_WithData(t *testing.T) {
	e := setupEcho()
	req, rec := newJSONRequest(http.MethodPost, "/", "")
	c := e.NewContext(req, rec)

	err := Respond(c, http.StatusOK, 0, "success", map[string]interface{}{"key": "value"})
	assert.NoError(t, err)
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "key")
	assert.Contains(t, rec.Body.String(), "value")
	assert.Contains(t, rec.Body.String(), "success")
	assert.Contains(t, rec.Body.String(), "data")
	assert.Equal(t, "application/json", rec.Header().Get(echo.HeaderContentType))
}

func TestRespond_WithoutData(t *testing.T) {
	e := setupEcho()
	req, rec := newJSONRequest(http.MethodPost, "/", "")
	c := e.NewContext(req, rec)

	err := Respond(c, http.StatusBadRequest, 400, "bad request", nil)
	assert.NoError(t, err)
	assert.Equal(t, http.StatusBadRequest, rec.Code)
	assert.Contains(t, rec.Body.String(), "bad request")
	assert.NotContains(t, rec.Body.String(), "\"data\"")
}

func TestUpdateIdentifier_Success(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		updateIdentifierFunc: func(ctx context.Context, req *model.UpdateIdentifierRequest) error {
			assert.Equal(t, "acc_123", req.AccountID)
			assert.Equal(t, model.AuthTypeEmail, req.AuthType)
			assert.Equal(t, "new@test.com", req.NewIdentifier)
			return nil
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/identifier/update",
		`{"account_id":"acc_123","auth_type":"email","new_identifier":"new@test.com"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.UpdateIdentifier(c))
	assert.Equal(t, http.StatusOK, rec.Code)
	assert.Contains(t, rec.Body.String(), "success")
}

func TestUpdateIdentifier_InvalidBody(t *testing.T) {
	e := setupEcho()
	handler := AuthHandler{client: &mockAuthClient{}}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/identifier/update", `bad`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.UpdateIdentifier(c))
	assert.Equal(t, http.StatusBadRequest, rec.Code)
}

func TestUpdateIdentifier_ClientError(t *testing.T) {
	e := setupEcho()
	mock := &mockAuthClient{
		updateIdentifierFunc: func(ctx context.Context, req *model.UpdateIdentifierRequest) error {
			return status.Error(codes.NotFound, "auth identifier not found")
		},
	}
	handler := AuthHandler{client: mock}

	req, rec := newJSONRequest(http.MethodPost, "/api/v1/auth/identifier/update",
		`{"account_id":"acc_123","auth_type":"email","new_identifier":"nope"}`)
	c := e.NewContext(req, rec)

	assert.NoError(t, handler.UpdateIdentifier(c))
	assert.Equal(t, http.StatusNotFound, rec.Code)
	assert.Contains(t, rec.Body.String(), "auth identifier not found")
}

func TestGrpcStatusToHTTP(t *testing.T) {
	tests := []struct {
		name    string
		err     error
		want    int
		wantMsg string
	}{
		{"InvalidArgument", status.Error(codes.InvalidArgument, "invalid"), http.StatusBadRequest, "invalid"},
		{"Unauthenticated", status.Error(codes.Unauthenticated, "unauth"), http.StatusUnauthorized, "unauth"},
		{"PermissionDenied", status.Error(codes.PermissionDenied, "forbidden"), http.StatusForbidden, "forbidden"},
		{"NotFound", status.Error(codes.NotFound, "missing"), http.StatusNotFound, "missing"},
		{"AlreadyExists", status.Error(codes.AlreadyExists, "exists"), http.StatusConflict, "exists"},
		{"ResourceExhausted", status.Error(codes.ResourceExhausted, "exhausted"), http.StatusTooManyRequests, "exhausted"},
		{"FailedPrecondition", status.Error(codes.FailedPrecondition, "precondition"), http.StatusBadRequest, "precondition"},
		{"Unimplemented", status.Error(codes.Unimplemented, "unimplemented"), http.StatusNotImplemented, "unimplemented"},
		{"Unavailable", status.Error(codes.Unavailable, "unavailable"), http.StatusServiceUnavailable, "unavailable"},
		{"DeadlineExceeded", status.Error(codes.DeadlineExceeded, "timeout"), http.StatusGatewayTimeout, "timeout"},
		{"Internal", status.Error(codes.Internal, "internal"), http.StatusInternalServerError, "internal server error"},
		{"Unknown", status.Error(codes.Unknown, "unknown"), http.StatusInternalServerError, "internal server error"},
		{"Canceled", status.Error(codes.Canceled, "canceled"), http.StatusInternalServerError, "internal server error"},
		{"DataLoss", status.Error(codes.DataLoss, "dataloss"), http.StatusInternalServerError, "internal server error"},
		{"non-grpc error", assert.AnError, http.StatusInternalServerError, "internal server error"},
		{"nil error", nil, http.StatusInternalServerError, "internal server error"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotStatus, gotMsg := GrpcStatusToHTTP(tt.err)
			assert.Equal(t, tt.want, gotStatus)
			assert.Equal(t, tt.wantMsg, gotMsg)
		})
	}
}
