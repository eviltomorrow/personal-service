package etcd

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	clientv3 "go.etcd.io/etcd/client/v3"
)

func setupClient(t *testing.T) *clientv3.Client {
	t.Helper()
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   etcdEndpoints,
		DialTimeout: 5 * time.Second,
	})
	require.Nil(t, err)
	t.Cleanup(func() { cli.Close() })
	return cli
}

func TestReEstablish_Success(t *testing.T) {
	cli := setupClient(t)
	ctx := context.Background()

	key, value := "/test/reestablish/svc", "10.0.0.1:8080"
	ka, id, err := reEstablish(ctx, cli, 10, key, value)
	assert.Nil(t, err)
	assert.NotNil(t, ka)
	assert.Greater(t, id, int64(0))

	getResp, err := cli.Get(ctx, key)
	require.Nil(t, err)
	assert.Equal(t, 1, len(getResp.Kvs))
	assert.Equal(t, value, string(getResp.Kvs[0].Value))

	cli.Revoke(ctx, clientv3.LeaseID(id))
	cli.Delete(ctx, key)
}

func TestReEstablish_GrantError(t *testing.T) {
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   etcdEndpoints,
		DialTimeout: time.Second,
	})
	require.Nil(t, err)
	cli.Close()

	ctx := context.Background()
	ka, id, err := reEstablish(ctx, cli, 10, "key", "value")
	assert.NotNil(t, err)
	assert.Nil(t, ka)
	assert.Zero(t, id)
}

func TestReEstablish_PutError(t *testing.T) {
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   etcdEndpoints,
		DialTimeout: 5 * time.Second,
	})
	require.Nil(t, err)
	defer cli.Close()

	leaseResp, err := cli.Grant(context.Background(), 10)
	require.Nil(t, err)

	cli.Close()

	ctx := context.Background()
	ka, id, err := reEstablish(ctx, cli, 10, "key", "value")
	assert.NotNil(t, err)
	assert.Nil(t, ka)
	assert.Zero(t, id)
	_ = leaseResp
}

func TestReEstablish_KeepAliveError(t *testing.T) {
	cli := setupClient(t)
	ctx := context.Background()

	leaseResp, err := cli.Grant(ctx, 5)
	require.Nil(t, err)

	key, value := "/test/keepalive-fail", "x:1"
	_, err = cli.Put(ctx, key, value, clientv3.WithLease(leaseResp.ID))
	require.Nil(t, err)

	cli.Revoke(ctx, leaseResp.ID)

	time.Sleep(500 * time.Millisecond)

	ka, id, err := reEstablish(ctx, cli, 10, key, value)
	assert.Nil(t, err)
	assert.NotNil(t, ka)
	assert.Greater(t, id, int64(0))

	cli.Revoke(ctx, clientv3.LeaseID(id))
	cli.Delete(ctx, key)
}

func TestReEstablishRetry_Success(t *testing.T) {
	cli := setupClient(t)
	ctx := context.Background()

	key, value := "/test/retry/svc", "10.0.0.1:8080"
	ka, id := reEstablishRetry(ctx, cli, 10, key, value)
	assert.NotNil(t, ka)
	assert.Greater(t, id, int64(0))

	cli.Revoke(ctx, clientv3.LeaseID(id))
	cli.Delete(ctx, key)
}

func TestReEstablishRetry_CanceledContext(t *testing.T) {
	cli := setupClient(t)

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	ka, id := reEstablishRetry(ctx, cli, 10, "key", "value")
	assert.Nil(t, ka)
	assert.Zero(t, id)
}

func TestReEstablishRetry_ClientClosed(t *testing.T) {
	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   etcdEndpoints,
		DialTimeout: time.Second,
	})
	require.Nil(t, err)
	cli.Close()

	ctx := context.Background()
	ka, id := reEstablishRetry(ctx, cli, 10, "key", "value")
	assert.Nil(t, ka)
	assert.Zero(t, id)
}

func TestRegisterService_NilClient(t *testing.T) {
	origClient := Client
	Client = nil
	defer func() { Client = origClient }()

	_, err := RegisterService(context.Background(), "test-svc", "127.0.0.1", 9999, 10)
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "client is nil")
}

