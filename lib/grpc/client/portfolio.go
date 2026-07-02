package client

import (
	"fmt"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
)

func NewPortfolioClient(target string) (pb.PortfolioClient, func() error, error) {
	conn, err := dial(target)
	if err != nil {
		return nil, nil, fmt.Errorf("dial portfolio service failure: %w", err)
	}
	return pb.NewPortfolioClient(conn), conn.Close, nil
}
