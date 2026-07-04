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

var cashFlowCli model.CashFlowClient

func initCashFlow(cfg *config.Config) error {
	conn, err := grpcclient.Dial(cfg.Service.CoreServiceTarget)
	if err != nil {
		return fmt.Errorf("dial core service failure: %w", err)
	}
	finalizer.RegisterCleanupFuncs(conn.Close)

	pbCashFlow := pb.NewCashFlowClient(conn)
	cashFlowCli = service.NewCashFlowService(pbCashFlow)
	return nil
}

func GetCashFlowClient() model.CashFlowClient {
	return cashFlowCli
}
