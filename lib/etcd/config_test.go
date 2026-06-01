package etcd

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func validConfig() Config {
	return Config{
		Endpoints:          []string{"127.0.0.1:2379"},
		ConnectTimeout:     5 * time.Second,
		StartupRetryTimes:  3,
		StartupRetryPeriod: 3 * time.Second,
	}
}

func TestVerifyConfig_Valid(t *testing.T) {
	cfg := validConfig()
	assert.Nil(t, cfg.VerifyConfig())
}

func TestVerifyConfig_EmptyEndpoints(t *testing.T) {
	cfg := validConfig()
	cfg.Endpoints = nil
	err := cfg.VerifyConfig()
	assert.Contains(t, err.Error(), "endpoints")
}

func TestVerifyConfig_EmptyEndpointsSlice(t *testing.T) {
	cfg := validConfig()
	cfg.Endpoints = []string{}
	err := cfg.VerifyConfig()
	assert.Contains(t, err.Error(), "endpoints")
}

func TestVerifyConfig_ZeroConnectTimeout(t *testing.T) {
	cfg := validConfig()
	cfg.ConnectTimeout = 0
	err := cfg.VerifyConfig()
	assert.Contains(t, err.Error(), "connect_timeout")
}

func TestVerifyConfig_ZeroStartupRetryTimes(t *testing.T) {
	cfg := validConfig()
	cfg.StartupRetryTimes = 0
	err := cfg.VerifyConfig()
	assert.Contains(t, err.Error(), "startup_retry_times")
}

func TestVerifyConfig_ZeroStartupRetryPeriod(t *testing.T) {
	cfg := validConfig()
	cfg.StartupRetryPeriod = 0
	err := cfg.VerifyConfig()
	assert.Contains(t, err.Error(), "startup_retry_period")
}

func TestString(t *testing.T) {
	cfg := validConfig()
	s := cfg.String()
	assert.Contains(t, s, "127.0.0.1:2379")
	assert.Contains(t, s, "connect_timeout")
}
