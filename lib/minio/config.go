package minio

import (
	"fmt"
	"time"

	jsoniter "github.com/json-iterator/go"
)

type Config struct {
	Endpoint           string        `json:"endpoint" toml:"endpoint" mapstructure:"endpoint"`
	AccessKey          string        `json:"access_key" toml:"access_key" mapstructure:"access_key"`
	SecretKey          string        `json:"secret_key" toml:"secret_key" mapstructure:"secret_key"`
	UseSSL             bool          `json:"use_ssl" toml:"use_ssl" mapstructure:"use_ssl"`
	Bucket             string        `json:"bucket" toml:"bucket" mapstructure:"bucket"`
	PublicEndpoint     string        `json:"public_endpoint" toml:"public_endpoint" mapstructure:"public_endpoint"`
	ConnectTimeout     time.Duration `json:"connect_timeout" toml:"-" mapstructure:"-"`
	StartupRetryTimes  int           `json:"startup_retry_times" toml:"-" mapstructure:"-"`
	StartupRetryPeriod time.Duration `json:"startup_retry_period" toml:"-" mapstructure:"-"`
}

func (c *Config) String() string {
	buf, _ := jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(c)
	return string(buf)
}

func (c *Config) VerifyConfig() error {
	if c.Endpoint == "" {
		return fmt.Errorf("minio.endpoint has no value")
	}
	if c.AccessKey == "" {
		return fmt.Errorf("minio.access_key has no value")
	}
	if c.SecretKey == "" {
		return fmt.Errorf("minio.secret_key has no value")
	}
	if c.Bucket == "" {
		return fmt.Errorf("minio.bucket has no value")
	}
	if c.ConnectTimeout <= 0 {
		return fmt.Errorf("minio.connect_timeout has no value")
	}
	if c.StartupRetryTimes <= 0 {
		return fmt.Errorf("minio.startup_retry_times has no value")
	}
	if c.StartupRetryPeriod <= 0 {
		return fmt.Errorf("minio.startup_retry_period has no value")
	}
	return nil
}
