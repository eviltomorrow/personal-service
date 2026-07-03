package service

import (
	"context"
	"errors"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.uber.org/zap"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/personal-core/pkg/model"
)

var (
	insertProfile         = model.InsertProfile
	selectProfileByAcctID = model.SelectProfileByAccountID
	updateProfileByAcctID = model.UpdateProfileByAccountID
)

type Profile struct {
	pb.UnimplementedProfileServer
}

func NewProfile() *Profile {
	return &Profile{}
}

func (s *Profile) GetProfile(ctx context.Context, req *pb.GetProfileRequest) (*pb.ProfileInfo, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	p, err := selectProfileByAcctID(ctx, selectDB(ctx), accountID)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			now := now()
			p = &model.Profile{
				AccountID: accountID,
				Nickname:  req.AccountId,
				CreatedAt: now,
				UpdatedAt: now,
			}
			if _, err := insertProfile(ctx, selectDB(ctx), p); err != nil {
				zlog.Error("insert profile failure", zap.Error(err))
				return nil, status.Error(codes.Internal, "internal server error")
			}
			return profileToPB(p), nil
		}
		zlog.Error("select profile failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	return profileToPB(p), nil
}

func (s *Profile) UpdateProfile(ctx context.Context, req *pb.UpdateProfileRequest) (*pb.UpdateProfileResponse, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	updates := map[string]interface{}{
		model.FieldProfileUpdatedAt: now(),
	}
	if req.Nickname != "" {
		updates[model.FieldProfileNickname] = req.Nickname
	}
	if req.Email != "" {
		updates[model.FieldProfileEmail] = req.Email
	}
	if req.Bio != "" {
		updates[model.FieldProfileBio] = req.Bio
	}
	if req.AvatarUrl != "" {
		updates[model.FieldProfileAvatarURL] = req.AvatarUrl
	}

	if _, err := updateProfileByAcctID(ctx, selectDB(ctx), accountID, updates); err != nil {
		zlog.Error("update profile failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	p, err := selectProfileByAcctID(ctx, selectDB(ctx), accountID)
	if err != nil {
		zlog.Error("select profile after update failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	return &pb.UpdateProfileResponse{Profile: profileToPB(p)}, nil
}

func profileToPB(p *model.Profile) *pb.ProfileInfo {
	return &pb.ProfileInfo{
		Id:        p.ID,
		AccountId: p.AccountID,
		Nickname:  p.Nickname,
		Email:     p.Email,
		Bio:       p.Bio,
		AvatarUrl: p.AvatarURL,
		CreatedAt: p.CreatedAt,
		UpdatedAt: p.UpdatedAt,
	}
}
