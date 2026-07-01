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

	appconfig "github.com/eviltomorrow/personal-service/apps/personal-finance/pkg/config"
	appserver "github.com/eviltomorrow/personal-service/apps/personal-finance/pkg/server"
)

func Run() error {
	if _, err := flagsutil.Parse(flagsutil.Opts); err != nil {
		return err
	}

	if flagsutil.Opts.Version {
		fmt.Println(buildinfo.Version())
		return nil
	}

	if flagsutil.Opts.Daemon {
		if err := procutil.RunAppInBackground(os.Args); err != nil {
			return fmt.Errorf("run daemon failure: %w", err)
		}
		return nil
	}

	if flagsutil.Opts.EnablePprof {
		go func() {
			if err := pprofutil.Run(flagsutil.Opts.PprofAddr); err != nil {
				zlog.Error("pprof startup failure", zap.Error(err))
			}
		}()
	}
	defer finalizer.RunCleanupFuncs()

	cfg, err := appconfig.ReadConfigFromFile(flagsutil.Opts)
	if err != nil {
		return fmt.Errorf("load config failure: %w", err)
	}

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

	srv, err := appserver.New(cfg)
	if err != nil {
		return fmt.Errorf("create grpc server failure: %w", err)
	}

	if err := srv.Serve(); err != nil {
		return fmt.Errorf("start grpc server failure: %w", err)
	}
	finalizer.RegisterCleanupFuncs(srv.Stop)

	zlog.Info("system info", zap.String("detail", system.String()))
	zlog.Info("config info", zap.String("detail", cfg.String()))
	zlog.Info("app start success", zap.String("version", buildinfo.MainVersion), zap.String("commited-id", buildinfo.GitSha))

	procutil.StopDaemon()
	procutil.WaitForSigterm()

	zlog.Info("app stop completed", zap.String("launched-time", system.LaunchTime()))
	return nil
}
