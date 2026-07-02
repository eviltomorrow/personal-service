package service

import (
	"context"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
)

type BalanceSheetService struct {
	client pb.BalanceSheetClient
}

func NewBalanceSheetService(client pb.BalanceSheetClient) *BalanceSheetService {
	return &BalanceSheetService{client: client}
}

func (s *BalanceSheetService) ListItems(ctx context.Context, accountID string, year int, month int) ([]model.BalanceSheetItem, error) {
	pbResp, err := s.client.ListItems(withAccountID(ctx, accountID), &pb.ListItemsRequest{
		Year:  int32(year),
		Month: int32(month),
	})
	if err != nil {
		return nil, err
	}
	result := make([]model.BalanceSheetItem, 0, len(pbResp.Items))
	for _, item := range pbResp.Items {
		result = append(result, model.BalanceSheetItem{
			ID:        item.Id,
			AccountID: item.AccountId,
			Section:   int(item.Section),
			Category:  item.Category,
			Name:      item.Name,
			Amount:    item.Amount,
			Note:      item.Note,
			Date:      item.Date,
			SortOrder: int(item.SortOrder),
			CreatedAt: item.CreatedAt,
			UpdatedAt: item.UpdatedAt,
		})
	}
	return result, nil
}

func (s *BalanceSheetService) CreateItem(ctx context.Context, accountID string, req *model.CreateBSItemRequest) (*model.BalanceSheetItem, error) {
	pbResp, err := s.client.CreateItem(withAccountID(ctx, accountID), &pb.CreateItemRequest{
		Category:  req.Category,
		Name:      req.Name,
		Amount:    req.Amount,
		Note:      req.Note,
		Date:      req.Date,
		SortOrder: int32(req.SortOrder),
	})
	if err != nil {
		return nil, err
	}
	return &model.BalanceSheetItem{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Section:   int(pbResp.Section),
		Category:  pbResp.Category,
		Name:      pbResp.Name,
		Amount:    pbResp.Amount,
		Note:      pbResp.Note,
		Date:      pbResp.Date,
		SortOrder: int(pbResp.SortOrder),
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *BalanceSheetService) UpdateItem(ctx context.Context, accountID string, req *model.UpdateBSItemRequest) (*model.BalanceSheetItem, error) {
	pbResp, err := s.client.UpdateItem(withAccountID(ctx, accountID), &pb.UpdateItemRequest{
		Id:        req.ID,
		Category:  req.Category,
		Name:      req.Name,
		Amount:    req.Amount,
		Note:      req.Note,
		Date:      req.Date,
		SortOrder: int32(req.SortOrder),
	})
	if err != nil {
		return nil, err
	}
	return &model.BalanceSheetItem{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Section:   int(pbResp.Section),
		Category:  pbResp.Category,
		Name:      pbResp.Name,
		Amount:    pbResp.Amount,
		Note:      pbResp.Note,
		Date:      pbResp.Date,
		SortOrder: int(pbResp.SortOrder),
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *BalanceSheetService) DeleteItem(ctx context.Context, accountID string, id int64) error {
	_, err := s.client.DeleteItem(withAccountID(ctx, accountID), &pb.DeleteItemRequest{Id: id})
	return err
}
