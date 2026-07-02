package service

import (
	"context"
	"errors"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	"github.com/eviltomorrow/personal-service/lib/auth"
	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.uber.org/zap"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/personal-core/pkg/model"
)

var (
	insertCategory               = model.InsertCategory
	selectCategoriesByAcctID     = model.SelectCategoriesByAccountID
	selectCategoriesByAcctIDDate = model.SelectCategoriesByAccountIDAndDate
	selectCategoryByID           = model.SelectCategoryByID
	updateCategoryByID           = model.UpdateCategoryByID
	softDeleteCategoryByID       = model.SoftDeleteCategoryByID

	insertTransaction             = model.InsertTransaction
	selectTransactions            = model.SelectTransactions
	selectTransactionByID         = model.SelectTransactionByID
	updateTransactionByID         = model.UpdateTransactionByID
	softDeleteTransactionByID     = model.SoftDeleteTransactionByID
	softDeleteTransactionsByCatID = model.SoftDeleteTransactionsByCategoryID
)

var selectDB = func(ctx context.Context) dbmysql.Exec {
	return dbmysql.DB
}

func accountIDFromCtx(ctx context.Context) (string, error) {
	id, ok := auth.AccountIDFromContext(ctx)
	if !ok || id == "" {
		return "", status.Error(codes.Unauthenticated, "missing account_id")
	}
	return id, nil
}

type CashFlow struct {
	pb.UnimplementedCashFlowServer
}

func NewCashFlow() *CashFlow {
	return &CashFlow{}
}

func now() int64 {
	return time.Now().Unix()
}

// --- Categories ---

