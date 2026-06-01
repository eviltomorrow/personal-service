package minio

import (
	"context"
	"fmt"
	"time"

	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"go.uber.org/zap"
)

var Client *minio.Client

func InitMinIO(c *Config) (func() error, error) {
	client, err := tryConnect(c)
	if err != nil {
		return nil, err
	}
	Client = client

	return func() error {
		Client = nil
		return nil
	}, nil
}

func tryConnect(c *Config) (*minio.Client, error) {
	i := 1
	for {
		client, err := buildMinIO(c)
		if err == nil {
			return client, nil
		}
		zlog.Error("connect to minio failure", zap.Error(err))
		i++
		if i > c.StartupRetryTimes {
			return nil, err
		}
		time.Sleep(time.Duration(c.StartupRetryPeriod))
	}
}

func buildMinIO(c *Config) (*minio.Client, error) {
	client, err := minio.New(c.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(c.AccessKey, c.SecretKey, ""),
		Secure: c.UseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("minio: create client failure, nest error: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(c.ConnectTimeout))
	defer cancel()

	ok, err := client.BucketExists(ctx, c.Bucket)
	if err != nil {
		return nil, fmt.Errorf("minio: check bucket failure, nest error: %w", err)
	}
	if !ok {
		if err := client.MakeBucket(ctx, c.Bucket, minio.MakeBucketOptions{}); err != nil {
			return nil, fmt.Errorf("minio: make bucket failure, nest error: %w", err)
		}
	}

	return client, nil
}
