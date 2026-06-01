# Config 配置模板

基于 `apps/personal-auth/pkg/config/config.go` 提取。

## 完整代码

```go
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
	// 业务配置
	Auth AuthConfig `json:"auth" toml:"auth" mapstructure:"auth"`
	User UserConfig `json:"user" toml:"user" mapstructure:"user"`
}

type AuthConfig struct {
	AccessTokenExpire   time.Duration `json:"access_token_expire" toml:"access_token_expire" mapstructure:"access_token_expire"`
	RefreshTokenExpire  time.Duration `json:"refresh_token_expire" toml:"refresh_token_expire" mapstructure:"refresh_token_expire"`
	SigningKey          string        `json:"signing_key" toml:"signing_key" mapstructure:"signing_key"`
	MaxLoginAttempts    int           `json:"max_login_attempts" toml:"max_login_attempts" mapstructure:"max_login_attempts"`
	LoginLockDuration   time.Duration `json:"login_lock_duration" toml:"login_lock_duration" mapstructure:"login_lock_duration"`
}

type UserConfig struct {
	AvatarBucket    string        `json:"avatar_bucket" toml:"avatar_bucket" mapstructure:"avatar_bucket"`
	AvatarURLExpiry time.Duration `json:"avatar_url_expiry" toml:"avatar_url_expiry" mapstructure:"avatar_url_expiry"`
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
		ConnectTimeout: 10 * time.Second,
	},
	Auth: AuthConfig{
		AccessTokenExpire:  3600 * time.Second,
		RefreshTokenExpire: 604800 * time.Second,
		SigningKey:         "",
		MaxLoginAttempts:   5,
		LoginLockDuration:  2 * time.Minute,
	},
	User: UserConfig{
		AvatarBucket:    "user-avatars",
		AvatarURLExpiry: 2 * time.Hour,
	},
}

// String 序列化（脱敏，不输出敏感字段）
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
		"auth": c.Auth,
		"user": c.User,
	}
	buf, _ := jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(data)
	return string(buf)
}

// ApplyOpts 用 CLI 选项覆盖配置
func (c *Config) ApplyOpts(opts *flagsutil.Flags) {
	c.Log.DisableStdlog = opts.DisableStdlog
}

// ResetSystem 将配置同步到 system 包全局变量
func (c *Config) ResetSystem() {
	if c.Network.BindIP != "0.0.0.0" && c.Network.BindIP != "" {
		system.Network.SetBindIP(c.Network.BindIP)
	} else {
		system.Network.SetBindIP(system.Network.BindIP())
	}
	if c.Network.AccessIP != "" {
		system.Network.SetAccessIP(c.Network.AccessIP)
	} else {
		system.Network.SetAccessIP(system.Network.BindIP())
	}
}

// ReadConfigFromFile 读取 TOML 配置文件
func ReadConfigFromFile(opts *flagsutil.Flags) (*Config, error) {
	findConfigFile := func(path string) (string, error) {
		for _, p := range []string{
			path,
			filepath.Join(system.Directory.ExecDir(), "config.toml"),
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
	cfg.ResetSystem()

	return &cfg, nil
}
```

## Config 结构体规范

1. **基础设施字段**使用 lib 层提供的 Config 类型（`netutil.Config`, `log.Config`, `mysql.Config` 等）
2. **业务字段**使用自定义 struct，全部字段须同时标注 `json`、`toml`、`mapstructure` tag
3. **`DefaultConfig`** 提供合理的默认值，作为 Viper Unmarshal 的初始值
4. **`String()`** 序列化配置用于日志输出，可针对敏感字段做脱敏处理
5. **`ApplyOpts()`** 将 CLI 选项覆盖到配置
6. **`ResetSystem()`** 将配置写入 `system` 包全局变量（Network 相关）
7. **`ReadConfigFromFile()`** 搜索顺序：CLI 指定路径 → `ExecDir()/config.toml`
