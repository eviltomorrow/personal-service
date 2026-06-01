package opentrace

import (
	"fmt"
	"time"

	jsoniter "github.com/json-iterator/go"
)

type Config struct {
	Enable         bool          `json:"enable" toml:"enable" mapstructure:"enable"`
	DSN            string        `json:"dsn" toml:"dsn" mapstructure:"dsn"`
	ConnectTimeout time.Duration `json:"connect_timeout" toml:"-" mapstructure:"-"`
}

func (c *Config) String() string {
	buf, _ := jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(c)
	return string(buf)
}

func (c *Config) VerifyConfig() error {
	if !c.Enable {
		return nil
	}
	if c.DSN == "" {
		return fmt.Errorf("otel.dsn has no value")
	}
	if c.ConnectTimeout <= 0 {
		return fmt.Errorf("otel.connect_timeout has no value")
	}
	return nil
}
