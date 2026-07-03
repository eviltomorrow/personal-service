package client

import (
	"fmt"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
)

func NewProfileClient(target string) (pb.ProfileClient, func() error, error) {
	conn, err := dial(target)
	if err != nil {
		return nil, nil, fmt.Errorf("dial profile service failure: %w", err)
	}
	return pb.NewProfileClient(conn), conn.Close, nil
}
