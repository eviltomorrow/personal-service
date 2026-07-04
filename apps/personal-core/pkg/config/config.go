package config

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/etcd"
	"github.com/eviltomorrow/personal-service/lib/flagsutil"
	"github.com/eviltomorrow/personal-service/lib/log"
	"github.com/eviltomorrow/personal-service/lib/netutil"
	"github.com/eviltomorrow/personal-service/lib/opentrace"
	"github.com/eviltomorrow/personal-service/lib/redis"
	"github.com/eviltomorrow/personal-service/lib/system"
	jsoniter "github.com/json-iterator/go"
	"github.com/spf13/viper"
)

type Config struct {
	Network   netutil.Config   `json:"network" toml:"network" mapstructure:"network"`
	Log       log.Config       `json:"log" toml:"log" mapstructure:"log"`
	MySQL     mysql.Config     `json:"mysql" toml:"mysql" mapstructure:"mysql"`
	Redis     redis.Config     `json:"redis" toml:"redis" mapstructure:"redis"`
	Etcd      etcd.Config      `json:"etcd" toml:"etcd" mapstructure:"etcd"`
	Opentrace opentrace.Config `json:"opentrace" toml:"opentrace" mapstructure:"opentrace"`
}

var DefaultConfig = Config{
	Network: netutil.Config{
		BindIP:     "0.0.0.0",
		BindPort:   50002,
		DisableTLS: true,
	},
	Log: log.Config{
		Level: "info",
	},
	MySQL: mysql.Config{
		DSN:                "root:root@tcp(127.0.0.1:3306)/personal_core?charset=utf8mb4&parseTime=True&loc=Local",
		MinOpen:            3,
		MaxOpen:            10,
		MaxLifetime:        300 * time.Second,
		ConnectTimeout:     10 * time.Second,
		StartupRetryTimes:  3,
		StartupRetryPeriod: 3 * time.Second,
	},
	Redis: redis.Config{
		DSN:                "redis://127.0.0.1:6379/1",
		ConnectTimeout:     10 * time.Second,
		StartupRetryTimes:  3,
		StartupRetryPeriod: 3 * time.Second,
	},
	Etcd: etcd.Config{
		Endpoints:          []string{"127.0.0.1:2379"},
		ConnectTimeout:     10 * time.Second,
		StartupRetryTimes:  3,
		StartupRetryPeriod: 3 * time.Second,
	},
	Opentrace: opentrace.Config{
		Enable:         false,
		DSN:            "",
		ConnectTimeout: 10 * time.Second,
	},
}

func (c *Config) String() string {
	data := map[string]interface{}{
		"network": c.Network,
		"log":     c.Log,
		"mysql": map[string]interface{}{
			"dsn":                  c.MySQL.DSN,
			"min_open":             c.MySQL.MinOpen,
			"max_open":             c.MySQL.MaxOpen,
			"max_lifetime":         c.MySQL.MaxLifetime.String(),
			"connect_timeout":      c.MySQL.ConnectTimeout.String(),
			"startup_retry_times":  c.MySQL.StartupRetryTimes,
			"startup_retry_period": c.MySQL.StartupRetryPeriod.String(),
		},
		"redis": map[string]interface{}{
			"dsn":                  c.Redis.DSN,
			"connect_timeout":      c.Redis.ConnectTimeout.String(),
			"startup_retry_times":  c.Redis.StartupRetryTimes,
			"startup_retry_period": c.Redis.StartupRetryPeriod.String(),
		},
		"etcd": map[string]interface{}{
			"endpoints":            c.Etcd.Endpoints,
			"connect_timeout":      c.Etcd.ConnectTimeout.String(),
			"startup_retry_times":  c.Etcd.StartupRetryTimes,
			"startup_retry_period": c.Etcd.StartupRetryPeriod.String(),
		},
		"opentrace": map[string]interface{}{
			"enable":          c.Opentrace.Enable,
			"dsn":             c.Opentrace.DSN,
			"connect_timeout": c.Opentrace.ConnectTimeout.String(),
		},
	}
	buf, _ := jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(data)
	return string(buf)
}

func (c *Config) ApplyOpts(opts *flagsutil.Flags) {
	c.Log.DisableStdlog = opts.DisableStdlog
}

func ReadConfigFromFile(opts *flagsutil.Flags) (*Config, error) {
	findConfigFile := func(path string) (string, error) {
		for _, p := range []string{
			path,
			filepath.Join(system.Directory.EtcDir(), "config.toml"),
		} {
			fi, err := os.Stat(p)
			if err == nil && !fi.IsDir() {
				return p, nil
			}
		}
		return "", fmt.Errorf("not found config file")
	}

	configFile, err := findConfigFile(opts.ConfigFile)
	if err != nil {
		return nil, err
	}

	v := viper.New()
	v.SetConfigFile(configFile)
	v.SetConfigType("toml")

	if err := v.ReadInConfig(); err != nil {
		return nil, err
	}

	cfg := DefaultConfig
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, err
	}

	cfg.ApplyOpts(opts)
	cfg.Network.ResetSystem()

	return &cfg, nil
}
