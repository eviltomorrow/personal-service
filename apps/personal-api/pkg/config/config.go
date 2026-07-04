package config

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/eviltomorrow/personal-service/lib/etcd"
	"github.com/eviltomorrow/personal-service/lib/flagsutil"
	"github.com/eviltomorrow/personal-service/lib/log"
	"github.com/eviltomorrow/personal-service/lib/minio"
	"github.com/eviltomorrow/personal-service/lib/netutil"
	"github.com/eviltomorrow/personal-service/lib/opentrace"
	"github.com/eviltomorrow/personal-service/lib/system"
	jsoniter "github.com/json-iterator/go"
	"github.com/spf13/viper"
)

type Config struct {
	Network   netutil.Config   `json:"network" toml:"network" mapstructure:"network"`
	Log       log.Config       `json:"log" toml:"log" mapstructure:"log"`
	Etcd      etcd.Config      `json:"etcd" toml:"etcd" mapstructure:"etcd"`
	Opentrace opentrace.Config `json:"opentrace" toml:"opentrace" mapstructure:"opentrace"`
	MinIO     minio.Config     `json:"minio" toml:"minio" mapstructure:"minio"`
	Service   ServiceConfig    `json:"service" toml:"service" mapstructure:"service"`
}

type ServiceConfig struct {
	AuthServiceTarget string `json:"auth_service_target" toml:"auth_service_target" mapstructure:"auth_service_target"`
	CoreServiceTarget string `json:"core_service_target" toml:"core_service_target" mapstructure:"core_service_target"`
	SigningKey        string `json:"signing_key" toml:"signing_key" mapstructure:"signing_key"`
}

var DefaultConfig = Config{
	Network: netutil.Config{
		BindIP:     "0.0.0.0",
		BindPort:   8080,
		DisableTLS: true,
	},
	Log: log.Config{
		Level: "info",
	},
	Etcd: etcd.Config{
		Endpoints:          []string{"127.0.0.1:2379"},
		ConnectTimeout:     10 * time.Second,
		StartupRetryTimes:  3,
		StartupRetryPeriod: 3 * time.Second,
	},
	Opentrace: opentrace.Config{
		ConnectTimeout: 10 * time.Second,
	},
	MinIO: minio.Config{
		Endpoint:           "127.0.0.1:9000",
		AccessKey:          "minioadmin",
		SecretKey:          "minioadmin",
		UseSSL:             false,
		Bucket:             "profiles",
		ConnectTimeout:     10 * time.Second,
		StartupRetryTimes:  3,
		StartupRetryPeriod: 3 * time.Second,
	},
	Service: ServiceConfig{
		AuthServiceTarget: "etcd:///grpclb/personal-auth",
		CoreServiceTarget: "etcd:///grpclb/personal-core",
		SigningKey:        "",
	},
}

func (c *ServiceConfig) String() string {
	data := map[string]interface{}{
		"auth_service_target": c.AuthServiceTarget,
		"core_service_target": c.CoreServiceTarget,
		"signing_key":         c.SigningKey,
	}
	buf, _ := jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(data)
	return string(buf)
}

func (c *Config) String() string {
	data := map[string]interface{}{
		"network": c.Network,
		"log":     c.Log,
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
		"service": c.Service,
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
