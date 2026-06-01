package model

import "context"

type AuthType string

const (
	AuthTypeEmail    AuthType = "email"
	AuthTypeUsername AuthType = "username"
	AuthTypePhone    AuthType = "phone"
)

type RegisterRequest struct {
	AuthType   AuthType `json:"auth_type"`
	Identifier string   `json:"identifier"`
	Password   string   `json:"password"`
}

type RegisterResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

type LoginRequest struct {
	AuthType   AuthType `json:"auth_type"`
	Identifier string   `json:"identifier"`
	Password   string   `json:"password"`
	IPAddress  string   `json:"-"`
	UserAgent  string   `json:"-"`
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

type RevokeTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type RevokeAllTokensRequest struct {
	AccessToken string `json:"access_token"`
}

type ValidateTokenRequest struct {
	AccessToken string `json:"access_token"`
}

type ValidateTokenResponse struct {
	Role      string `json:"role"`
	ExpiresAt int64  `json:"expires_at"`
}

type DeleteAccountRequest struct {
	AccountID string `json:"account_id"`
	Password  string `json:"password"`
}

type DeleteAccountResponse struct{}

type UpdatePasswordRequest struct {
	AccountID   string `json:"account_id"`
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

type UpdateIdentifierRequest struct {
	AccountID     string   `json:"account_id"`
	AuthType      AuthType `json:"auth_type"`
	NewIdentifier string   `json:"new_identifier"`
}

type AuthClient interface {
	Register(ctx context.Context, req *RegisterRequest) (*RegisterResponse, error)
	Login(ctx context.Context, req *LoginRequest) (*LoginResponse, error)
	RefreshToken(ctx context.Context, req *RefreshTokenRequest) (*RefreshTokenResponse, error)
	ValidateToken(ctx context.Context, req *ValidateTokenRequest) (*ValidateTokenResponse, error)
	RevokeToken(ctx context.Context, req *RevokeTokenRequest) error
	RevokeAllTokens(ctx context.Context, req *RevokeAllTokensRequest) error
	DeleteAccount(ctx context.Context, req *DeleteAccountRequest) (*DeleteAccountResponse, error)
	UpdatePassword(ctx context.Context, req *UpdatePasswordRequest) error
	UpdateIdentifier(ctx context.Context, req *UpdateIdentifierRequest) error
}
