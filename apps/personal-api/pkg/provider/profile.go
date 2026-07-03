package provider

import (
	grpcclient "github.com/eviltomorrow/personal-service/lib/grpc/client"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/service"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
)

var profileCli model.ProfileClient

func initProfile(cfg *config.Config) error {
	pbClient, cleanup, err := grpcclient.NewProfileClient(cfg.Service.CoreServiceTarget)
	if err != nil {
		return err
	}
	finalizer.RegisterCleanupFuncs(cleanup)
	profileCli = service.NewProfileService(pbClient)
	return nil
}

func GetProfileClient() model.ProfileClient {
	return profileCli
}
