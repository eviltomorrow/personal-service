# gRPC Service Server 模板

基于 `apps/personal-auth/pkg/server/server.go` 提取，适用于 gRPC 微服务。

## 完整代码

```go
package server

import (
	"context"
	"fmt"
	"time"

	"github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/etcd"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
	lb "github.com/eviltomorrow/personal-service/lib/grpc/lb"
	grpcserver "github.com/eviltomorrow/personal-service/lib/grpc/server"
	"github.com/eviltomorrow/personal-service/lib/opentrace"
	"github.com/eviltomorrow/personal-service/lib/redis"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"google.golang.org/grpc"
	"google.golang.org/grpc/resolver"

	pb "github.com/eviltomorrow/personal-service/apps/<name>/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/<name>/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/<name>/pkg/service"
)

type Server struct {
	*grpcserver.GRPC
}

// initComponent 通用组件初始化：执行 fn → 注册 cleanup → 日志
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

// initSchema 数据库 schema 迁移（可选）
func initSchema(c *mysql.Config, schemaData string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := sqlutil.MigrateData(ctx, c.DSN, []byte(schemaData)); err != nil {
		return fmt.Errorf("migrate schema failure: %w", err)
	}
	zlog.Info("database schema initialized")
	return nil
}

func New(cfg *config.Config, schemaData string) (*Server, error) {
	// 1. 可选：schema 迁移
	if schemaData != "" {
		if err := initSchema(&cfg.MySQL, schemaData); err != nil {
			return nil, fmt.Errorf("init schema failure: %w", err)
		}
	}

	// 2. 基础设施组件初始化（顺序重要）
	//   每个组件必须提供 func() (func() error, error) 签名：
	//   - func() error 是 cleanup 函数（可为 nil）
	//   - error 是初始化错误
	if err := initComponent("mysql", func() (func() error, error) { return mysql.InitMySQL(&cfg.MySQL) }); err != nil {
		return nil, err
	}
	if err := initComponent("redis", func() (func() error, error) { return redis.InitRedis(&cfg.Redis) }); err != nil {
		return nil, err
	}
	if err := initComponent("etcd", func() (func() error, error) { return etcd.InitEtcd(&cfg.Etcd) }); err != nil {
		return nil, err
	}
	if err := initComponent("opentrace", func() (func() error, error) { return opentrace.InitTraceProvider(&cfg.Opentrace) }); err != nil {
		return nil, err
	}

	// 3. gRPC resolver
	resolver.Register(lb.NewBuilder(etcd.Client))

	// 4. 业务 service 初始化
	srv1, err := service.NewXxx(cfg)
	if err != nil {
		return nil, fmt.Errorf("init xxx service failure: %w", err)
	}
	srv2, err := service.NewYyy(cfg)
	if err != nil {
		return nil, fmt.Errorf("init yyy service failure: %w", err)
	}

	// 5. 创建 gRPC server + 注册 service
	grpc := grpcserver.NewGRPC(
		&cfg.Network,
		&cfg.Log,
		func(s *grpc.Server) {
			pb.RegisterXxxServer(s, srv1)
			pb.RegisterYyyServer(s, srv2)
		},
	)

	return &Server{GRPC: grpc}, nil
}
```

## 初始化顺序

1. schema 迁移（可选，仅首次部署需要）
2. 基础设施：mysql → redis → etcd → opentrace
3. gRPC resolver
4. 业务 service
5. gRPC server + protobuf 注册

## 关键约束

- **基础设施必须在业务 service 之前初始化**
- **etcd 必须在 gRPC resolver 之前初始化**
- **cleanup 通过 `finalizer.RegisterCleanupFuncs` 注册**，进程退出时 LIFO 执行
- **启动时所有依赖必须可达**，无优雅降级
