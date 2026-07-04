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
	Auth      AuthConfig       `json:"auth" toml:"auth" mapstructure:"auth"`
}

type AuthConfig struct {
	AccessTokenExpire   time.Duration `json:"access_token_expire" toml:"access_token_expire" mapstructure:"access_token_expire"`
	RefreshTokenExpire  time.Duration `json:"refresh_token_expire" toml:"refresh_token_expire" mapstructure:"refresh_token_expire"`
	SigningKey          string        `json:"signing_key" toml:"signing_key" mapstructure:"signing_key"`
	MaxLoginAttempts    int           `json:"max_login_attempts" toml:"max_login_attempts" mapstructure:"max_login_attempts"`
	LoginLockDuration   time.Duration `json:"login_lock_duration" toml:"login_lock_duration" mapstructure:"login_lock_duration"`
	MaxIPLoginAttempts  int           `json:"max_ip_login_attempts" toml:"max_ip_login_attempts" mapstructure:"max_ip_login_attempts"`
	IPLoginLockDuration time.Duration `json:"ip_login_lock_duration" toml:"ip_login_lock_duration" mapstructure:"ip_login_lock_duration"`
}

var DefaultConfig = Config{
	Network: netutil.Config{
		BindIP:     "0.0.0.0",
		BindPort:   50001,
		DisableTLS: true,
	},
	Log: log.Config{
		Level: "info",
	},
	MySQL: mysql.Config{
		DSN:                "root:root@tcp(127.0.0.1:3306)/personal_auth?charset=utf8mb4&parseTime=True&loc=Local",
		MinOpen:            3,
		MaxOpen:            10,
		MaxLifetime:        300 * time.Second,
		ConnectTimeout:     10 * time.Second,
		StartupRetryTimes:  3,
		StartupRetryPeriod: 3 * time.Second,
	},
	Redis: redis.Config{
		DSN:                "redis://127.0.0.1:6379/0",
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
	Auth: AuthConfig{
		AccessTokenExpire:   1 * time.Hour,
		RefreshTokenExpire:  7 * 24 * time.Hour,
		SigningKey:          "",
		MaxLoginAttempts:    5,
		LoginLockDuration:   2 * time.Minute,
		MaxIPLoginAttempts:  20,
		IPLoginLockDuration: 1 * time.Minute,
	},
}

func (c *AuthConfig) String() string {
	data := map[string]interface{}{
		"access_token_expire":    c.AccessTokenExpire.String(),
		"refresh_token_expire":   c.RefreshTokenExpire.String(),
		"signing_key":            c.SigningKey,
		"max_login_attempts":     c.MaxLoginAttempts,
		"login_lock_duration":    c.LoginLockDuration.String(),
		"max_ip_login_attempts":  c.MaxIPLoginAttempts,
		"ip_login_lock_duration": c.IPLoginLockDuration.String(),
	}
	buf, _ := jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(data)
	return string(buf)
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
		"auth": map[string]interface{}{
			"access_token_expire":    c.Auth.AccessTokenExpire.String(),
			"refresh_token_expire":   c.Auth.RefreshTokenExpire.String(),
			"signing_key":            c.Auth.SigningKey,
			"max_login_attempts":     c.Auth.MaxLoginAttempts,
			"login_lock_duration":    c.Auth.LoginLockDuration.String(),
			"max_ip_login_attempts":  c.Auth.MaxIPLoginAttempts,
			"ip_login_lock_duration": c.Auth.IPLoginLockDuration.String(),
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
