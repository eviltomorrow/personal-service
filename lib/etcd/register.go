package etcd

import (
	"context"
	"fmt"
	"sync/atomic"

	"github.com/eviltomorrow/personal-service/lib/zlog"
	clientv3 "go.etcd.io/etcd/client/v3"
	"go.uber.org/zap"
)

var ServicePrefix = "grpclb"

func RegisterService(ctx context.Context, service string, host string, port int, ttl int64) (func() error, error) {
	cli := Client
	if cli == nil {
		return nil, fmt.Errorf("panic: etcd's client is nil")
	}

	leaseResp, err := cli.Grant(ctx, ttl)
	if err != nil {
		return nil, err
	}

	key := fmt.Sprintf("/%s/%s/%s:%d", ServicePrefix, service, host, port)
	value := fmt.Sprintf("%s:%d", host, port)

	_, err = cli.Put(ctx, key, value, clientv3.WithLease(leaseResp.ID))
	if err != nil {
		return nil, err
	}

	keepAlive, err := cli.KeepAlive(ctx, leaseResp.ID)
	if err != nil {
		return nil, err
	}

	var leaseID atomic.Int64
	leaseID.Store(int64(leaseResp.ID))

	go func() {
		for {
			select {
			case <-cli.Ctx().Done():
				return
			case <-ctx.Done():
				return
			case k, ok := <-keepAlive:
				if ok {
					_ = k
					continue
				}
			}

			k, id := reEstablishRetry(ctx, cli, ttl, key, value)
			if k == nil {
				return
			}
			keepAlive = k
			leaseID.Store(id)
		}
	}()

	revokeFunc := func() error {
		_, err := cli.Revoke(ctx, clientv3.LeaseID(leaseID.Load()))
		return err
	}

	return revokeFunc, nil
}

func reEstablishRetry(ctx context.Context, cli *clientv3.Client, ttl int64, key, value string) (<-chan *clientv3.LeaseKeepAliveResponse, int64) {
	for {
		select {
		case <-ctx.Done():
			return nil, 0
		case <-cli.Ctx().Done():
			return nil, 0
		default:
		}

		k, id, err := reEstablish(ctx, cli, ttl, key, value)
		if err == nil {
			return k, id
		}
	}
}

func reEstablish(ctx context.Context, cli *clientv3.Client, ttl int64, key, value string) (<-chan *clientv3.LeaseKeepAliveResponse, int64, error) {
	leaseResp, err := cli.Grant(ctx, ttl)
	if err != nil {
		zlog.Error("grant lease failure", zap.Error(err))
		return nil, 0, err
	}

	_, err = cli.Put(ctx, key, value, clientv3.WithLease(leaseResp.ID))
	if err != nil {
		zlog.Error("put k/v failure", zap.Error(err), zap.String("key", key), zap.String("value", value))
		return nil, 0, err
	}

	keepAlive, err := cli.KeepAlive(ctx, leaseResp.ID)
	if err != nil {
		zlog.Error("keepalive failure", zap.Error(err), zap.Any("leaseID", leaseResp.ID))
		return nil, 0, err
	}

	return keepAlive, int64(leaseResp.ID), nil
}
