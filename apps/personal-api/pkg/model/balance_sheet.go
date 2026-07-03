package model

import "context"

type BalanceSheetItem struct {
	ID        int64  `json:"id"`
	AccountID string `json:"account_id"`
	Section   int    `json:"section"`
	Category  string `json:"category"`
	Name      string `json:"name"`
	Amount    int64  `json:"amount"`
	Note      string `json:"note"`
	Date      string `json:"date"`
	SortOrder int    `json:"sort_order"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

type CreateBSItemRequest struct {
	Category  string `json:"category"`
	Name      string `json:"name"`
	Amount    int64  `json:"amount"`
	Note      string `json:"note"`
	Date      string `json:"date"`
	SortOrder int    `json:"sort_order"`
}

type UpdateBSItemRequest struct {
	ID        int64  `json:"id"`
	Category  string `json:"category"`
	Name      string `json:"name"`
	Amount    int64  `json:"amount"`
	Note      string `json:"note"`
	Date      string `json:"date"`
	SortOrder int    `json:"sort_order"`
}

type MonthlySummary struct {
	Date             string `json:"date"`
	TotalAssets      int64  `json:"total_assets"`
	TotalLiabilities int64  `json:"total_liabilities"`
	TotalEquity      int64  `json:"total_equity"`
}

type BalanceSheetClient interface {
	ListItems(ctx context.Context, accountID string, year int, month int) ([]BalanceSheetItem, error)
	ListMonthlySummaries(ctx context.Context, accountID string, months int) ([]MonthlySummary, error)
	CreateItem(ctx context.Context, accountID string, req *CreateBSItemRequest) (*BalanceSheetItem, error)
	UpdateItem(ctx context.Context, accountID string, req *UpdateBSItemRequest) (*BalanceSheetItem, error)
	DeleteItem(ctx context.Context, accountID string, id int64) error
}
