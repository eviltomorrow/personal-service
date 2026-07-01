package client

import (
	"fmt"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
)

func NewFinanceClient(target string) (pb.FinanceClient, func() error, error) {
	conn, err := dial(target)
	if err != nil {
		return nil, nil, fmt.Errorf("dial finance service failure: %w", err)
	}
	return pb.NewFinanceClient(conn), conn.Close, nil
}
