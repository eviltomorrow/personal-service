package provider

import (
	grpcclient "github.com/eviltomorrow/personal-service/lib/grpc/client"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/service"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
)

var financeCli model.FinanceClient

func initFinance(cfg *config.Config) error {
	pbFinance, cleanup, err := grpcclient.NewFinanceClient(cfg.Service.CoreServiceTarget)
	if err != nil {
		return err
	}
	finalizer.RegisterCleanupFuncs(cleanup)
	financeCli = service.NewFinanceService(pbFinance)
	return nil
}

func GetFinanceClient() model.FinanceClient {
	return financeCli
}
