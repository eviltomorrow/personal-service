package config

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/eviltomorrow/personal-service/lib/flagsutil"
	"github.com/stretchr/testify/assert"
)

func TestDefaultConfig(t *testing.T) {
	assert.Equal(t, "0.0.0.0", DefaultConfig.Network.BindIP)
	assert.Equal(t, 8080, DefaultConfig.Network.BindPort)
	assert.Equal(t, true, DefaultConfig.Network.DisableTLS)
	assert.Equal(t, "info", DefaultConfig.Log.Level)
	assert.Equal(t, []string{"127.0.0.1:2379"}, DefaultConfig.Etcd.Endpoints)
	assert.Equal(t, 10*time.Second, DefaultConfig.Etcd.ConnectTimeout)
	assert.Equal(t, 3, DefaultConfig.Etcd.StartupRetryTimes)
	assert.Equal(t, 3*time.Second, DefaultConfig.Etcd.StartupRetryPeriod)
	assert.Equal(t, 10*time.Second, DefaultConfig.Opentrace.ConnectTimeout)
	assert.Equal(t, "etcd:///grpclb/personal-auth", DefaultConfig.Service.AuthServiceTarget)
}

func TestServiceConfigString(t *testing.T) {
	c := ServiceConfig{AuthServiceTarget: "etcd:///grpclb/personal-auth"}
	s := c.String()
	assert.Contains(t, s, "etcd:///grpclb/personal-auth")
}

func TestServiceConfigString_Empty(t *testing.T) {
	c := ServiceConfig{}
	s := c.String()
	assert.Contains(t, s, "\"auth_service_target\":\"\"")
}

func TestConfigString(t *testing.T) {
	s := DefaultConfig.String()
	assert.Contains(t, s, "8080")
	assert.Contains(t, s, "info")
	assert.Contains(t, s, "127.0.0.1:2379")
	assert.Contains(t, s, "etcd:///grpclb/personal-auth")
	assert.Contains(t, s, "true")
}

func TestConfigString_WithOpentrace(t *testing.T) {
	cfg := DefaultConfig
	cfg.Opentrace.Enable = true
	cfg.Opentrace.DSN = "http://otel:4318"
	s := cfg.String()
	assert.Contains(t, s, "true")
	assert.Contains(t, s, "http://otel:4318")
}

func TestReadConfigFromFile_NotFound(t *testing.T) {
	_, err := ReadConfigFromFile(&flagsutil.Flags{ConfigFile: "/nonexistent/path/config.toml"})
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "not found config file")
}

func TestReadConfigFromFile_Success(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.toml")
	content := `
[network]
bind_ip = "0.0.0.0"
bind_port = 9090
disable_tls = true

[log]
level = "debug"

[etcd]
endpoints = ["10.0.0.1:2379"]

[service]
auth_service_target = "etcd:///grpclb/personal-auth"
`
	err := os.WriteFile(configPath, []byte(content), 0644)
	assert.NoError(t, err)

	cfg, err := ReadConfigFromFile(&flagsutil.Flags{ConfigFile: configPath})
	assert.NoError(t, err)
	assert.Equal(t, 9090, cfg.Network.BindPort)
	assert.Equal(t, "debug", cfg.Log.Level)
	assert.Equal(t, []string{"10.0.0.1:2379"}, cfg.Etcd.Endpoints)
	assert.Equal(t, "etcd:///grpclb/personal-auth", cfg.Service.AuthServiceTarget)
}

func TestReadConfigFromFile_PartialOverride(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.toml")
	content := `
[network]
bind_port = 9090
`
	err := os.WriteFile(configPath, []byte(content), 0644)
	assert.NoError(t, err)

	cfg, err := ReadConfigFromFile(&flagsutil.Flags{ConfigFile: configPath})
	assert.NoError(t, err)
	assert.Equal(t, 9090, cfg.Network.BindPort)
	assert.Equal(t, "info", cfg.Log.Level)
	assert.Equal(t, "0.0.0.0", cfg.Network.BindIP)
	assert.Equal(t, true, cfg.Network.DisableTLS)
	assert.Equal(t, "etcd:///grpclb/personal-auth", cfg.Service.AuthServiceTarget)
}

func TestReadConfigFromFile_InvalidToml(t *testing.T) {
	tmpDir := t.TempDir()
	configPath := filepath.Join(tmpDir, "config.toml")
	content := `invalid toml [[[[`
	err := os.WriteFile(configPath, []byte(content), 0644)
	assert.NoError(t, err)

	_, err = ReadConfigFromFile(&flagsutil.Flags{ConfigFile: configPath})
	assert.Error(t, err)
}

func TestDefaultConfigImmutability(t *testing.T) {
	origPort := DefaultConfig.Network.BindPort
	cfg := DefaultConfig
	cfg.Network.BindPort = 9999
	assert.Equal(t, 8080, DefaultConfig.Network.BindPort)
	assert.Equal(t, 9999, cfg.Network.BindPort)
	_ = origPort
}
