package lb

import (
	"context"
	"fmt"

	clientv3 "go.etcd.io/etcd/client/v3"
	"google.golang.org/grpc/resolver"
)

type builder struct {
	c *clientv3.Client
}

func NewBuilder(client *clientv3.Client) resolver.Builder {
	return &builder{c: client}
}

func (b builder) Build(target resolver.Target, cc resolver.ClientConn, opts resolver.BuildOptions) (resolver.Resolver, error) {
	if b.c == nil {
		return nil, fmt.Errorf("resolver: etcd client is nil")
	}

	r := &Resolver{
		c:         b.c,
		target:    target.URL.Path,
		cc:        cc,
		endpoints: make(map[string]string),
	}

	resp, err := b.c.Get(context.Background(), r.target, clientv3.WithPrefix())
	if err != nil {
		return nil, err
	}

	for _, kv := range resp.Kvs {
		r.endpoints[string(kv.Key)] = string(kv.Value)
	}

	r.cc.UpdateState(resolver.State{
		Addresses: shuffle(buildAddresses(r.endpoints)),
	})

	r.ctx, r.cancel = context.WithCancel(context.Background())
	r.wch = r.c.Watch(r.ctx, r.target, clientv3.WithPrefix())
	r.wg.Add(1)
	go r.watch()

	return r, nil
}

func (b *builder) Scheme() string {
	return "etcd"
}

func (b *builder) Close() error {
	return nil
}
