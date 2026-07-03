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
	insertBSItem             = model.InsertBalanceSheetItem
	selectBSItems            = model.SelectBalanceSheetItems
	selectBSItemByID         = model.SelectBalanceSheetItemByID
	updateBSItemByID         = model.UpdateBalanceSheetItemByID
	softDeleteBSItemByID     = model.SoftDeleteBalanceSheetItemByID
	selectBSMonthlySummaries = model.SelectBalanceSheetMonthlySummaries
)

func categoryToSection(category string) (pb.BalanceSheetSection, error) {
	switch category {
	case "流动资产", "固定资产":
		return pb.BalanceSheetSection_BALANCE_SHEET_SECTION_ASSET, nil
	case "流动负债", "非流动负债":
		return pb.BalanceSheetSection_BALANCE_SHEET_SECTION_LIABILITY, nil
	case "权益":
		return pb.BalanceSheetSection_BALANCE_SHEET_SECTION_EQUITY, nil
	default:
		return pb.BalanceSheetSection_BALANCE_SHEET_SECTION_UNSPECIFIED, status.Error(codes.InvalidArgument, "invalid category")
	}
}

type BalanceSheet struct {
	pb.UnimplementedBalanceSheetServer
}

func NewBalanceSheet() *BalanceSheet {
	return &BalanceSheet{}
}

func (s *BalanceSheet) ListItems(ctx context.Context, req *pb.ListItemsRequest) (*pb.ListItemsResponse, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	filter := &model.ListItemsFilter{
		AccountID: accountID,
		Year:      int(req.Year),
		Month:     int(req.Month),
	}

	list, err := selectBSItems(ctx, selectDB(ctx), filter)
	if err != nil {
		zlog.Error("list balance sheet items failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	result := make([]*pb.BalanceSheetItem, 0, len(list))
	for _, item := range list {
		result = append(result, &pb.BalanceSheetItem{
			Id:        item.ID,
			AccountId: item.AccountID,
			Section:   pb.BalanceSheetSection(item.Section),
			Category:  item.Category,
			Name:      item.Name,
			Amount:    item.Amount,
			Note:      item.Note,
			Date:      item.Date,
			SortOrder: int32(item.SortOrder),
			CreatedAt: item.CreatedAt,
			UpdatedAt: item.UpdatedAt,
		})
	}
	return &pb.ListItemsResponse{Items: result}, nil
}

func (s *BalanceSheet) CreateItem(ctx context.Context, req *pb.CreateItemRequest) (*pb.BalanceSheetItem, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if len(req.Name) > 128 {
		return nil, status.Error(codes.InvalidArgument, "name too long")
	}
	if len(req.Note) > 256 {
		return nil, status.Error(codes.InvalidArgument, "note too long")
	}
	if req.Amount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be positive")
	}
	if req.Date == "" {
		return nil, status.Error(codes.InvalidArgument, "date is required")
	}

	section, err := categoryToSection(req.Category)
	if err != nil {
		return nil, err
	}

	n := now()
	item := &model.BalanceSheetItem{
		AccountID: accountID,
		Section:   int(section),
		Category:  req.Category,
		Name:      req.Name,
		Amount:    req.Amount,
		Note:      req.Note,
		Date:      req.Date,
		SortOrder: int(req.SortOrder),
		DeletedAt: 0,
		CreatedAt: n,
		UpdatedAt: n,
	}
	id, err := insertBSItem(ctx, selectDB(ctx), item)
	if err != nil {
		zlog.Error("create balance sheet item failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	item.ID = id
	return &pb.BalanceSheetItem{
		Id:        item.ID,
		AccountId: item.AccountID,
		Section:   pb.BalanceSheetSection(item.Section),
		Category:  item.Category,
		Name:      item.Name,
		Amount:    item.Amount,
		Note:      item.Note,
		Date:      item.Date,
		SortOrder: int32(item.SortOrder),
		CreatedAt: item.CreatedAt,
		UpdatedAt: item.UpdatedAt,
	}, nil
}

func (s *BalanceSheet) UpdateItem(ctx context.Context, req *pb.UpdateItemRequest) (*pb.BalanceSheetItem, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Id == 0 {
		return nil, status.Error(codes.InvalidArgument, "id is required")
	}
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if len(req.Name) > 128 {
		return nil, status.Error(codes.InvalidArgument, "name too long")
	}
	if len(req.Note) > 256 {
		return nil, status.Error(codes.InvalidArgument, "note too long")
	}
	if req.Amount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be positive")
	}

	existing, err := selectBSItemByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "item not found")
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return nil, status.Error(codes.NotFound, "item not found")
	}

	section, err := categoryToSection(req.Category)
	if err != nil {
		return nil, err
	}

	n := now()
	_, err = updateBSItemByID(ctx, selectDB(ctx), req.Id, map[string]interface{}{
		model.FieldBSISection:   int(section),
		model.FieldBSICategory:  req.Category,
		model.FieldBSIName:      req.Name,
		model.FieldBSIAmount:    float64(req.Amount) / 100.0,
		model.FieldBSINote:      req.Note,
		model.FieldBSIDate:      req.Date,
		model.FieldBSISortOrder: int(req.SortOrder),
		model.FieldBSIUpdatedAt: n,
	})
	if err != nil {
		zlog.Error("update balance sheet item failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	return &pb.BalanceSheetItem{
		Id:        existing.ID,
		AccountId: existing.AccountID,
		Section:   section,
		Category:  req.Category,
		Name:      req.Name,
		Amount:    req.Amount,
		Note:      req.Note,
		Date:      req.Date,
		SortOrder: int32(req.SortOrder),
		CreatedAt: existing.CreatedAt,
		UpdatedAt: n,
	}, nil
}

func (s *BalanceSheet) ListMonthlySummaries(ctx context.Context, req *pb.ListMonthlySummariesRequest) (*pb.ListMonthlySummariesResponse, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	list, err := selectBSMonthlySummaries(ctx, selectDB(ctx), accountID, int(req.Months))
	if err != nil {
		zlog.Error("list balance sheet monthly summaries failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	result := make([]*pb.MonthlySummary, 0, len(list))
	for _, s := range list {
		result = append(result, &pb.MonthlySummary{
			Date:             s.Date,
			TotalAssets:      s.TotalAssets,
			TotalLiabilities: s.TotalLiabilities,
			TotalEquity:      s.TotalEquity,
		})
	}
	return &pb.ListMonthlySummariesResponse{Summaries: result}, nil
}

func (s *BalanceSheet) DeleteItem(ctx context.Context, req *pb.DeleteItemRequest) (*emptypb.Empty, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	existing, err := selectBSItemByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return &emptypb.Empty{}, nil
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return &emptypb.Empty{}, nil
	}

	_, err = softDeleteBSItemByID(ctx, selectDB(ctx), req.Id, now())
	if err != nil {
		zlog.Error("delete balance sheet item failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	return &emptypb.Empty{}, nil
}
