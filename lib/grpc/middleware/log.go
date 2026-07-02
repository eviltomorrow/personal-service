package middleware

import (
	"context"
	"path"
	"time"

	"github.com/eviltomorrow/personal-service/lib/zlog"
	jsoniter "github.com/json-iterator/go"
	"go.opentelemetry.io/otel/trace"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/peer"
)

var logger *zap.Logger

func InitLogger(c *zlog.Config) (func() error, error) {
	access, _, err := zlog.InitLogger(c)
	if err != nil {
		return nil, err
	}
	logger = access
	return logger.Sync, nil
}

// UnaryServerLogInterceptor log 拦截
func UnaryServerLogInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
	var (
		addr    string
		traceId string
	)
	if peer, ok := peer.FromContext(ctx); ok {
		addr = peer.Addr.String()
	}

	traceId = trace.SpanFromContext(ctx).SpanContext().TraceID().String()

	start := time.Now()
	defer func() {
		if err != nil {
			logger.Error("",
				zap.String("traceId", traceId),
				zap.String("addr", addr),
				zap.Duration("cost", time.Since(start)),
				zap.String("service", path.Dir(info.FullMethod)[1:]),
				zap.String("method", path.Base(info.FullMethod)),
				zap.String("req", jsonFormat(req)),
				zap.Error(err),
			)
		} else {
			logger.Info("",
				zap.String("traceId", traceId),
				zap.String("addr", addr),
				zap.Duration("cost", time.Since(start)),
				zap.String("service", path.Dir(info.FullMethod)[1:]),
				zap.String("method", path.Base(info.FullMethod)),
				zap.String("req", jsonFormat(req)),
				zap.String("resp", jsonFormat(resp)),
			)
		}
	}()

	resp, err = handler(ctx, req)
	return resp, err
}

func StreamServerLogInterceptor(srv interface{}, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) (err error) {
	var (
		addr    string
		traceId string
		ctx     = stream.Context()
	)
	if peer, ok := peer.FromContext(ctx); ok {
		addr = peer.Addr.String()
	}

	traceId = trace.SpanFromContext(ctx).SpanContext().TraceID().String()
	start := time.Now()
	defer func() {
		logger.Info("",
			zap.Error(err),
			zap.String("traceId", traceId),
			zap.String("addr", addr),
			zap.Duration("cost", time.Since(start)),
			zap.String("service", path.Dir(info.FullMethod)[1:]),
			zap.String("method", path.Base(info.FullMethod)),
			zap.String("srv", jsonFormat(srv)),
		)
	}()

	return handler(srv, stream)
}

func jsonFormat(data interface{}) string {
	buf, err := jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(data)
	if err == nil {
		return string(buf)
	}

	if a, ok := data.(stringAble); ok {
		return a.String()
	}

	return ""
}

type stringAble interface {
	String() string
}
