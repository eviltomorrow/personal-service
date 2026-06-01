package redis

import (
	"fmt"
	"time"

	jsoniter "github.com/json-iterator/go"
)

type Config struct {
	DSN                string        `json:"dsn" toml:"dsn" mapstructure:"dsn"`
	ConnectTimeout     time.Duration `json:"connect_timeout" toml:"-" mapstructure:"-"`
	StartupRetryTimes  int           `json:"startup_retry_times" toml:"-" mapstructure:"-"`
	StartupRetryPeriod time.Duration `json:"startup_retry_period" toml:"-" mapstructure:"-"`
}

func (r *Config) String() string {
	buf, _ := jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(r)
	return string(buf)
}

func (c *Config) VerifyConfig() error {
	if c.DSN == "" {
		return fmt.Errorf("redis.dsn has no value")
	}
	if c.ConnectTimeout <= 0 {
		return fmt.Errorf("redis.connect_timeout has no value")
	}
	if c.StartupRetryTimes <= 0 {
		return fmt.Errorf("redis.startup_retry_times has no value")
	}
	if c.StartupRetryPeriod <= 0 {
		return fmt.Errorf("redis.startup_retry_period has no value")
	}
	return nil
}
