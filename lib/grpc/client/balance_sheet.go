package client

import (
	"fmt"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
)

func NewBalanceSheetClient(target string) (pb.BalanceSheetClient, func() error, error) {
	conn, err := dial(target)
	if err != nil {
		return nil, nil, fmt.Errorf("dial balance sheet service failure: %w", err)
	}
	return pb.NewBalanceSheetClient(conn), conn.Close, nil
}
