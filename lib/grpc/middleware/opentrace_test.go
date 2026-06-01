package middleware

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
)

func TestUnaryClientOpentraceInterceptor(t *testing.T) {
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return "ok", nil
	}

	resp, err := UnaryClientOpentraceInterceptor(context.Background(), "req", &grpc.UnaryServerInfo{FullMethod: "/svc/Method"}, handler)
	require.Nil(t, err)
	assert.Equal(t, "ok", resp)
}

func TestUnaryServerOpentraceInterceptor(t *testing.T) {
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return "ok", nil
	}

	resp, err := UnaryServerOpentraceInterceptor(context.Background(), "req", &grpc.UnaryServerInfo{FullMethod: "/svc/Method"}, handler)
	require.Nil(t, err)
	assert.Equal(t, "ok", resp)
}

func TestUnaryServerOpentraceInterceptor_Error(t *testing.T) {
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return nil, assert.AnError
	}

	_, err := UnaryServerOpentraceInterceptor(context.Background(), "req", &grpc.UnaryServerInfo{FullMethod: "/svc/Method"}, handler)
	assert.NotNil(t, err)
}

func TestStreamServerOpentraceInterceptor(t *testing.T) {
	handler := func(srv interface{}, stream grpc.ServerStream) error {
		return nil
	}

	stream := &mockServerStream{ctx: context.Background()}
	err := StreamServerOpentraceInterceptor(nil, stream, &grpc.StreamServerInfo{FullMethod: "/svc/Stream"}, handler)
	assert.Nil(t, err)
}

func TestStreamServerOpentraceInterceptor_Error(t *testing.T) {
	handler := func(srv interface{}, stream grpc.ServerStream) error {
		return assert.AnError
	}

	stream := &mockServerStream{ctx: context.Background()}
	err := StreamServerOpentraceInterceptor(nil, stream, &grpc.StreamServerInfo{FullMethod: "/svc/Stream"}, handler)
	assert.NotNil(t, err)
}
