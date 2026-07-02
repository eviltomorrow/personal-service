package service

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
)

func withAccountID(ctx context.Context, accountID string) context.Context {
	ctx = metadata.AppendToOutgoingContext(ctx, "account_id", accountID)
	return ctx
}

type CashFlowService struct {
	client pb.CashFlowClient
}

func NewCashFlowService(client pb.CashFlowClient) *CashFlowService {
	return &CashFlowService{client: client}
}

func cashFlowTypeToProto(t model.CashFlowType) (pb.CashFlowType, error) {
	switch t {
	case model.CashFlowTypeIncome:
		return pb.CashFlowType_CASH_FLOW_TYPE_INCOME, nil
	case model.CashFlowTypeExpense:
		return pb.CashFlowType_CASH_FLOW_TYPE_EXPENSE, nil
	default:
		return pb.CashFlowType_CASH_FLOW_TYPE_UNSPECIFIED, status.Error(codes.InvalidArgument, "unsupported cash_flow_type")
	}
}

func cashFlowTypeFromProto(t pb.CashFlowType) model.CashFlowType {
	switch t {
	case pb.CashFlowType_CASH_FLOW_TYPE_INCOME:
		return model.CashFlowTypeIncome
	case pb.CashFlowType_CASH_FLOW_TYPE_EXPENSE:
		return model.CashFlowTypeExpense
	default:
		return ""
	}
}

func (s *CashFlowService) ListCategories(ctx context.Context, accountID string, year int, month int) ([]model.Category, error) {
	pbResp, err := s.client.ListCategories(withAccountID(ctx, accountID), &pb.ListCategoriesRequest{
		Year:  int32(year),
		Month: int32(month),
	})
	if err != nil {
		return nil, err
	}
	result := make([]model.Category, 0, len(pbResp.Categories))
	for _, c := range pbResp.Categories {
		result = append(result, model.Category{
			ID:        c.Id,
			AccountID: c.AccountId,
			Name:      c.Name,
			Type:      cashFlowTypeFromProto(c.Type),
			SortOrder: int(c.SortOrder),
			Date:      c.Date,
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
		})
	}
	return result, nil
}

func (s *CashFlowService) CreateCategory(ctx context.Context, accountID string, req *model.CreateCategoryRequest) (*model.Category, error) {
	pbType, err := cashFlowTypeToProto(req.Type)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.CreateCategory(withAccountID(ctx, accountID), &pb.CreateCategoryRequest{
		Name:      req.Name,
		Type:      pbType,
		SortOrder: int32(req.SortOrder),
		Date:      req.Date,
	})
	if err != nil {
		return nil, err
	}
	return &model.Category{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Name:      pbResp.Name,
		Type:      cashFlowTypeFromProto(pbResp.Type),
		SortOrder: int(pbResp.SortOrder),
		Date:      pbResp.Date,
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *CashFlowService) UpdateCategory(ctx context.Context, accountID string, req *model.UpdateCategoryRequest) (*model.Category, error) {
	pbType, err := cashFlowTypeToProto(req.Type)
	if err != nil {
		return nil, err
	}
	pbResp, err := s.client.UpdateCategory(withAccountID(ctx, accountID), &pb.UpdateCategoryRequest{
		Id:        req.ID,
		Name:      req.Name,
		Type:      pbType,
		SortOrder: int32(req.SortOrder),
		Date:      req.Date,
	})
	if err != nil {
		return nil, err
	}
	return &model.Category{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Name:      pbResp.Name,
		Type:      cashFlowTypeFromProto(pbResp.Type),
		SortOrder: int(pbResp.SortOrder),
		Date:      pbResp.Date,
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *CashFlowService) DeleteCategory(ctx context.Context, accountID string, id int64) error {
	_, err := s.client.DeleteCategory(withAccountID(ctx, accountID), &pb.DeleteCategoryRequest{Id: id})
	return err
}

func (s *CashFlowService) ListTransactions(ctx context.Context, accountID string, req *model.ListTransactionsRequest) (*model.ListTransactionsResult, error) {
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
			Type:       cashFlowTypeFromProto(t.Type),
			Name:       t.Name,
			Amount:     t.Amount,
			Date:       t.Date,
			Note:       t.Note,
			SortOrder:  int(t.SortOrder),
			CreatedAt:  t.CreatedAt,
			UpdatedAt:  t.UpdatedAt,
		})
	}
	return &model.ListTransactionsResult{
		Transactions: result,
		Total:        int(pbResp.Total),
	}, nil
}

func (s *CashFlowService) CreateTransaction(ctx context.Context, accountID string, req *model.CreateTransactionRequest) (*model.Transaction, error) {
	pbType, err := cashFlowTypeToProto(req.Type)
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
		SortOrder:  int32(req.SortOrder),
	})
	if err != nil {
		return nil, err
	}
	return &model.Transaction{
		ID:         pbResp.Id,
		AccountID:  pbResp.AccountId,
		CategoryID: pbResp.CategoryId,
		Type:       cashFlowTypeFromProto(pbResp.Type),
		Name:       pbResp.Name,
		Amount:     pbResp.Amount,
		Date:       pbResp.Date,
		Note:       pbResp.Note,
		SortOrder:  int(pbResp.SortOrder),
		CreatedAt:  pbResp.CreatedAt,
		UpdatedAt:  pbResp.UpdatedAt,
	}, nil
}

func (s *CashFlowService) UpdateTransaction(ctx context.Context, accountID string, req *model.UpdateTransactionRequest) (*model.Transaction, error) {
	pbType, err := cashFlowTypeToProto(req.Type)
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
		SortOrder:  int32(req.SortOrder),
	})
	if err != nil {
		return nil, err
	}
	return &model.Transaction{
		ID:         pbResp.Id,
		AccountID:  pbResp.AccountId,
		CategoryID: pbResp.CategoryId,
		Type:       cashFlowTypeFromProto(pbResp.Type),
		Name:       pbResp.Name,
		Amount:     pbResp.Amount,
		Date:       pbResp.Date,
		Note:       pbResp.Note,
		SortOrder:  int(pbResp.SortOrder),
		CreatedAt:  pbResp.CreatedAt,
		UpdatedAt:  pbResp.UpdatedAt,
	}, nil
}

func (s *CashFlowService) DeleteTransaction(ctx context.Context, accountID string, id int64) error {
	_, err := s.client.DeleteTransaction(withAccountID(ctx, accountID), &pb.DeleteTransactionRequest{Id: id})
	return err
}
