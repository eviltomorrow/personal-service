package server

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	"github.com/eviltomorrow/personal-service/lib/auth"
	"github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/etcd"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
	"github.com/eviltomorrow/personal-service/lib/fsutil"
	lb "github.com/eviltomorrow/personal-service/lib/grpc/lb"
	grpcserver "github.com/eviltomorrow/personal-service/lib/grpc/server"
	"github.com/eviltomorrow/personal-service/lib/opentrace"
	"github.com/eviltomorrow/personal-service/lib/redis"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
	"github.com/eviltomorrow/personal-service/lib/system"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/resolver"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/personal-core/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-core/pkg/service"
	"github.com/eviltomorrow/personal-service/apps/personal-core/scripts"
)

type Server struct {
	*grpcserver.GRPC
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

func initSchema(c *mysql.Config) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	if err := sqlutil.Migrate(ctx, c.DSN, filepath.Join(system.Directory.UsrDir(), "init-sql")); err != nil {
		return fmt.Errorf("migrate schema failure: %w", err)
	}
	zlog.Info("database schema initialized")
	return nil
}

func New(cfg *config.Config) (*Server, error) {
	if err := fsutil.WriteEmbedFSToDisk(scripts.FS, system.Directory.UsrDir()); err != nil {
		return nil, fmt.Errorf("write embedded scripts to disk failure: %w", err)
	}

	if err := initSchema(&cfg.MySQL); err != nil {
		return nil, fmt.Errorf("init schema failure: %w", err)
	}

	if err := initComponent("mysql", func() (func() error, error) { return mysql.InitMySQL(&cfg.MySQL) }); err != nil {
		return nil, err
	}
	if err := initComponent("redis", func() (func() error, error) { return redis.InitRedis(&cfg.Redis) }); err != nil {
		return nil, err
	}
	if err := initComponent("etcd", func() (func() error, error) { return etcd.InitEtcd(&cfg.Etcd) }); err != nil {
		return nil, err
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

	cashFlowSrv := service.NewCashFlow()
	balanceSheetSrv := service.NewBalanceSheet()
	portfolioSrv := service.NewPortfolio()

	grpc := grpcserver.NewGRPC(
		&cfg.Network,
		&cfg.Log,
		func(s *grpc.Server) {
			pb.RegisterCashFlowServer(s, cashFlowSrv)
			pb.RegisterBalanceSheetServer(s, balanceSheetSrv)
			pb.RegisterPortfolioServer(s, portfolioSrv)
		},
	).WithUnaryInterceptors(func(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (interface{}, error) {
		if md, ok := metadata.FromIncomingContext(ctx); ok {
			if vals := md.Get("account_id"); len(vals) > 0 && vals[0] != "" {
				ctx = auth.WithAccountID(ctx, vals[0])
			}
		}
		return handler(ctx, req)
	})

	return &Server{GRPC: grpc}, nil
}
