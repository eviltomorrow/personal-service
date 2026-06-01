package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"
)

var Client *redis.Client

func InitRedis(c *Config) (func() error, error) {
	client, err := tryConnect(c)
	if err != nil {
		return nil, err
	}
	Client = client

	return func() error {
		if Client == nil {
			return nil
		}

		return Client.Close()
	}, nil
}

func tryConnect(c *Config) (*redis.Client, error) {
	i := 1
	for {
		pool, err := buildRedis(c)
		if err == nil {
			return pool, nil
		}
		zlog.Error("connect to redis failure", zap.Error(err))
		i++

		if i > c.StartupRetryTimes {
			return nil, err
		}

		time.Sleep(time.Duration(c.StartupRetryPeriod))
	}
}

func buildRedis(c *Config) (*redis.Client, error) {
	if c.DSN == "" {
		return nil, fmt.Errorf("redis: no DSN set")
	}

	opts, err := redis.ParseURL(c.DSN)
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(c.ConnectTimeout))
	defer cancel()

	status := client.Ping(ctx)
	if err := status.Err(); err != nil {
		client.Close()
		return nil, err
	}
	return client, nil
}
