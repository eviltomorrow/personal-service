package model

import "context"

type CashFlowType string

const (
	CashFlowTypeIncome  CashFlowType = "income"
	CashFlowTypeExpense CashFlowType = "expense"
)

type Category struct {
	ID        int64        `json:"id"`
	AccountID string       `json:"account_id"`
	Name      string       `json:"name"`
	Type      CashFlowType `json:"type"`
	SortOrder int          `json:"sort_order"`
	Date      string       `json:"date"`
	CreatedAt int64        `json:"created_at"`
	UpdatedAt int64        `json:"updated_at"`
}

type CreateCategoryRequest struct {
	Name      string       `json:"name"`
	Type      CashFlowType `json:"type"`
	SortOrder int          `json:"sort_order"`
	Date      string       `json:"date"`
}

type UpdateCategoryRequest struct {
	ID        int64        `json:"id"`
	Name      string       `json:"name"`
	Type      CashFlowType `json:"type"`
	SortOrder int          `json:"sort_order"`
	Date      string       `json:"date"`
}

type Transaction struct {
	ID         int64        `json:"id"`
	AccountID  string       `json:"account_id"`
	CategoryID int64        `json:"category_id"`
	Type       CashFlowType `json:"type"`
	Name       string       `json:"name"`
	Amount     int64        `json:"amount"`
	Date       string       `json:"date"`
	Note       string       `json:"note"`
	SortOrder  int          `json:"sort_order"`
	CreatedAt  int64        `json:"created_at"`
	UpdatedAt  int64        `json:"updated_at"`
}

type ListTransactionsRequest struct {
	Year       int   `json:"year"`
	Month      int   `json:"month"`
	CategoryID int64 `json:"category_id"`
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
}

type CreateTransactionRequest struct {
	CategoryID int64        `json:"category_id"`
	Type       CashFlowType `json:"type"`
	Name       string       `json:"name"`
	Amount     int64        `json:"amount"`
	Date       string       `json:"date"`
	Note       string       `json:"note"`
	SortOrder  int          `json:"sort_order"`
}

type UpdateTransactionRequest struct {
	ID         int64        `json:"id"`
	CategoryID int64        `json:"category_id"`
	Type       CashFlowType `json:"type"`
	Name       string       `json:"name"`
	Amount     int64        `json:"amount"`
	Date       string       `json:"date"`
	Note       string       `json:"note"`
	SortOrder  int          `json:"sort_order"`
}

type ListTransactionsResult struct {
	Transactions []Transaction `json:"transactions"`
	Total        int           `json:"total"`
}

type CashFlowClient interface {
	ListCategories(ctx context.Context, accountID string, year int, month int) ([]Category, error)
	CreateCategory(ctx context.Context, accountID string, req *CreateCategoryRequest) (*Category, error)
	UpdateCategory(ctx context.Context, accountID string, req *UpdateCategoryRequest) (*Category, error)
	DeleteCategory(ctx context.Context, accountID string, id int64) error

	ListTransactions(ctx context.Context, accountID string, req *ListTransactionsRequest) (*ListTransactionsResult, error)
	CreateTransaction(ctx context.Context, accountID string, req *CreateTransactionRequest) (*Transaction, error)
	UpdateTransaction(ctx context.Context, accountID string, req *UpdateTransactionRequest) (*Transaction, error)
	DeleteTransaction(ctx context.Context, accountID string, id int64) error
}
