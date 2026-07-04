package provider

import (
	"fmt"

	"github.com/eviltomorrow/personal-service/lib/finalizer"
	grpcclient "github.com/eviltomorrow/personal-service/lib/grpc/client"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/service"
	pb "github.com/eviltomorrow/personal-service/apps/personal-auth/adapter/pb"
)

var authCli model.AuthClient

func initAuth(cfg *config.Config) error {
	conn, err := grpcclient.Dial(cfg.Service.AuthServiceTarget)
	if err != nil {
		return fmt.Errorf("dial auth service failure: %w", err)
	}
	finalizer.RegisterCleanupFuncs(conn.Close)

	pbAuth := pb.NewAuthClient(conn)
	authCli = service.NewAuthService(pbAuth)
	return nil
}

func GetAuthClient() model.AuthClient {
	return authCli
}
