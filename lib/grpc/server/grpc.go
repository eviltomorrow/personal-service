package server

import (
	"context"
	"fmt"
	"net"
	"path/filepath"

	"github.com/eviltomorrow/personal-service/lib/buildinfo"
	"github.com/eviltomorrow/personal-service/lib/etcd"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
	"github.com/eviltomorrow/personal-service/lib/grpc/middleware"
	"github.com/eviltomorrow/personal-service/lib/log"
	"github.com/eviltomorrow/personal-service/lib/netutil"
	"github.com/eviltomorrow/personal-service/lib/system"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.opentelemetry.io/contrib/instrumentation/google.golang.org/grpc/otelgrpc"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

type GRPC struct {
	network *netutil.Config
	log     *log.Config

	server     *grpc.Server
	ctx        context.Context
	cancel     func()
	revokeFunc func() error

	RegisteredAPI     []func(*grpc.Server)
	unaryInterceptors []grpc.UnaryServerInterceptor
}

func (g *GRPC) WithUnaryInterceptors(interceptors ...grpc.UnaryServerInterceptor) *GRPC {
	g.unaryInterceptors = append(g.unaryInterceptors, interceptors...)
	return g
}

func NewGRPC(network *netutil.Config, log *log.Config, supported ...func(*grpc.Server)) *GRPC {
	return &GRPC{
		network: network,
		log:     log,

		RegisteredAPI: supported,
	}
}

func (g *GRPC) Serve() error {
	g.ctx, g.cancel = context.WithCancel(context.Background())

	cleanup, err := middleware.InitLogger(&zlog.Config{
		Level:  g.log.Level,
		Format: "json",
		File: zlog.FileLogConfig{
			Filename:    filepath.Join(system.Directory.LogDir(), "access.log"),
			MaxSize:     100,
			MaxDays:     30,
			MaxBackups:  90,
			Compression: "gzip",
		},
		DisableStacktrace: true,
		DisableStdlog:     g.log.DisableStdlog,
	})
	if err != nil {
		return fmt.Errorf("init middleware log failure, nest error: %v", err)
	}
	finalizer.RegisterCleanupFuncs(cleanup)

	listen, err := net.Listen("tcp", net.JoinHostPort(g.network.BindIP, fmt.Sprintf("%d", g.network.BindPort)))
	if err != nil {
		return err
	}

	unaryInterceptors := []grpc.UnaryServerInterceptor{
		middleware.UnaryServerRecoveryInterceptor,
		middleware.UnaryServerLogInterceptor,
	}
	unaryInterceptors = append(unaryInterceptors, g.unaryInterceptors...)

	g.server = grpc.NewServer(
		grpc.ChainUnaryInterceptor(unaryInterceptors...),
		grpc.ChainStreamInterceptor(
			middleware.StreamServerRecoveryInterceptor,
		),
		grpc.StatsHandler(otelgrpc.NewServerHandler()),
	)

	for _, register := range g.RegisteredAPI {
		register(g.server)
	}

	go func() {
		if err := g.server.Serve(listen); err != nil {
			zlog.Fatal("grpc server start failures", zap.Error(err))
		}
	}()

	if etcd.Client != nil {
		g.revokeFunc, err = etcd.RegisterService(g.ctx, buildinfo.AppName, system.Network.AccessIP(), g.network.BindPort, 10)
		if err != nil {
			return err
		}
	}
	return nil
}

func (g *GRPC) Stop() error {
	if g.revokeFunc != nil {
		g.revokeFunc()
	}
	if g.server != nil {
		g.server.GracefulStop()
	}
	if g.cancel != nil {
		g.cancel()
	}

	return nil
}
