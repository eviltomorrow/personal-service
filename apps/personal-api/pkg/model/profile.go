package model

import "context"

type ProfileInfo struct {
	ID        int64  `json:"id"`
	AccountID string `json:"account_id"`
	Nickname  string `json:"nickname"`
	Email     string `json:"email"`
	Bio       string `json:"bio"`
	AvatarURL string `json:"avatar_url"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

type UpdateProfileRequest struct {
	Nickname  string `json:"nickname"`
	Email     string `json:"email"`
	Bio       string `json:"bio"`
	AvatarURL string `json:"avatar_url"`
}

type ProfileClient interface {
	GetProfile(ctx context.Context, accountID string) (*ProfileInfo, error)
	UpdateProfile(ctx context.Context, accountID string, req *UpdateProfileRequest) (*ProfileInfo, error)
}
