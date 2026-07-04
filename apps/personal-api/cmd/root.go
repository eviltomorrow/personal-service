package cmd

import (
	"github.com/eviltomorrow/personal-service/lib/flagsutil"
	"github.com/eviltomorrow/personal-service/lib/startup"

	appconfig "github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	appserver "github.com/eviltomorrow/personal-service/apps/personal-api/pkg/server"
)

type configAdapter struct {
	cfg *appconfig.Config
}

func (a *configAdapter) GetLogLevel() string {
	return a.cfg.Log.Level
}

func (a *configAdapter) GetDisableStdlog() bool {
	return a.cfg.Log.DisableStdlog
}

func (a *configAdapter) GetConfigString() string {
	return a.cfg.String()
}

func Run() error {
	cfg, err := appconfig.ReadConfigFromFile(flagsutil.Opts)
	if err != nil {
		return err
	}

	adapter := &configAdapter{cfg: cfg}

	return startup.Run(flagsutil.Opts, "personal-api", adapter, func() (startup.Server, error) {
		return appserver.New(cfg)
	})
}
