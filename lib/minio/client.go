package minio

import (
	"context"
	"fmt"
	"net/url"
	"time"

	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"go.uber.org/zap"
)

var Client *minio.Client
var Bucket string
var EndpointURL *url.URL
var PublicEndpoint string

func InitMinIO(c *Config) (func() error, error) {
	client, err := tryConnect(c)
	if err != nil {
		return nil, err
	}
	Client = client
	Bucket = c.Bucket
	EndpointURL = client.EndpointURL()
	PublicEndpoint = c.PublicEndpoint

	return func() error {
		Client = nil
		Bucket = ""
		EndpointURL = nil
		PublicEndpoint = ""
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

	policy := fmt.Sprintf(`{
		"Version":"2012-10-17",
		"Statement":[{
			"Effect":"Allow",
			"Principal":{"AWS":["*"]},
			"Action":["s3:GetObject"],
			"Resource":["arn:aws:s3:::%s/*"]
		}]
	}`, c.Bucket)
	if err := client.SetBucketPolicy(ctx, c.Bucket, policy); err != nil {
		zlog.Warn("set bucket public policy failure", zap.Error(err))
	}

	return client, nil
}
