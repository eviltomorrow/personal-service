package client

import (
	"fmt"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
)

func NewCashFlowClient(target string) (pb.CashFlowClient, func() error, error) {
	conn, err := dial(target)
	if err != nil {
		return nil, nil, fmt.Errorf("dial cash flow service failure: %w", err)
	}
	return pb.NewCashFlowClient(conn), conn.Close, nil
}
