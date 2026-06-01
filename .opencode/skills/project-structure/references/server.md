
# gRPC Service Server 模板

基于 `apps/personal-auth/pkg/server/server.go` 提取，适用于 gRPC 微服务。

## 完整代码

```go
package server

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

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
	"google.golang.org/grpc/resolver"

	pb "github.com/eviltomorrow/personal-service/apps/<name>/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/<name>/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/<name>/pkg/service"
	"github.com/eviltomorrow/personal-service/apps/<name>/scripts"
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
	// 1. 将嵌入式 SQL 脚本写入磁盘
	if err := fsutil.WriteEmbedFSToDisk(scripts.FS, system.Directory.UsrDir()); err != nil {
		return nil, fmt.Errorf("write embedded scripts to disk failure: %w", err)
	}

	// 2. schema 迁移
	if err := initSchema(&cfg.MySQL); err != nil {
		return nil, fmt.Errorf("init schema failure: %w", err)
	}

	// 3. 基础设施组件初始化（顺序重要）
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

	// 4. gRPC resolver
	resolver.Register(lb.NewBuilder(etcd.Client))

	// 5. 业务 service 初始化
	srv1, err := service.NewXxx(cfg)
	if err != nil {
		return nil, fmt.Errorf("init xxx service failure: %w", err)
	}

	// 6. 创建 gRPC server + 注册 service
	grpc := grpcserver.NewGRPC(
		&cfg.Network,
		&cfg.Log,
		func(s *grpc.Server) {
			pb.RegisterXxxServer(s, srv1)
		},
	)

	return &Server{GRPC: grpc}, nil
}
```

## 初始化顺序

1. 嵌入式 SQL 写入磁盘
2. schema 迁移（DDL）
3. 基础设施：mysql → redis → etcd → opentrace
4. gRPC resolver
5. 业务 service
6. gRPC server + protobuf 注册

## 关键约束

- **基础设施必须在业务 service 之前初始化**
- **etcd 必须在 gRPC resolver 之前初始化**
- **cleanup 通过 `finalizer.RegisterCleanupFuncs` 注册**，进程退出时 LIFO 执行
- **启动时所有依赖必须可达**，无优雅降级
- **`sqlutil.Migrate`** 接受 SQL 目录路径而非 SQL 字符串，使用 `fsutil.WriteEmbedFSToDisk` 先将嵌入式文件写入 `UsrDir()`
