package etcd

import (
	"context"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	clientv3 "go.etcd.io/etcd/client/v3"
)

var etcdEndpoints = []string{"127.0.0.1:2379"}

func TestMain(m *testing.M) {
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   etcdEndpoints,
		DialTimeout: 5 * time.Second,
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "etcd not available, skipping integration tests: %v\n", err)
		os.Exit(0)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if _, err := cli.Status(ctx, etcdEndpoints[0]); err != nil {
		fmt.Fprintf(os.Stderr, "etcd not reachable, skipping integration tests: %v\n", err)
		cli.Close()
		os.Exit(0)
	}
	cli.Close()

	code := m.Run()
	os.Exit(code)
}

func TestInitEtcd_Success(t *testing.T) {
	origClient := Client
	t.Cleanup(func() { Client = origClient })

	cfg := Config{
		Endpoints:          etcdEndpoints,
		ConnectTimeout:     5 * time.Second,
		StartupRetryTimes:  1,
		StartupRetryPeriod: time.Second,
	}

	closeFn, err := InitEtcd(&cfg)
	require.Nil(t, err)
	require.NotNil(t, Client)
	defer closeFn()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	resp, err := Client.Status(ctx, etcdEndpoints[0])
	assert.Nil(t, err)
	assert.NotNil(t, resp)
}

func TestInitEtcd_CloseSetsNil(t *testing.T) {
	origClient := Client
	t.Cleanup(func() { Client = origClient })

	cfg := Config{
		Endpoints:          etcdEndpoints,
		ConnectTimeout:     5 * time.Second,
		StartupRetryTimes:  1,
		StartupRetryPeriod: time.Second,
	}

	closeFn, err := InitEtcd(&cfg)
	require.Nil(t, err)

	err = closeFn()
	assert.Nil(t, err)
	assert.Nil(t, Client)
}

func TestInitEtcd_CloseTwice(t *testing.T) {
	origClient := Client
	t.Cleanup(func() { Client = origClient })

	cfg := Config{
		Endpoints:          etcdEndpoints,
		ConnectTimeout:     5 * time.Second,
		StartupRetryTimes:  1,
		StartupRetryPeriod: time.Second,
	}

	closeFn, err := InitEtcd(&cfg)
	require.Nil(t, err)

	closeFn()
	err = closeFn()
	assert.Nil(t, err)
}

func TestInitEtcd_ConnFailure(t *testing.T) {
	origClient := Client
	t.Cleanup(func() { Client = origClient })

	Client = nil

	cfg := Config{
		Endpoints:          []string{"192.0.2.1:2379"},
		ConnectTimeout:     time.Second,
		StartupRetryTimes:  1,
		StartupRetryPeriod: 10 * time.Millisecond,
	}

	_, err := InitEtcd(&cfg)
	assert.NotNil(t, err)
	assert.Nil(t, Client)
}

func TestStatusEndpoint_Valid(t *testing.T) {
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   etcdEndpoints,
		DialTimeout: 5 * time.Second,
	})
	require.Nil(t, err)
	defer cli.Close()

	err = statusEndpoint(cli, etcdEndpoints[0], 5*time.Second)
	assert.Nil(t, err)
}

func TestStatusEndpoint_Invalid(t *testing.T) {
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   etcdEndpoints,
		DialTimeout: 5 * time.Second,
	})
	require.Nil(t, err)
	defer cli.Close()

	err = statusEndpoint(cli, "192.0.2.1:2379", time.Second)
	assert.NotNil(t, err)
}

func TestStatusClient_InvalidEndpoints(t *testing.T) {
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   []string{"192.0.2.1:2379"},
		DialTimeout: time.Second,
	})
	require.Nil(t, err)
	defer cli.Close()

	err = statusClient(cli, time.Second)
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "connect to etcd service failure")
}

func TestTryConnect_RetriesOnFailure(t *testing.T) {
	origClient := Client
	t.Cleanup(func() { Client = origClient })

	cfg := Config{
		Endpoints:          []string{"192.0.2.1:2379"},
		ConnectTimeout:     time.Second,
		StartupRetryTimes:  2,
		StartupRetryPeriod: 10 * time.Millisecond,
	}

	client, err := tryConnect(&cfg)
	assert.NotNil(t, err)
	assert.Nil(t, client)
}

func TestServicePrefix(t *testing.T) {
	assert.Equal(t, "grpclb", ServicePrefix)
}
