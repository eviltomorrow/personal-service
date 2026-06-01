
# CMD（入口）模板

基于 `apps/personal-auth/cmd/root.go` 提取，适用于微服务的 main 入口流程。

## 完整代码

```go
package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/eviltomorrow/personal-service/lib/buildinfo"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
	"github.com/eviltomorrow/personal-service/lib/flagsutil"
	"github.com/eviltomorrow/personal-service/lib/pprofutil"
	"github.com/eviltomorrow/personal-service/lib/procutil"
	"github.com/eviltomorrow/personal-service/lib/system"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.uber.org/zap"

	appconfig "github.com/eviltomorrow/personal-service/apps/<name>/pkg/config"
	appserver "github.com/eviltomorrow/personal-service/apps/<name>/pkg/server"
)

func Run() error {
	// 1. 解析 CLI 参数
	if _, err := flagsutil.Parse(flagsutil.Opts); err != nil {
		return err
	}

	// 2. --version 快速退出
	if flagsutil.Opts.Version {
		fmt.Println(buildinfo.Version())
		return nil
	}

	// 3. 守护进程模式
	if flagsutil.Opts.Daemon {
		if err := procutil.RunAppInBackground(os.Args); err != nil {
			return fmt.Errorf("run daemon failure: %w", err)
		}
		return nil
	}

	// 4. pprof（可选）
	if flagsutil.Opts.EnablePprof {
		go func() {
			if err := pprofutil.Run(flagsutil.Opts.PprofAddr); err != nil {
				zlog.Error("pprof startup failure", zap.Error(err))
			}
		}()
	}
	defer finalizer.RunCleanupFuncs()

	// 5. 加载配置
	cfg, err := appconfig.ReadConfigFromFile(flagsutil.Opts)
	if err != nil {
		return fmt.Errorf("load config failure: %w", err)
	}

	// 6. 初始化日志（data.log）
	global, prop, err := zlog.InitLogger(&zlog.Config{
		Level:  cfg.Log.Level,
		Format: "json",
		File: zlog.FileLogConfig{
			Filename:    filepath.Join(system.Directory.LogDir(), "data.log"),
			MaxSize:     100,
			MaxDays:     30,
			MaxBackups:  90,
			Compression: "gzip",
		},
		DisableStacktrace: true,
		DisableStdlog:     cfg.Log.DisableStdlog,
	})
	if err != nil {
		return fmt.Errorf("init global log failure, nest error: %v", err)
	}
	zlog.ReplaceGlobals(global, prop)
	finalizer.RegisterCleanupFuncs(global.Sync)

	zlog.Info("app is preparing to launch, initializing environment...")

	// 7. 创建 server（schema 迁移在 server.New 内部处理）
	srv, err := appserver.New(cfg)
	if err != nil {
		return fmt.Errorf("create server failure: %w", err)
	}

	// 8. 启动 server
	if err := srv.Serve(); err != nil {
		return fmt.Errorf("start server failure: %w", err)
	}
	finalizer.RegisterCleanupFuncs(srv.Stop)

	// 9. 打印启动信息
	zlog.Info("system info", zap.String("detail", system.String()))
	zlog.Info("config info", zap.String("detail", cfg.String()))
	zlog.Info("app start success", zap.String("version", buildinfo.MainVersion), zap.String("commited-id", buildinfo.GitSha))

	// 10. 等待退出信号
	procutil.StopDaemon()
	procutil.WaitForSigterm()

	// 11. 退出日志
	zlog.Info("app stop completed", zap.String("launched-time", system.LaunchTime()))
	return nil
}
```

## main.go

```go
package main

import (
	"os"

	"github.com/eviltomorrow/personal-service/lib/system"
	"github.com/eviltomorrow/personal-service/lib/zlog"

	"github.com/eviltomorrow/personal-service/apps/<name>/cmd"
)

var (
	AppName     = "personal-<name>"
	MainVersion = ""
	GitSha      = ""
	BuildTime   = ""
)

func main() {
	if err := system.LoadRuntime(); err != nil {
		panic(err)
	}
	if err := cmd.Run(); err != nil {
		zlog.Error(err.Error())
		os.Exit(1)
	}
}
```

## Run() 执行顺序

| # | 步骤 | 说明 |
|---|------|------|
| 1 | flagsutil.Parse | CLI 参数解析 |
| 2 | --version | 打印版本号退出 |
| 3 | --daemon | 后台运行模式 |
| 4 | pprof | 可选性能分析 |
| 5 | ReadConfigFromFile | 加载 TOML 配置 |
| 6 | InitLogger | 初始化 data.log |
| 7 | New(cfg) | 创建 server（内含 schema 迁移） |
| 8 | Serve() | 启动服务 |
| 9 | WaitForSigterm | 阻塞等待 SIGTERM |
| 10 | 退出日志 | 打印启动耗时 |

## 关键约束

- **`system.LoadRuntime()`** 在 `main()` 中最先调用，初始化目录/进程信息
- **`finalizer.RunCleanupFuncs()`** 通过 `defer` 注册，确保退出时 cleanup 执行
- **日志必须先于任何业务代码**初始化
- **守护进程模式调用 `os.Exit(0)`** 在子进程启动后，父进程直接退出
