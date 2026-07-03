package model

import "context"

type Position struct {
	ID           int64  `json:"id"`
	AccountID    string `json:"account_id"`
	Code         string `json:"code"`
	Name         string `json:"name"`
	Type         int    `json:"type"`
	Direction    string `json:"direction"`
	InitialQty   int    `json:"initial_qty"`
	CurrentPrice int64  `json:"current_price"`
	MarginRatio  int    `json:"margin_ratio"`
	SortOrder    int    `json:"sort_order"`
	Archived     bool   `json:"archived"`
	ClosedPnl    int64  `json:"closed_pnl"`
	CreatedAt    int64  `json:"created_at"`
	UpdatedAt    int64  `json:"updated_at"`
}

type Trade struct {
	ID         int64  `json:"id"`
	AccountID  string `json:"account_id"`
	PositionID int64  `json:"position_id"`
	Type       int    `json:"type"`
	Date       string `json:"date"`
	Price      int64  `json:"price"`
	Quantity   int    `json:"quantity"`
	Fee        int64  `json:"fee"`
	Note       string `json:"note"`
	CreatedAt  int64  `json:"created_at"`
	UpdatedAt  int64  `json:"updated_at"`
}

type ValueSnapshot struct {
	Date       string `json:"date"`
	TotalValue int64  `json:"total_value"`
}

type PortfolioConfig struct {
	TotalCapital int64 `json:"total_capital"`
}

type CreatePositionRequest struct {
	Code         string `json:"code"`
	Name         string `json:"name"`
	Type         int    `json:"type"`
	Direction    string `json:"direction"`
	InitialQty   int    `json:"initial_qty"`
	CurrentPrice int64  `json:"current_price"`
	MarginRatio  int    `json:"margin_ratio"`
	SortOrder    int    `json:"sort_order"`
}

type UpdatePositionRequest struct {
	ID           int64  `json:"id"`
	Code         string `json:"code"`
	Name         string `json:"name"`
	Type         int    `json:"type"`
	Direction    string `json:"direction"`
	InitialQty   int    `json:"initial_qty"`
	CurrentPrice int64  `json:"current_price"`
	MarginRatio  int    `json:"margin_ratio"`
	SortOrder    int    `json:"sort_order"`
	Archived     bool   `json:"archived"`
	ClosedPnl    int64  `json:"closed_pnl"`
}

type CreateTradeRequest struct {
	PositionID int64  `json:"position_id"`
	Type       int    `json:"type"`
	Date       string `json:"date"`
	Price      int64  `json:"price"`
	Quantity   int    `json:"quantity"`
	Fee        int64  `json:"fee"`
	Note       string `json:"note"`
}

type UpdateTradeRequest struct {
	ID       int64  `json:"id"`
	Type     int    `json:"type"`
	Date     string `json:"date"`
	Price    int64  `json:"price"`
	Quantity int    `json:"quantity"`
	Fee      int64  `json:"fee"`
	Note     string `json:"note"`
}

type UpsertSnapshotRequest struct {
	Date       string `json:"date"`
	TotalValue int64  `json:"total_value"`
}

type PortfolioClient interface {
	ListPositions(ctx context.Context, accountID string) ([]Position, error)
	CreatePosition(ctx context.Context, accountID string, req *CreatePositionRequest) (*Position, error)
	UpdatePosition(ctx context.Context, accountID string, req *UpdatePositionRequest) (*Position, error)
	DeletePosition(ctx context.Context, accountID string, id int64) error

	ListTrades(ctx context.Context, accountID string, positionID int64) ([]Trade, error)
	CreateTrade(ctx context.Context, accountID string, req *CreateTradeRequest) (*Trade, error)
	UpdateTrade(ctx context.Context, accountID string, req *UpdateTradeRequest) (*Trade, error)
	DeleteTrade(ctx context.Context, accountID string, id int64) error

	ListSnapshots(ctx context.Context, accountID string) ([]ValueSnapshot, error)
	UpsertSnapshot(ctx context.Context, accountID string, req *UpsertSnapshotRequest) (*ValueSnapshot, error)

	GetConfig(ctx context.Context, accountID string) (*PortfolioConfig, error)
	UpdateConfig(ctx context.Context, accountID string, totalCapital int64) (*PortfolioConfig, error)
}
