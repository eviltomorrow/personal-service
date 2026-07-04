package middleware

import (
	"context"

	"github.com/afex/hystrix-go/hystrix"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func init() {
	hystrix.ConfigureCommand("grpc_client", hystrix.CommandConfig{
		Timeout:                10000, // 10s
		MaxConcurrentRequests:  100,
		RequestVolumeThreshold: 50,
		ErrorPercentThreshold:  50,
	})
}

func UnaryClientCircuitbreakerInterceptor(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn, invoker grpc.UnaryInvoker, opts ...grpc.CallOption) error {
	return hystrix.Do("grpc_client", func() error {
		return invoker(ctx, method, req, reply, cc, opts...)
	}, func(err error) error {
		zlog.Error("circuitbreaker was wrong", zap.Error(err), zap.String("target", cc.Target()), zap.String("method", method))
		return status.Error(codes.Unavailable, "circuit breaker open: "+err.Error())
	})
}

func StreamClientCircuitbreakerInterceptor(ctx context.Context, desc *grpc.StreamDesc, cc *grpc.ClientConn, method string, streamer grpc.Streamer, opts ...grpc.CallOption) (grpc.ClientStream, error) {
	return streamer(ctx, desc, cc, method, opts...)
}
