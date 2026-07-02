package server

import (
	"fmt"

	"github.com/eviltomorrow/personal-service/lib/auth"
	httpserver "github.com/eviltomorrow/personal-service/lib/http/server"
	"google.golang.org/grpc/resolver"

	"github.com/eviltomorrow/personal-service/lib/etcd"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
	lb "github.com/eviltomorrow/personal-service/lib/grpc/lb"
	"github.com/eviltomorrow/personal-service/lib/opentrace"
	"github.com/eviltomorrow/personal-service/lib/zlog"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/handler"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/provider"
)

type Server struct {
	*httpserver.HTTP
}

func initEtcd(c *etcd.Config) error {
	closeFunc, err := etcd.InitEtcd(c)
	if err != nil {
		return err
	}
	finalizer.RegisterCleanupFuncs(closeFunc)
	return nil
}

func initComponent(name string, fn func() (func() error, error)) error {
	close, err := fn()
	if err != nil {
		return fmt.Errorf("init %s failure: %w", name, err)
	}
	if close != nil {
		finalizer.RegisterCleanupFuncs(close)
	}
	zlog.Info(fmt.Sprintf("%s initialized", name))
	return nil
}

func New(cfg *config.Config) (*Server, error) {
	auth.SigningKey = []byte(cfg.Service.SigningKey)

	if err := initEtcd(&cfg.Etcd); err != nil {
		return nil, fmt.Errorf("init etcd failure: %w", err)
	}
	if err := initComponent("opentrace", func() (func() error, error) {
		if !cfg.Opentrace.Enable {
			return nil, nil
		}
		return opentrace.InitTraceProvider(&cfg.Opentrace)
	}); err != nil {
		return nil, err
	}

	resolver.Register(lb.NewBuilder(etcd.Client))

	if err := provider.Init(cfg); err != nil {
		return nil, err
	}

	deps := &handler.Dependencies{
		AuthClient:         provider.GetAuthClient(),
		CashFlowClient:     provider.GetCashFlowClient(),
		BalanceSheetClient: provider.GetBalanceSheetClient(),
	}

	refresher := provider.NewTokenRefresher(deps.AuthClient)

	httpSrv := httpserver.NewHTTP(
		&cfg.Network,
		&cfg.Log,
		refresher,
		handler.SetupRoutes(deps, "/api/v1"),
	)

	return &Server{HTTP: httpSrv}, nil
}
