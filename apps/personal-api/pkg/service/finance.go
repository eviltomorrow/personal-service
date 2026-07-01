package service

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	pb "github.com/eviltomorrow/personal-service/apps/personal-finance/adapter/pb"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
)

func withAccountID(ctx context.Context, accountID string) context.Context {
	return metadata.AppendToOutgoingContext(ctx, "x-account-id", accountID)
}

type FinanceService struct {
	client pb.FinanceClient
}

func NewFinanceService(client pb.FinanceClient) *FinanceService {
	return &FinanceService{client: client}
}

func financeTypeToProto(t model.FinanceType) (pb.FinanceType, error) {
	switch t {
	case model.FinanceTypeIncome:
		return pb.FinanceType_FINANCE_TYPE_INCOME, nil
	case model.FinanceTypeExpense:
		return pb.FinanceType_FINANCE_TYPE_EXPENSE, nil
	default:
		return pb.FinanceType_FINANCE_TYPE_UNSPECIFIED, status.Error(codes.InvalidArgument, "unsupported finance_type")
	}
}

func financeTypeFromProto(t pb.FinanceType) model.FinanceType {
	switch t {
	case pb.FinanceType_FINANCE_TYPE_INCOME:
		return model.FinanceTypeIncome
	case pb.FinanceType_FINANCE_TYPE_EXPENSE:
		return model.FinanceTypeExpense
	default:
		return ""
	}
}

func (s *FinanceService) ListCategories(ctx context.Context, accountID string) ([]model.Category, error) {
	pbResp, err := s.client.ListCategories(withAccountID(ctx, accountID), &emptypb.Empty{})
	if err != nil {
		return nil, err
	}
	result := make([]model.Category, 0, len(pbResp.Categories))
	for _, c := range pbResp.Categories {
		result = append(result, model.Category{
			ID:        c.Id,
			AccountID: c.AccountId,
			Name:      c.Name,
			Type:      financeTypeFromProto(c.Type),
			SortOrder: int(c.SortOrder),
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
		})
	}
	return result, nil
}

func (s *FinanceService) CreateCategory(ctx context.Context, accountID string, req *model.CreateCategoryRequest) (*model.Category, error) {
	pbType, err := financeTypeToProto(req.Type)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.CreateCategory(withAccountID(ctx, accountID), &pb.CreateCategoryRequest{
		Name:      req.Name,
		Type:      pbType,
		SortOrder: int32(req.SortOrder),
	})
	if err != nil {
		return nil, err
	}
	return &model.Category{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Name:      pbResp.Name,
		Type:      financeTypeFromProto(pbResp.Type),
		SortOrder: int(pbResp.SortOrder),
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *FinanceService) UpdateCategory(ctx context.Context, accountID string, req *model.UpdateCategoryRequest) (*model.Category, error) {
	pbType, err := financeTypeToProto(req.Type)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.UpdateCategory(withAccountID(ctx, accountID), &pb.UpdateCategoryRequest{
		Id:        req.ID,
		Name:      req.Name,
		Type:      pbType,
		SortOrder: int32(req.SortOrder),
	})
	if err != nil {
		return nil, err
	}
	return &model.Category{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Name:      pbResp.Name,
		Type:      financeTypeFromProto(pbResp.Type),
		SortOrder: int(pbResp.SortOrder),
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *FinanceService) DeleteCategory(ctx context.Context, accountID string, id int64) error {
	_, err := s.client.DeleteCategory(withAccountID(ctx, accountID), &pb.DeleteCategoryRequest{Id: id})
	return err
}

func (s *FinanceService) ListTransactions(ctx context.Context, accountID string, req *model.ListTransactionsRequest) (*model.ListTransactionsResult, error) {
	pbResp, err := s.client.ListTransactions(withAccountID(ctx, accountID), &pb.ListTransactionsRequest{
		Year:       int32(req.Year),
		Month:      int32(req.Month),
		CategoryId: req.CategoryID,
		Page:       int32(req.Page),
		PageSize:   int32(req.PageSize),
	})
	if err != nil {
		return nil, err
	}
	result := make([]model.Transaction, 0, len(pbResp.Transactions))
	for _, t := range pbResp.Transactions {
		result = append(result, model.Transaction{
			ID:         t.Id,
			AccountID:  t.AccountId,
			CategoryID: t.CategoryId,
			Type:       financeTypeFromProto(t.Type),
			Name:       t.Name,
			Amount:     t.Amount,
			Date:       t.Date,
			Note:       t.Note,
			CreatedAt:  t.CreatedAt,
			UpdatedAt:  t.UpdatedAt,
		})
	}
	return &model.ListTransactionsResult{
		Transactions: result,
		Total:        int(pbResp.Total),
	}, nil
}

func (s *FinanceService) CreateTransaction(ctx context.Context, accountID string, req *model.CreateTransactionRequest) (*model.Transaction, error) {
	pbType, err := financeTypeToProto(req.Type)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.CreateTransaction(withAccountID(ctx, accountID), &pb.CreateTransactionRequest{
		CategoryId: req.CategoryID,
		Type:       pbType,
		Name:       req.Name,
		Amount:     req.Amount,
		Date:       req.Date,
		Note:       req.Note,
	})
	if err != nil {
		return nil, err
	}
	return &model.Transaction{
		ID:         pbResp.Id,
		AccountID:  pbResp.AccountId,
		CategoryID: pbResp.CategoryId,
		Type:       financeTypeFromProto(pbResp.Type),
		Name:       pbResp.Name,
		Amount:     pbResp.Amount,
		Date:       pbResp.Date,
		Note:       pbResp.Note,
		CreatedAt:  pbResp.CreatedAt,
		UpdatedAt:  pbResp.UpdatedAt,
	}, nil
}

func (s *FinanceService) UpdateTransaction(ctx context.Context, accountID string, req *model.UpdateTransactionRequest) (*model.Transaction, error) {
	pbType, err := financeTypeToProto(req.Type)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.UpdateTransaction(withAccountID(ctx, accountID), &pb.UpdateTransactionRequest{
		Id:         req.ID,
		CategoryId: req.CategoryID,
		Type:       pbType,
		Name:       req.Name,
		Amount:     req.Amount,
		Date:       req.Date,
		Note:       req.Note,
	})
	if err != nil {
		return nil, err
	}
	return &model.Transaction{
		ID:         pbResp.Id,
		AccountID:  pbResp.AccountId,
		CategoryID: pbResp.CategoryId,
		Type:       financeTypeFromProto(pbResp.Type),
		Name:       pbResp.Name,
		Amount:     pbResp.Amount,
		Date:       pbResp.Date,
		Note:       pbResp.Note,
		CreatedAt:  pbResp.CreatedAt,
		UpdatedAt:  pbResp.UpdatedAt,
	}, nil
}

func (s *FinanceService) DeleteTransaction(ctx context.Context, accountID string, id int64) error {
	_, err := s.client.DeleteTransaction(withAccountID(ctx, accountID), &pb.DeleteTransactionRequest{Id: id})
	return err
}
