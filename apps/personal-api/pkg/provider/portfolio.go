package provider

import (
	grpcclient "github.com/eviltomorrow/personal-service/lib/grpc/client"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/service"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
)

var portfolioCli model.PortfolioClient

func initPortfolio(cfg *config.Config) error {
	pbClient, cleanup, err := grpcclient.NewPortfolioClient(cfg.Service.CoreServiceTarget)
	if err != nil {
		return err
	}
	finalizer.RegisterCleanupFuncs(cleanup)
	portfolioCli = service.NewPortfolioService(pbClient)
	return nil
}

func GetPortfolioClient() model.PortfolioClient {
	return portfolioCli
}
