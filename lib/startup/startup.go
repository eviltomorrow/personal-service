package startup

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
)

type Server interface {
	Serve() error
	Stop() error
}

type ConfigProvider interface {
	GetLogLevel() string
	GetDisableStdlog() bool
	GetConfigString() string
}

func Run(opts *flagsutil.Flags, appName string, cfgProvider ConfigProvider, newServer func() (Server, error)) error {
	if _, err := flagsutil.Parse(opts); err != nil {
		return err
	}

	if opts.Version {
		fmt.Println(buildinfo.Version())
		return nil
	}

	if opts.Daemon {
		if err := procutil.RunAppInBackground(os.Args); err != nil {
			return fmt.Errorf("run daemon failure: %w", err)
		}
		return nil
	}

	if opts.EnablePprof {
		go func() {
			if err := pprofutil.Run(opts.PprofAddr); err != nil {
				zlog.Error("pprof startup failure", zap.Error(err))
			}
		}()
	}
	defer finalizer.RunCleanupFuncs()

	if err := InitLogger(cfgProvider.GetLogLevel(), cfgProvider.GetDisableStdlog()); err != nil {
		return err
	}

	zlog.Info("app is preparing to launch, initializing environment...")

	srv, err := newServer()
	if err != nil {
		return fmt.Errorf("create server failure: %w", err)
	}

	if err := srv.Serve(); err != nil {
		return fmt.Errorf("start server failure: %w", err)
	}
	finalizer.RegisterCleanupFuncs(srv.Stop)

	zlog.Info("system info", zap.String("detail", system.String()))
	zlog.Info("config info", zap.String("detail", cfgProvider.GetConfigString()))
	zlog.Info("app start success", zap.String("version", buildinfo.MainVersion), zap.String("commited-id", buildinfo.GitSha))

	procutil.StopDaemon()
	procutil.WaitForSigterm()

	zlog.Info("app stop completed", zap.String("launched-time", system.LaunchTime()))
	return nil
}

func InitLogger(cfgLevel string, disableStdlog bool) error {
	global, prop, err := zlog.InitLogger(&zlog.Config{
		Level:  cfgLevel,
		Format: "json",
		File: zlog.FileLogConfig{
			Filename:    filepath.Join(system.Directory.LogDir(), "data.log"),
			MaxSize:     100,
			MaxDays:     30,
			MaxBackups:  90,
			Compression: "gzip",
		},
		DisableStacktrace: true,
		DisableStdlog:     disableStdlog,
	})
	if err != nil {
		return fmt.Errorf("init global log failure, nest error: %v", err)
	}
	zlog.ReplaceGlobals(global, prop)
	finalizer.RegisterCleanupFuncs(global.Sync)
	return nil
}
