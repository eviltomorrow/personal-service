package service

import (
	"context"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
)

type ProfileService struct {
	client pb.ProfileClient
}

func NewProfileService(client pb.ProfileClient) *ProfileService {
	return &ProfileService{client: client}
}

func (s *ProfileService) GetProfile(ctx context.Context, accountID string) (*model.ProfileInfo, error) {
	pbResp, err := s.client.GetProfile(withAccountID(ctx, accountID), &pb.GetProfileRequest{})
	if err != nil {
		return nil, err
	}
	return &model.ProfileInfo{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Nickname:  pbResp.Nickname,
		Email:     pbResp.Email,
		Bio:       pbResp.Bio,
		AvatarURL: pbResp.AvatarUrl,
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *ProfileService) UpdateProfile(ctx context.Context, accountID string, req *model.UpdateProfileRequest) (*model.ProfileInfo, error) {
	pbResp, err := s.client.UpdateProfile(withAccountID(ctx, accountID), &pb.UpdateProfileRequest{
		Nickname:  req.Nickname,
		Email:     req.Email,
		Bio:       req.Bio,
		AvatarUrl: req.AvatarURL,
	})
	if err != nil {
		return nil, err
	}
	return &model.ProfileInfo{
		ID:        pbResp.Profile.Id,
		AccountID: pbResp.Profile.AccountId,
		Nickname:  pbResp.Profile.Nickname,
		Email:     pbResp.Profile.Email,
		Bio:       pbResp.Profile.Bio,
		AvatarURL: pbResp.Profile.AvatarUrl,
		CreatedAt: pbResp.Profile.CreatedAt,
		UpdatedAt: pbResp.Profile.UpdatedAt,
	}, nil
}
