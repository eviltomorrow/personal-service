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

var portfolioCli model.PortfolioClient

func initPortfolio(cfg *config.Config) error {
	conn, err := grpcclient.Dial(cfg.Service.CoreServiceTarget)
	if err != nil {
		return fmt.Errorf("dial core service failure: %w", err)
	}
	finalizer.RegisterCleanupFuncs(conn.Close)

	pbClient := pb.NewPortfolioClient(conn)
	portfolioCli = service.NewPortfolioService(pbClient)
	return nil
}

func GetPortfolioClient() model.PortfolioClient {
	return portfolioCli
}
