package service

import (
	"context"
	"errors"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.uber.org/zap"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/personal-core/pkg/model"
)

var (
	insertPosition         = model.InsertPosition
	selectPositionsByAcct  = model.SelectPositionsByAccountID
	selectPositionByID     = model.SelectPositionByID
	updatePositionByID     = model.UpdatePositionByID
	softDeletePositionByID = model.SoftDeletePositionByID

	insertTrade         = model.InsertTrade
	selectTradesByPosID = model.SelectTradesByPositionID
	selectTradeByID     = model.SelectTradeByID
	updateTradeByID     = model.UpdateTradeByID
	softDeleteTradeByID = model.SoftDeleteTradeByID

	selectSnapshotsByAcct = model.SelectSnapshotsByAccountID
	upsertSnapshot        = model.UpsertSnapshot

	selectConfigByAcct = model.SelectConfigByAccountID
	upsertConfig       = model.UpsertConfig
)

type Portfolio struct {
	pb.UnimplementedPortfolioServer
}

func NewPortfolio() *Portfolio {
	return &Portfolio{}
}

// --- Positions ---

func (s *Portfolio) ListPositions(ctx context.Context, _ *emptypb.Empty) (*pb.ListPositionsResponse, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	list, err := selectPositionsByAcct(ctx, selectDB(ctx), accountID)
	if err != nil {
		zlog.Error("list positions failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	result := make([]*pb.Position, 0, len(list))
	for _, p := range list {
		result = append(result, positionToProto(p))
	}
	return &pb.ListPositionsResponse{Positions: result}, nil
}

func (s *Portfolio) CreatePosition(ctx context.Context, req *pb.CreatePositionRequest) (*pb.Position, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Code == "" || req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "code and name are required")
	}
	if req.CurrentPrice <= 0 {
		return nil, status.Error(codes.InvalidArgument, "current_price must be positive")
	}

	n := now()
	p := &model.Position{
		AccountID:    accountID,
		Code:         req.Code,
		Name:         req.Name,
		Type:         int(req.Type),
		Direction:    req.Direction,
		InitialQty:   int(req.InitialQty),
		CurrentPrice: req.CurrentPrice,
		MarginRatio:  int(req.MarginRatio),
		SortOrder:    int(req.SortOrder),
		Archived:     false,
		ClosedPnl:    0,
		DeletedAt:    0,
		CreatedAt:    n,
		UpdatedAt:    n,
	}
	id, err := insertPosition(ctx, selectDB(ctx), p)
	if err != nil {
		zlog.Error("create position failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	p.ID = id
	return positionToProto(p), nil
}

func (s *Portfolio) UpdatePosition(ctx context.Context, req *pb.UpdatePositionRequest) (*pb.Position, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	existing, err := selectPositionByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "position not found")
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return nil, status.Error(codes.NotFound, "position not found")
	}

	n := now()
	_, err = updatePositionByID(ctx, selectDB(ctx), req.Id, map[string]interface{}{
		model.FieldPosCode:         req.Code,
		model.FieldPosName:         req.Name,
		model.FieldPosType:         int(req.Type),
		model.FieldPosDirection:    req.Direction,
		model.FieldPosInitialQty:   int(req.InitialQty),
		model.FieldPosCurrentPrice: float64(req.CurrentPrice) / 100.0,
		model.FieldPosMarginRatio:  int(req.MarginRatio),
		model.FieldPosSortOrder:    int(req.SortOrder),
		model.FieldPosArchived:     req.Archived,
		model.FieldPosClosedPnl:    float64(req.ClosedPnl) / 100.0,
		model.FieldPosUpdatedAt:    n,
	})
	if err != nil {
		zlog.Error("update position failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	existing.Code = req.Code
	existing.Name = req.Name
	existing.Type = int(req.Type)
	existing.Direction = req.Direction
	existing.InitialQty = int(req.InitialQty)
	existing.CurrentPrice = req.CurrentPrice
	existing.MarginRatio = int(req.MarginRatio)
	existing.SortOrder = int(req.SortOrder)
	existing.Archived = req.Archived
	existing.ClosedPnl = req.ClosedPnl
	existing.UpdatedAt = n
	return positionToProto(existing), nil
}

func (s *Portfolio) DeletePosition(ctx context.Context, req *pb.DeletePositionRequest) (*emptypb.Empty, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	existing, err := selectPositionByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return &emptypb.Empty{}, nil
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return &emptypb.Empty{}, nil
	}

	n := now()
	_, err = softDeletePositionByID(ctx, selectDB(ctx), req.Id, n)
	if err != nil {
		zlog.Error("delete position failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	return &emptypb.Empty{}, nil
}

func positionToProto(p *model.Position) *pb.Position {
	return &pb.Position{
		Id:           p.ID,
		AccountId:    p.AccountID,
		Code:         p.Code,
		Name:         p.Name,
		Type:         pb.PositionType(p.Type),
		Direction:    p.Direction,
		InitialQty:   int32(p.InitialQty),
		CurrentPrice: p.CurrentPrice,
		MarginRatio:  int32(p.MarginRatio),
		SortOrder:    int32(p.SortOrder),
		Archived:     p.Archived,
		ClosedPnl:    p.ClosedPnl,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
	}
}

// --- Trades ---

func (s *Portfolio) ListTrades(ctx context.Context, req *pb.ListTradesRequest) (*pb.ListTradesResponse, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	list, err := selectTradesByPosID(ctx, selectDB(ctx), req.PositionId)
	if err != nil {
		zlog.Error("list trades failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	result := make([]*pb.Trade, 0, len(list))
	for _, t := range list {
		if t.AccountID != accountID {
			continue
		}
		result = append(result, tradeToProto(t))
	}
	return &pb.ListTradesResponse{Trades: result}, nil
}

func (s *Portfolio) CreateTrade(ctx context.Context, req *pb.CreateTradeRequest) (*pb.Trade, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Price <= 0 || req.Quantity <= 0 {
		return nil, status.Error(codes.InvalidArgument, "price and quantity must be positive")
	}
	if req.Date == "" {
		return nil, status.Error(codes.InvalidArgument, "date is required")
	}

	n := now()
	t := &model.Trade{
		AccountID:  accountID,
		PositionID: req.PositionId,
		Type:       int(req.Type),
		Date:       req.Date,
		Price:      req.Price,
		Quantity:   int(req.Quantity),
		Note:       req.Note,
		DeletedAt:  0,
		CreatedAt:  n,
		UpdatedAt:  n,
	}
	id, err := insertTrade(ctx, selectDB(ctx), t)
	if err != nil {
		zlog.Error("create trade failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	t.ID = id
	return tradeToProto(t), nil
}

func (s *Portfolio) UpdateTrade(ctx context.Context, req *pb.UpdateTradeRequest) (*pb.Trade, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}

	existing, err := selectTradeByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "trade not found")
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return nil, status.Error(codes.NotFound, "trade not found")
	}

	n := now()
	_, err = updateTradeByID(ctx, selectDB(ctx), req.Id, map[string]interface{}{
		model.FieldTradeType:      int(req.Type),
		model.FieldTradeDate:      req.Date,
		model.FieldTradePrice:     float64(req.Price) / 100.0,
		model.FieldTradeQuantity:  int(req.Quantity),
		model.FieldTradeNote:      req.Note,
		model.FieldTradeUpdatedAt: n,
	})
	if err != nil {
		zlog.Error("update trade failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	existing.Type = int(req.Type)
	existing.Date = req.Date
	existing.Price = req.Price
	existing.Quantity = int(req.Quantity)
	existing.Note = req.Note
	existing.UpdatedAt = n
	return tradeToProto(existing), nil
}

func (s *Portfolio) DeleteTrade(ctx context.Context, req *pb.DeleteTradeRequest) (*emptypb.Empty, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	existing, err := selectTradeByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return &emptypb.Empty{}, nil
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return &emptypb.Empty{}, nil
	}

	_, err = softDeleteTradeByID(ctx, selectDB(ctx), req.Id, now())
	if err != nil {
		zlog.Error("delete trade failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	return &emptypb.Empty{}, nil
}

func tradeToProto(t *model.Trade) *pb.Trade {
	return &pb.Trade{
		Id:         t.ID,
		AccountId:  t.AccountID,
		PositionId: t.PositionID,
		Type:       pb.TradeType(t.Type),
		Date:       t.Date,
		Price:      t.Price,
		Quantity:   int32(t.Quantity),
		Note:       t.Note,
		CreatedAt:  t.CreatedAt,
		UpdatedAt:  t.UpdatedAt,
	}
}

// --- Snapshots ---

func (s *Portfolio) ListSnapshots(ctx context.Context, _ *emptypb.Empty) (*pb.ListSnapshotsResponse, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	list, err := selectSnapshotsByAcct(ctx, selectDB(ctx), accountID)
	if err != nil {
		zlog.Error("list snapshots failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	result := make([]*pb.ValueSnapshot, 0, len(list))
	for _, s := range list {
		result = append(result, &pb.ValueSnapshot{
			Date:       s.Date,
			TotalValue: s.TotalValue,
		})
	}
	return &pb.ListSnapshotsResponse{Snapshots: result}, nil
}

func (s *Portfolio) UpsertSnapshot(ctx context.Context, req *pb.UpsertSnapshotRequest) (*pb.ValueSnapshot, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Date == "" {
		return nil, status.Error(codes.InvalidArgument, "date is required")
	}

	snap := &model.ValueSnapshot{
		AccountID:  accountID,
		Date:       req.Date,
		TotalValue: req.TotalValue,
		CreatedAt:  now(),
	}
	if err := upsertSnapshot(ctx, selectDB(ctx), snap); err != nil {
		zlog.Error("upsert snapshot failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	return &pb.ValueSnapshot{Date: snap.Date, TotalValue: snap.TotalValue}, nil
}

// --- Config ---

func (s *Portfolio) GetConfig(ctx context.Context, _ *emptypb.Empty) (*pb.PortfolioConfig, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	cfg, err := selectConfigByAcct(ctx, selectDB(ctx), accountID)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return &pb.PortfolioConfig{TotalCapital: 0}, nil
		}
		zlog.Error("get config failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	return &pb.PortfolioConfig{TotalCapital: cfg.TotalCapital}, nil
}

func (s *Portfolio) UpdateConfig(ctx context.Context, req *pb.UpdateConfigRequest) (*pb.PortfolioConfig, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	if err := upsertConfig(ctx, selectDB(ctx), accountID, req.TotalCapital, now()); err != nil {
		zlog.Error("update config failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	return &pb.PortfolioConfig{TotalCapital: req.TotalCapital}, nil
}
