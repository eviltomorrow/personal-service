package client

import (
	"fmt"

	pb "github.com/eviltomorrow/personal-service/apps/personal-auth/adapter/pb"
)

func NewAuthClient(target string) (pb.AuthClient, func() error, error) {
	conn, err := dial(target)
	if err != nil {
		return nil, nil, fmt.Errorf("dial auth service failure: %w", err)
	}
	return pb.NewAuthClient(conn), conn.Close, nil
}
