package provider

import (
	"fmt"

	"github.com/eviltomorrow/personal-service/lib/finalizer"
	grpcclient "github.com/eviltomorrow/personal-service/lib/grpc/client"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/service"
	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
)

var profileCli model.ProfileClient

func initProfile(cfg *config.Config) error {
	conn, err := grpcclient.Dial(cfg.Service.CoreServiceTarget)
	if err != nil {
		return fmt.Errorf("dial core service failure: %w", err)
	}
	finalizer.RegisterCleanupFuncs(conn.Close)

	pbClient := pb.NewProfileClient(conn)
	profileCli = service.NewProfileService(pbClient)
	return nil
}

func GetProfileClient() model.ProfileClient {
	return profileCli
}