func (s *CashFlow) ListCategories(ctx context.Context, req *pb.ListCategoriesRequest) (*pb.ListCategoriesResponse, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	cats, err := selectCategoriesByAcctID(ctx, selectDB(ctx), accountID)
	if err != nil {
		zlog.Error("list categories failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	result := make([]*pb.Category, 0, len(cats))
	for _, c := range cats {
		result = append(result, &pb.Category{
			Id:        c.ID,
			AccountId: c.AccountID,
			Name:      c.Name,
			Type:      pb.CashFlowType(c.Type),
			SortOrder: int32(c.SortOrder),
			Date:      c.Date,
			CreatedAt: c.CreatedAt,
			UpdatedAt: c.UpdatedAt,
		})
	}
	return &pb.ListCategoriesResponse{Categories: result}, nil
}

func (s *CashFlow) CreateCategory(ctx context.Context, req *pb.CreateCategoryRequest) (*pb.Category, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "name is required")
	}
	if len(req.Name) > 64 {
		return nil, status.Error(codes.InvalidArgument, "name too long")
	}
	if req.Type != pb.CashFlowType_CASH_FLOW_TYPE_INCOME && req.Type != pb.CashFlowType_CASH_FLOW_TYPE_EXPENSE {
		return nil, status.Error(codes.InvalidArgument, "invalid type")
	}
	if req.Date == "" {
		return nil, status.Error(codes.InvalidArgument, "date is required")
	}

	n := now()
	c := &model.Category{
		AccountID: accountID,
		Name:      req.Name,
		Type:      int(req.Type),
		SortOrder: int(req.SortOrder),
		Date:      req.Date,
		DeletedAt: 0,
		CreatedAt: n,
		UpdatedAt: n,
	}
	id, err := insertCategory(ctx, selectDB(ctx), c)
	if err != nil {
		zlog.Error("create category failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	c.ID = id
	return &pb.Category{
		Id:        c.ID,
		AccountId: c.AccountID,
		Name:      c.Name,
		Type:      pb.CashFlowType(c.Type),
		SortOrder: int32(c.SortOrder),
		Date:      c.Date,
		CreatedAt: c.CreatedAt,
		UpdatedAt: c.UpdatedAt,
	}, nil
}

func (s *CashFlow) UpdateCategory(ctx context.Context, req *pb.UpdateCategoryRequest) (*pb.Category, error) {
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
	if len(req.Name) > 64 {
		return nil, status.Error(codes.InvalidArgument, "name too long")
	}
	if req.Type != pb.CashFlowType_CASH_FLOW_TYPE_INCOME && req.Type != pb.CashFlowType_CASH_FLOW_TYPE_EXPENSE {
		return nil, status.Error(codes.InvalidArgument, "invalid type")
	}

	existing, err := selectCategoryByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "category not found")
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return nil, status.Error(codes.NotFound, "category not found")
	}

	n := now()
	updates := map[string]interface{}{
		model.FieldCategoryName:      req.Name,
		model.FieldCategoryType:      int(req.Type),
		model.FieldCategorySortOrder: int(req.SortOrder),
		model.FieldCategoryUpdatedAt: n,
	}
	if req.Date != "" {
		updates[model.FieldCategoryDate] = req.Date
	}
	_, err = updateCategoryByID(ctx, selectDB(ctx), req.Id, updates)
	if err != nil {
		zlog.Error("update category failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	existing.Name = req.Name
	existing.Type = int(req.Type)
	existing.SortOrder = int(req.SortOrder)
	existing.UpdatedAt = n
	if req.Date != "" {
		existing.Date = req.Date
	}
	return &pb.Category{
		Id:        existing.ID,
		AccountId: existing.AccountID,
		Name:      existing.Name,
		Type:      pb.CashFlowType(existing.Type),
		SortOrder: int32(existing.SortOrder),
		Date:      existing.Date,
		CreatedAt: existing.CreatedAt,
		UpdatedAt: existing.UpdatedAt,
	}, nil
}

func (s *CashFlow) DeleteCategory(ctx context.Context, req *pb.DeleteCategoryRequest) (*emptypb.Empty, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	existing, err := selectCategoryByID(ctx, selectDB(ctx), req.Id)
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
	_, err = softDeleteCategoryByID(ctx, selectDB(ctx), req.Id, n)
	if err != nil {
		zlog.Error("delete category failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	_, err = softDeleteTransactionsByCatID(ctx, selectDB(ctx), accountID, req.Id, n)
	if err != nil {
		zlog.Error("delete category transactions failure", zap.Error(err))
	}

	return &emptypb.Empty{}, nil
}

// --- Transactions ---

func (s *CashFlow) ListTransactions(ctx context.Context, req *pb.ListTransactionsRequest) (*pb.ListTransactionsResponse, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	filter := &model.TransactionFilter{
		AccountID:  accountID,
		Year:       int(req.Year),
		Month:      int(req.Month),
		CategoryID: req.CategoryId,
		Page:       int(req.Page),
		PageSize:   int(req.PageSize),
	}
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 0
	}

	list, total, err := selectTransactions(ctx, selectDB(ctx), filter)
	if err != nil {
		zlog.Error("list transactions failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	result := make([]*pb.Transaction, 0, len(list))
	for _, t := range list {
		result = append(result, &pb.Transaction{
			Id:         t.ID,
			AccountId:  t.AccountID,
			CategoryId: t.CategoryID,
			Type:       pb.CashFlowType(t.Type),
			Name:       t.Name,
			Amount:     t.Amount,
			Date:       t.Date,
			Note:       t.Note,
			SortOrder:  int32(t.SortOrder),
			CreatedAt:  t.CreatedAt,
			UpdatedAt:  t.UpdatedAt,
		})
	}
	return &pb.ListTransactionsResponse{Transactions: result, Total: int32(total)}, nil
}

func (s *CashFlow) CreateTransaction(ctx context.Context, req *pb.CreateTransactionRequest) (*pb.Transaction, error) {
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
	if req.Type != pb.CashFlowType_CASH_FLOW_TYPE_INCOME && req.Type != pb.CashFlowType_CASH_FLOW_TYPE_EXPENSE {
		return nil, status.Error(codes.InvalidArgument, "invalid type")
	}

	n := now()
	t := &model.Transaction{
		AccountID:  accountID,
		CategoryID: req.CategoryId,
		Type:       int(req.Type),
		Name:       req.Name,
		Amount:     req.Amount,
		Date:       req.Date,
		Note:       req.Note,
		SortOrder:  int(req.SortOrder),
		DeletedAt:  0,
		CreatedAt:  n,
		UpdatedAt:  n,
	}
	id, err := insertTransaction(ctx, selectDB(ctx), t)
	if err != nil {
		zlog.Error("create transaction failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	t.ID = id
	return &pb.Transaction{
		Id:         t.ID,
		AccountId:  t.AccountID,
		CategoryId: t.CategoryID,
		Type:       pb.CashFlowType(t.Type),
		Name:       t.Name,
		Amount:     t.Amount,
		Date:       t.Date,
		Note:       t.Note,
		SortOrder:  int32(t.SortOrder),
		CreatedAt:  t.CreatedAt,
		UpdatedAt:  t.UpdatedAt,
	}, nil
}

func (s *CashFlow) UpdateTransaction(ctx context.Context, req *pb.UpdateTransactionRequest) (*pb.Transaction, error) {
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
	if req.Type != pb.CashFlowType_CASH_FLOW_TYPE_INCOME && req.Type != pb.CashFlowType_CASH_FLOW_TYPE_EXPENSE {
		return nil, status.Error(codes.InvalidArgument, "invalid type")
	}

	existing, err := selectTransactionByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return nil, status.Error(codes.NotFound, "transaction not found")
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return nil, status.Error(codes.NotFound, "transaction not found")
	}

	n := now()
	_, err = updateTransactionByID(ctx, selectDB(ctx), req.Id, map[string]interface{}{
		model.FieldTransactionCategoryID: req.CategoryId,
		model.FieldTransactionType:       int(req.Type),
		model.FieldTransactionName:       req.Name,
		model.FieldTransactionAmount:     float64(req.Amount) / 100.0,
		model.FieldTransactionDate:       req.Date,
		model.FieldTransactionNote:       req.Note,
		model.FieldTransactionSortOrder:  int(req.SortOrder),
		model.FieldTransactionUpdatedAt:  n,
	})
	if err != nil {
		zlog.Error("update transaction failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	return &pb.Transaction{
		Id:         existing.ID,
		AccountId:  existing.AccountID,
		CategoryId: req.CategoryId,
		Type:       pb.CashFlowType(existing.Type),
		Name:       req.Name,
		Amount:     req.Amount,
		Date:       req.Date,
		Note:       req.Note,
		SortOrder:  int32(req.SortOrder),
		CreatedAt:  existing.CreatedAt,
		UpdatedAt:  n,
	}, nil
}

func (s *CashFlow) DeleteTransaction(ctx context.Context, req *pb.DeleteTransactionRequest) (*emptypb.Empty, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	existing, err := selectTransactionByID(ctx, selectDB(ctx), req.Id)
	if err != nil {
		if errors.Is(err, model.ErrNotFound) {
			return &emptypb.Empty{}, nil
		}
		return nil, status.Error(codes.Internal, "internal server error")
	}
	if existing.AccountID != accountID {
		return &emptypb.Empty{}, nil
	}

	_, err = softDeleteTransactionByID(ctx, selectDB(ctx), req.Id, now())
	if err != nil {
		zlog.Error("delete transaction failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}
	return &emptypb.Empty{}, nil
}