func TestRegisterService_GrantFailure(t *testing.T) {
	origClient := Client

	cli, err := clientv3.New(clientv3.Config{
		Endpoints:   etcdEndpoints,
		DialTimeout: time.Second,
	})
	require.Nil(t, err)
	cli.Close()
	Client = cli
	defer func() { Client = origClient }()

	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()

	_, err = RegisterService(ctx, "test-svc", "127.0.0.1", 9999, 5)
	assert.NotNil(t, err)
}

func TestRegisterService_SuccessAndRevoke(t *testing.T) {
	origClient := Client

	cli := setupClient(t)
	Client = cli

	ctx, cancel := context.WithCancel(context.Background())
	defer func() {
		cancel()
		time.Sleep(100 * time.Millisecond)
		Client = origClient
	}()

	revoke, err := RegisterService(ctx, "test-svc", "127.0.0.1", 9999, 5)
	require.Nil(t, err)
	require.NotNil(t, revoke)

	expectedKey := "/grpclb/test-svc/127.0.0.1:9999"
	getResp, err := cli.Get(ctx, expectedKey)
	require.Nil(t, err)
	require.Equal(t, 1, len(getResp.Kvs))
	assert.Equal(t, "127.0.0.1:9999", string(getResp.Kvs[0].Value))

	err = revoke()
	assert.Nil(t, err)

	getResp, err = cli.Get(ctx, expectedKey)
	require.Nil(t, err)
	assert.Equal(t, 0, len(getResp.Kvs))
}

func TestRegisterService_GoroutineKeepaliveRevive(t *testing.T) {
	origClient := Client

	cli := setupClient(t)
	Client = cli

	ctx, cancel := context.WithCancel(context.Background())
	defer func() {
		cancel()
		time.Sleep(100 * time.Millisecond)
		Client = origClient
	}()

	revoke, err := RegisterService(ctx, "revive-svc", "10.0.0.6", 8083, 10)
	require.Nil(t, err)

	expectedKey := "/grpclb/revive-svc/10.0.0.6:8083"
	getResp, err := cli.Get(ctx, expectedKey)
	require.Nil(t, err)
	require.Equal(t, 1, len(getResp.Kvs))

	time.Sleep(2 * time.Second)

	err = revoke()
	require.Nil(t, err)

	getResp, err = cli.Get(ctx, expectedKey)
	require.Nil(t, err)
	assert.Equal(t, 0, len(getResp.Kvs))

	time.Sleep(2 * time.Second)

	getResp, err = cli.Get(ctx, expectedKey)
	require.Nil(t, err)
	assert.Equal(t, 1, len(getResp.Kvs), "goroutine should re-register after lease revocation")

	err = revoke()
	assert.Nil(t, err)
}

func TestRegisterService_KeyFormat(t *testing.T) {
	origClient := Client

	cli := setupClient(t)
	Client = cli

	ctx, cancel := context.WithCancel(context.Background())
	defer func() {
		cancel()
		time.Sleep(100 * time.Millisecond)
		Client = origClient
	}()

	revoke, err := RegisterService(ctx, "my-api", "10.0.0.1", 8080, 10)
	require.Nil(t, err)
	defer revoke()

	expectedKey := "/grpclb/my-api/10.0.0.1:8080"
	getResp, err := cli.Get(ctx, expectedKey)
	require.Nil(t, err)
	require.Equal(t, 1, len(getResp.Kvs))
	assert.Equal(t, "10.0.0.1:8080", string(getResp.Kvs[0].Value))
}

func TestRegisterService_ImmediateCancel(t *testing.T) {
	origClient := Client

	cli := setupClient(t)
	Client = cli

	ctx, cancel := context.WithCancel(context.Background())

	revoke, err := RegisterService(ctx, "immediate-cancel", "10.0.0.4", 8081, 5)
	require.Nil(t, err)

	cancel()
	time.Sleep(500 * time.Millisecond)
	_ = revoke

	Client = origClient
}

func TestRegisterService_ClientCloseTriggersExit(t *testing.T) {
	origClient := Client

	cli := setupClient(t)
	Client = cli

	ctx := context.Background()

	revoke, err := RegisterService(ctx, "client-close", "10.0.0.5", 8082, 10)
	require.Nil(t, err)

	cli.Close()

	time.Sleep(200 * time.Millisecond)
	_ = revoke

	Client = origClient
}
