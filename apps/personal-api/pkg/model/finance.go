package model

import "context"

type FinanceType string

const (
	FinanceTypeIncome  FinanceType = "income"
	FinanceTypeExpense FinanceType = "expense"
)

type Category struct {
	ID        int64       `json:"id"`
	AccountID string      `json:"account_id"`
	Name      string      `json:"name"`
	Type      FinanceType `json:"type"`
	SortOrder int         `json:"sort_order"`
	CreatedAt int64       `json:"created_at"`
	UpdatedAt int64       `json:"updated_at"`
}

type CreateCategoryRequest struct {
	Name      string      `json:"name"`
	Type      FinanceType `json:"type"`
	SortOrder int         `json:"sort_order"`
}

type UpdateCategoryRequest struct {
	ID        int64       `json:"id"`
	Name      string      `json:"name"`
	Type      FinanceType `json:"type"`
	SortOrder int         `json:"sort_order"`
}

type Transaction struct {
	ID         int64       `json:"id"`
	AccountID  string      `json:"account_id"`
	CategoryID int64       `json:"category_id"`
	Type       FinanceType `json:"type"`
	Name       string      `json:"name"`
	Amount     float64     `json:"amount"`
	Date       string      `json:"date"`
	Note       string      `json:"note"`
	CreatedAt  int64       `json:"created_at"`
	UpdatedAt  int64       `json:"updated_at"`
}

type ListTransactionsRequest struct {
	Year       int   `json:"year"`
	Month      int   `json:"month"`
	CategoryID int64 `json:"category_id"`
	Page       int   `json:"page"`
	PageSize   int   `json:"page_size"`
}

type CreateTransactionRequest struct {
	CategoryID int64       `json:"category_id"`
	Type       FinanceType `json:"type"`
	Name       string      `json:"name"`
	Amount     float64     `json:"amount"`
	Date       string      `json:"date"`
	Note       string      `json:"note"`
}

type UpdateTransactionRequest struct {
	ID         int64       `json:"id"`
	CategoryID int64       `json:"category_id"`
	Type       FinanceType `json:"type"`
	Name       string      `json:"name"`
	Amount     float64     `json:"amount"`
	Date       string      `json:"date"`
	Note       string      `json:"note"`
}

type CategorySummary struct {
	CategoryID   int64   `json:"category_id"`
	CategoryName string  `json:"category_name"`
	TotalAmount  float64 `json:"total_amount"`
}

type MonthlySummary struct {
	TotalIncome       float64           `json:"total_income"`
	TotalExpense      float64           `json:"total_expense"`
	NetBalance        float64           `json:"net_balance"`
	CategorySummaries []CategorySummary `json:"category_summaries"`
}

type ListTransactionsResult struct {
	Transactions []Transaction `json:"transactions"`
	Total        int           `json:"total"`
}

type FinanceClient interface {
	ListCategories(ctx context.Context, accountID string) ([]Category, error)
	CreateCategory(ctx context.Context, accountID string, req *CreateCategoryRequest) (*Category, error)
	UpdateCategory(ctx context.Context, accountID string, req *UpdateCategoryRequest) (*Category, error)
	DeleteCategory(ctx context.Context, accountID string, id int64) error

	ListTransactions(ctx context.Context, accountID string, req *ListTransactionsRequest) (*ListTransactionsResult, error)
	CreateTransaction(ctx context.Context, accountID string, req *CreateTransactionRequest) (*Transaction, error)
	UpdateTransaction(ctx context.Context, accountID string, req *UpdateTransactionRequest) (*Transaction, error)
	DeleteTransaction(ctx context.Context, accountID string, id int64) error

	GetMonthlySummary(ctx context.Context, accountID string, year, month int) (*MonthlySummary, error)
}
