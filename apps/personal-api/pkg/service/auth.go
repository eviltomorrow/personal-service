package service

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "github.com/eviltomorrow/personal-service/apps/personal-auth/adapter/pb"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
)

type AuthService struct {
	client pb.AuthClient
}

func NewAuthService(client pb.AuthClient) *AuthService {
	return &AuthService{client: client}
}

func authTypeToProto(t model.AuthType) (pb.AuthType, error) {
	switch t {
	case model.AuthTypeEmail:
		return pb.AuthType_AUTH_TYPE_EMAIL, nil
	case model.AuthTypeUsername:
		return pb.AuthType_AUTH_TYPE_USERNAME, nil
	case model.AuthTypePhone:
		return pb.AuthType_AUTH_TYPE_PHONE, nil
	default:
		return pb.AuthType_AUTH_TYPE_UNSPECIFIED, status.Error(codes.InvalidArgument, "unsupported auth_type")
	}
}

func (s *AuthService) Register(ctx context.Context, req *model.RegisterRequest) (*model.RegisterResponse, error) {
	authType, err := authTypeToProto(req.AuthType)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.Register(ctx, &pb.RegisterRequest{
		AuthType:   authType,
		Identifier: req.Identifier,
		Password:   req.Password,
	})
	if err != nil {
		return nil, err
	}
	return &model.RegisterResponse{
		AccessToken:  pbResp.AccessToken,
		RefreshToken: pbResp.RefreshToken,
		ExpiresIn:    pbResp.ExpiresIn,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, req *model.LoginRequest) (*model.LoginResponse, error) {
	authType, err := authTypeToProto(req.AuthType)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.Login(ctx, &pb.LoginRequest{
		AuthType:   authType,
		Identifier: req.Identifier,
		Password:   req.Password,
		IpAddress:  req.IPAddress,
		UserAgent:  req.UserAgent,
	})
	if err != nil {
		return nil, err
	}
	return &model.LoginResponse{
		AccessToken:  pbResp.AccessToken,
		RefreshToken: pbResp.RefreshToken,
		ExpiresIn:    pbResp.ExpiresIn,
	}, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, req *model.RefreshTokenRequest) (*model.RefreshTokenResponse, error) {
	pbResp, err := s.client.RefreshToken(ctx, &pb.RefreshTokenRequest{
		RefreshToken: req.RefreshToken,
	})
	if err != nil {
		return nil, err
	}
	return &model.RefreshTokenResponse{
		AccessToken:  pbResp.AccessToken,
		RefreshToken: pbResp.RefreshToken,
		ExpiresIn:    pbResp.ExpiresIn,
	}, nil
}

func (s *AuthService) ValidateToken(ctx context.Context, req *model.ValidateTokenRequest) (*model.ValidateTokenResponse, error) {
	pbResp, err := s.client.ValidateToken(ctx, &pb.ValidateTokenRequest{
		AccessToken: req.AccessToken,
	})
	if err != nil {
		return nil, err
	}
	return &model.ValidateTokenResponse{
		Role:      pbResp.Role,
		ExpiresAt: pbResp.ExpiresAt,
	}, nil
}

func (s *AuthService) RevokeToken(ctx context.Context, req *model.RevokeTokenRequest) error {
	_, err := s.client.RevokeToken(ctx, &pb.RevokeTokenRequest{
		RefreshToken: req.RefreshToken,
	})
	return err
}

func (s *AuthService) RevokeAllTokens(ctx context.Context, req *model.RevokeAllTokensRequest) error {
	_, err := s.client.RevokeAllTokens(ctx, &pb.RevokeAllTokensRequest{
		AccessToken: req.AccessToken,
	})
	return err
}

func (s *AuthService) DeleteAccount(ctx context.Context, req *model.DeleteAccountRequest) (*model.DeleteAccountResponse, error) {
	_, err := s.client.DeleteAccount(ctx, &pb.DeleteAccountRequest{
		AccountId: req.AccountID,
		Password:  req.Password,
	})
	if err != nil {
		return nil, err
	}
	return &model.DeleteAccountResponse{}, nil
}

func (s *AuthService) UpdatePassword(ctx context.Context, req *model.UpdatePasswordRequest) error {
	_, err := s.client.UpdatePassword(ctx, &pb.UpdatePasswordRequest{
		AccountId:   req.AccountID,
		OldPassword: req.OldPassword,
		NewPassword: req.NewPassword,
	})
	return err
}

func (s *AuthService) UpdateIdentifier(ctx context.Context, req *model.UpdateIdentifierRequest) error {
	authType, err := authTypeToProto(req.AuthType)
	if err != nil {
		return err
	}
	_, err = s.client.UpdateIdentifier(ctx, &pb.UpdateIdentifierRequest{
		AccountId:     req.AccountID,
		AuthType:      authType,
		NewIdentifier: req.NewIdentifier,
	})
	return err
}
