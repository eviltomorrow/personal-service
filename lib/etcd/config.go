package etcd

import (
	"fmt"
	"time"

	jsoniter "github.com/json-iterator/go"
)

type Config struct {
	Endpoints []string `json:"endpoints" toml:"endpoints" mapstructure:"endpoints"`

	ConnectTimeout     time.Duration `json:"connect_timeout" toml:"-" mapstructure:"-"`
	StartupRetryTimes  int           `json:"startup_retry_times" toml:"-" mapstructure:"-"`
	StartupRetryPeriod time.Duration `json:"startup_retry_period" toml:"-" mapstructure:"-"`
}

func (c *Config) String() string {
	buf, _ := jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(c)
	return string(buf)
}

func (c *Config) VerifyConfig() error {
	if len(c.Endpoints) == 0 {
		return fmt.Errorf("etcd.endpoints has no value")
	}

	if c.ConnectTimeout <= 0 {
		return fmt.Errorf("etcd.connect_timeout has no value")
	}
	if c.StartupRetryTimes <= 0 {
		return fmt.Errorf("etcd.startup_retry_times has no value")
	}
	if c.StartupRetryPeriod <= 0 {
		return fmt.Errorf("etcd.startup_retry_period has no value")
	}
	return nil
}
