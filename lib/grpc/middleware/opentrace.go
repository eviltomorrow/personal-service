package middleware

import (
	"context"

	"github.com/eviltomorrow/personal-service/lib/opentrace"
	grpc_middleware "github.com/grpc-ecosystem/go-grpc-middleware"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func unaryServerOpentraceInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
	ctx = extract(ctx, otel.GetTextMapPropagator())

	name, attr := spanInfo(info.FullMethod, peerFromCtx(ctx))

	startOpts := []trace.SpanStartOption{
		trace.WithSpanKind(trace.SpanKindServer),
		trace.WithAttributes(attr...),
	}

	ctx, span := opentrace.DefaultTracer().Start(
		trace.ContextWithRemoteSpanContext(ctx, trace.SpanContextFromContext(ctx)),
		name,
		startOpts...,
	)
	defer span.End()

	resp, err = handler(ctx, req)
	if err != nil {
		s, _ := status.FromError(err)
		statusCode, msg := serverStatus(s)
		span.SetStatus(statusCode, msg)
		span.SetAttributes(statusCodeAttr(s.Code()))
	} else {
		span.SetAttributes(statusCodeAttr(codes.OK))
	}
	return resp, err
}

func UnaryClientOpentraceInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
	return unaryServerOpentraceInterceptor(ctx, req, info, handler)
}

func UnaryServerOpentraceInterceptor(ctx context.Context, req interface{}, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp interface{}, err error) {
	return unaryServerOpentraceInterceptor(ctx, req, info, handler)
}

func StreamServerOpentraceInterceptor(srv interface{}, stream grpc.ServerStream, info *grpc.StreamServerInfo, handler grpc.StreamHandler) (err error) {
	ctx := extract(stream.Context(), otel.GetTextMapPropagator())
	name, attr := spanInfo(info.FullMethod, peerFromCtx(ctx))

	startOpts := []trace.SpanStartOption{
		trace.WithSpanKind(trace.SpanKindServer),
		trace.WithAttributes(attr...),
	}

	ctx, span := opentrace.DefaultTracer().Start(
		trace.ContextWithRemoteSpanContext(ctx, trace.SpanContextFromContext(ctx)),
		name,
		startOpts...,
	)
	defer span.End()

	err = handler(srv, &grpc_middleware.WrappedServerStream{
		ServerStream:   stream,
		WrappedContext: ctx,
	})
	if err != nil {
		s, _ := status.FromError(err)
		statusCode, msg := serverStatus(s)
		span.SetStatus(statusCode, msg)
		span.SetAttributes(statusCodeAttr(s.Code()))
	} else {
		span.SetAttributes(statusCodeAttr(codes.OK))
	}
	return err
}
