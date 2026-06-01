package lb

import (
	"context"
	"math/rand/v2"
	"runtime/debug"
	"sync"

	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.etcd.io/etcd/api/v3/mvccpb"
	clientv3 "go.etcd.io/etcd/client/v3"
	"go.uber.org/zap"
	"google.golang.org/grpc/resolver"
)

type Resolver struct {
	c         *clientv3.Client
	target    string
	cc        resolver.ClientConn
	wch       clientv3.WatchChan
	endpoints map[string]string
	ctx       context.Context
	cancel    context.CancelFunc
	wg        sync.WaitGroup
}

func (r *Resolver) watch() {
	defer r.wg.Done()
	defer func() {
		if e := recover(); e != nil {
			zlog.Error("resolver watch panic", zap.Any("panic", e), zap.ByteString("stack", debug.Stack()))
		}
	}()

	for {
		select {
		case <-r.ctx.Done():
			return

		case wresp, ok := <-r.wch:
			if !ok {
				return
			}

			for _, ev := range wresp.Events {
				key := string(ev.Kv.Key)
				switch ev.Type {
				case mvccpb.PUT:
					r.endpoints[key] = string(ev.Kv.Value)
				case mvccpb.DELETE:
					delete(r.endpoints, key)
				}
			}

			r.cc.UpdateState(resolver.State{
				Addresses: shuffle(buildAddresses(r.endpoints)),
			})
		}
	}
}

func buildAddresses(ends map[string]string) []resolver.Address {
	addrs := make([]resolver.Address, 0, len(ends))
	for _, v := range ends {
		addrs = append(addrs, resolver.Address{Addr: v})
	}
	return addrs
}

func shuffle(addresses []resolver.Address) []resolver.Address {
	shuffled := make([]resolver.Address, len(addresses))
	copy(shuffled, addresses)
	rand.Shuffle(len(shuffled), func(i, j int) {
		shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
	})
	return shuffled
}

func (r *Resolver) ResolveNow(resolver.ResolveNowOptions) {}

func (r *Resolver) Close() {
	if r.cancel != nil {
		r.cancel()
	}
	r.wg.Wait()
}
