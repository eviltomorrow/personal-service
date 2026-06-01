package provider

import (
	"github.com/eviltomorrow/personal-service/lib/finalizer"
	grpcclient "github.com/eviltomorrow/personal-service/lib/grpc/client"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/service"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
)

var authCli model.AuthClient

func initAuth(cfg *config.Config) error {
	pbAuth, cleanup, err := grpcclient.NewAuthClient(cfg.Service.AuthServiceTarget)
	if err != nil {
		return err
	}
	finalizer.RegisterCleanupFuncs(cleanup)
	authCli = service.NewAuthService(pbAuth)
	return nil
}

func GetAuthClient() model.AuthClient {
	return authCli
}
