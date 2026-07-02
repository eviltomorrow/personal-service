package service

import (
	"context"

	"google.golang.org/protobuf/types/known/emptypb"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
)

type PortfolioService struct {
	client pb.PortfolioClient
}

func NewPortfolioService(client pb.PortfolioClient) *PortfolioService {
	return &PortfolioService{client: client}
}

func (s *PortfolioService) ListPositions(ctx context.Context, accountID string) ([]model.Position, error) {
	pbResp, err := s.client.ListPositions(withAccountID(ctx, accountID), &emptypb.Empty{})
	if err != nil {
		return nil, err
	}
	result := make([]model.Position, 0, len(pbResp.Positions))
	for _, p := range pbResp.Positions {
		result = append(result, *positionFromProto(p))
	}
	return result, nil
}

func (s *PortfolioService) CreatePosition(ctx context.Context, accountID string, req *model.CreatePositionRequest) (*model.Position, error) {
	pbResp, err := s.client.CreatePosition(withAccountID(ctx, accountID), &pb.CreatePositionRequest{
		Code:         req.Code,
		Name:         req.Name,
		Type:         pb.PositionType(req.Type),
		Direction:    req.Direction,
		InitialQty:   int32(req.InitialQty),
		CurrentPrice: req.CurrentPrice,
		MarginRatio:  int32(req.MarginRatio),
		SortOrder:    int32(req.SortOrder),
	})
	if err != nil {
		return nil, err
	}
	return positionFromProto(pbResp), nil
}

func (s *PortfolioService) UpdatePosition(ctx context.Context, accountID string, req *model.UpdatePositionRequest) (*model.Position, error) {
	pbResp, err := s.client.UpdatePosition(withAccountID(ctx, accountID), &pb.UpdatePositionRequest{
		Id:           req.ID,
		Code:         req.Code,
		Name:         req.Name,
		Type:         pb.PositionType(req.Type),
		Direction:    req.Direction,
		InitialQty:   int32(req.InitialQty),
		CurrentPrice: req.CurrentPrice,
		MarginRatio:  int32(req.MarginRatio),
		SortOrder:    int32(req.SortOrder),
		Archived:     req.Archived,
		ClosedPnl:    req.ClosedPnl,
	})
	if err != nil {
		return nil, err
	}
	return positionFromProto(pbResp), nil
}

func (s *PortfolioService) DeletePosition(ctx context.Context, accountID string, id int64) error {
	_, err := s.client.DeletePosition(withAccountID(ctx, accountID), &pb.DeletePositionRequest{Id: id})
	return err
}

func (s *PortfolioService) ListTrades(ctx context.Context, accountID string, positionID int64) ([]model.Trade, error) {
	pbResp, err := s.client.ListTrades(withAccountID(ctx, accountID), &pb.ListTradesRequest{PositionId: positionID})
	if err != nil {
		return nil, err
	}
	result := make([]model.Trade, 0, len(pbResp.Trades))
	for _, t := range pbResp.Trades {
		result = append(result, *tradeFromProto(t))
	}
	return result, nil
}

func (s *PortfolioService) CreateTrade(ctx context.Context, accountID string, req *model.CreateTradeRequest) (*model.Trade, error) {
	pbResp, err := s.client.CreateTrade(withAccountID(ctx, accountID), &pb.CreateTradeRequest{
		PositionId: req.PositionID,
		Type:       pb.TradeType(req.Type),
		Date:       req.Date,
		Price:      req.Price,
		Quantity:   int32(req.Quantity),
		Note:       req.Note,
	})
	if err != nil {
		return nil, err
	}
	return tradeFromProto(pbResp), nil
}

func (s *PortfolioService) UpdateTrade(ctx context.Context, accountID string, req *model.UpdateTradeRequest) (*model.Trade, error) {
	pbResp, err := s.client.UpdateTrade(withAccountID(ctx, accountID), &pb.UpdateTradeRequest{
		Id:       req.ID,
		Type:     pb.TradeType(req.Type),
		Date:     req.Date,
		Price:    req.Price,
		Quantity: int32(req.Quantity),
		Note:     req.Note,
	})
	if err != nil {
		return nil, err
	}
	return tradeFromProto(pbResp), nil
}

func (s *PortfolioService) DeleteTrade(ctx context.Context, accountID string, id int64) error {
	_, err := s.client.DeleteTrade(withAccountID(ctx, accountID), &pb.DeleteTradeRequest{Id: id})
	return err
}

func (s *PortfolioService) ListSnapshots(ctx context.Context, accountID string) ([]model.ValueSnapshot, error) {
	pbResp, err := s.client.ListSnapshots(withAccountID(ctx, accountID), &emptypb.Empty{})
	if err != nil {
		return nil, err
	}
	result := make([]model.ValueSnapshot, 0, len(pbResp.Snapshots))
	for _, s := range pbResp.Snapshots {
		result = append(result, model.ValueSnapshot{Date: s.Date, TotalValue: s.TotalValue})
	}
	return result, nil
}

func (s *PortfolioService) UpsertSnapshot(ctx context.Context, accountID string, req *model.UpsertSnapshotRequest) (*model.ValueSnapshot, error) {
	pbResp, err := s.client.UpsertSnapshot(withAccountID(ctx, accountID), &pb.UpsertSnapshotRequest{
		Date:       req.Date,
		TotalValue: req.TotalValue,
	})
	if err != nil {
		return nil, err
	}
	return &model.ValueSnapshot{Date: pbResp.Date, TotalValue: pbResp.TotalValue}, nil
}

func (s *PortfolioService) GetConfig(ctx context.Context, accountID string) (*model.PortfolioConfig, error) {
	pbResp, err := s.client.GetConfig(withAccountID(ctx, accountID), &emptypb.Empty{})
	if err != nil {
		return nil, err
	}
	return &model.PortfolioConfig{TotalCapital: pbResp.TotalCapital}, nil
}

func (s *PortfolioService) UpdateConfig(ctx context.Context, accountID string, totalCapital int64) (*model.PortfolioConfig, error) {
	pbResp, err := s.client.UpdateConfig(withAccountID(ctx, accountID), &pb.UpdateConfigRequest{TotalCapital: totalCapital})
	if err != nil {
		return nil, err
	}
	return &model.PortfolioConfig{TotalCapital: pbResp.TotalCapital}, nil
}

func positionFromProto(p *pb.Position) *model.Position {
	return &model.Position{
		ID:           p.Id,
		AccountID:    p.AccountId,
		Code:         p.Code,
		Name:         p.Name,
		Type:         int(p.Type),
		Direction:    p.Direction,
		InitialQty:   int(p.InitialQty),
		CurrentPrice: p.CurrentPrice,
		MarginRatio:  int(p.MarginRatio),
		SortOrder:    int(p.SortOrder),
		Archived:     p.Archived,
		ClosedPnl:    p.ClosedPnl,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
	}
}

func tradeFromProto(t *pb.Trade) *model.Trade {
	return &model.Trade{
		ID:         t.Id,
		AccountID:  t.AccountId,
		PositionID: t.PositionId,
		Type:       int(t.Type),
		Date:       t.Date,
		Price:      t.Price,
		Quantity:   int(t.Quantity),
		Note:       t.Note,
		CreatedAt:  t.CreatedAt,
		UpdatedAt:  t.UpdatedAt,
	}
}
