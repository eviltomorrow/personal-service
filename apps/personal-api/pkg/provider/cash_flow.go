package provider

import (
	grpcclient "github.com/eviltomorrow/personal-service/lib/grpc/client"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/service"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
)

var cashFlowCli model.CashFlowClient

func initCashFlow(cfg *config.Config) error {
	pbCashFlow, cleanup, err := grpcclient.NewCashFlowClient(cfg.Service.CoreServiceTarget)
	if err != nil {
		return err
	}
	finalizer.RegisterCleanupFuncs(cleanup)
	cashFlowCli = service.NewCashFlowService(pbCashFlow)
	return nil
}

func GetCashFlowClient() model.CashFlowClient {
	return cashFlowCli
}
