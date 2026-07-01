package provider

import (
	"context"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/lib/http/middleware"
)

type authTokenRefresher struct {
	client model.AuthClient
}

func NewTokenRefresher(client model.AuthClient) middleware.TokenRefresher {
	return &authTokenRefresher{client: client}
}

func (r *authTokenRefresher) Refresh(ctx context.Context, refreshToken string) (string, string, int64, error) {
	resp, err := r.client.RefreshToken(ctx, &model.RefreshTokenRequest{
		RefreshToken: refreshToken,
	})
	if err != nil {
		return "", "", 0, err
	}
	return resp.AccessToken, resp.RefreshToken, resp.ExpiresIn, nil
}
