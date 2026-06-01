package etcd

import (
	"context"
	"fmt"
	"time"

	"github.com/eviltomorrow/personal-service/lib/zlog"
	clientv3 "go.etcd.io/etcd/client/v3"
	"go.uber.org/zap"
)

var Client *clientv3.Client

func InitEtcd(c *Config) (func() error, error) {
	client, err := tryConnect(c)
	if err != nil {
		return nil, err
	}
	Client = client

	return func() error {
		if Client == nil {
			return nil
		}

		err := Client.Close()
		Client = nil
		return err
	}, nil
}

func tryConnect(c *Config) (*clientv3.Client, error) {
	client, err := clientv3.New(clientv3.Config{
		Endpoints:   c.Endpoints,
		DialTimeout: c.ConnectTimeout,
		LogConfig: &zap.Config{
			Level:            zap.NewAtomicLevelAt(zap.ErrorLevel),
			Development:      false,
			Encoding:         "json",
			EncoderConfig:    zap.NewProductionEncoderConfig(),
			OutputPaths:      []string{"stderr"},
			ErrorOutputPaths: []string{"stderr"},
		},
	})
	if err != nil {
		return nil, err
	}

	i := 1
	for {
		err := statusClient(client, c.ConnectTimeout)
		if err == nil {
			return client, nil
		}
		zlog.Error("connect to etcd failure", zap.Error(err))
		i++

		if i > c.StartupRetryTimes {
			client.Close()
			return nil, err
		}

		time.Sleep(c.StartupRetryPeriod)
	}
}

func statusClient(client *clientv3.Client, timeout time.Duration) error {
	for _, endpoint := range client.Endpoints() {
		if err := statusEndpoint(client, endpoint, timeout); err == nil {
			return nil
		}
	}
	return fmt.Errorf("connect to etcd service failure, nest endpoints: %v", client.Endpoints())
}

func statusEndpoint(client *clientv3.Client, endpoint string, timeout time.Duration) error {
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	_, err := client.Status(ctx, endpoint)
	return err
}
