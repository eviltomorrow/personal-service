package provider

import (
	grpcclient "github.com/eviltomorrow/personal-service/lib/grpc/client"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/service"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
)

var balanceSheetCli model.BalanceSheetClient

func initBalanceSheet(cfg *config.Config) error {
	pbClient, cleanup, err := grpcclient.NewBalanceSheetClient(cfg.Service.CoreServiceTarget)
	if err != nil {
		return err
	}
	finalizer.RegisterCleanupFuncs(cleanup)
	balanceSheetCli = service.NewBalanceSheetService(pbClient)
	return nil
}

func GetBalanceSheetClient() model.BalanceSheetClient {
	return balanceSheetCli
}
