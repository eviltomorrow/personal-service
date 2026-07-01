package provider

import "github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"

func Init(cfg *config.Config) error {
	if err := initAuth(cfg); err != nil {
		return err
	}
	return initFinance(cfg)
}
