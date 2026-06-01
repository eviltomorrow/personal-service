package middleware

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func newTestConn(t *testing.T) *grpc.ClientConn {
	t.Helper()
	conn, err := grpc.Dial("localhost:1", grpc.WithTransportCredentials(insecure.NewCredentials()))
	require.Nil(t, err)
	t.Cleanup(func() { conn.Close() })
	return conn
}

func TestUnaryClientCircuitbreakerInterceptor_Success(t *testing.T) {
	conn := newTestConn(t)
	invoker := func(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn, opts ...grpc.CallOption) error {
		return nil
	}

	err := UnaryClientCircuitbreakerInterceptor(context.Background(), "/svc/Method", "req", nil, conn, invoker)
	assert.Nil(t, err)
}

func TestUnaryClientCircuitbreakerInterceptor_Failure(t *testing.T) {
	conn := newTestConn(t)
	invoker := func(ctx context.Context, method string, req, reply interface{}, cc *grpc.ClientConn, opts ...grpc.CallOption) error {
		return assert.AnError
	}

	err := UnaryClientCircuitbreakerInterceptor(context.Background(), "/svc/Method", "req", nil, conn, invoker)
	assert.Nil(t, err)
}

func TestStreamClientCircuitbreakerInterceptor_Success(t *testing.T) {
	streamer := func(ctx context.Context, desc *grpc.StreamDesc, cc *grpc.ClientConn, method string, opts ...grpc.CallOption) (grpc.ClientStream, error) {
		return nil, nil
	}

	s, err := StreamClientCircuitbreakerInterceptor(context.Background(), nil, nil, "/svc/Stream", streamer)
	assert.Nil(t, err)
	assert.Nil(t, s)
}

func TestStreamClientCircuitbreakerInterceptor_Failure(t *testing.T) {
	streamer := func(ctx context.Context, desc *grpc.StreamDesc, cc *grpc.ClientConn, method string, opts ...grpc.CallOption) (grpc.ClientStream, error) {
		return nil, assert.AnError
	}

	s, err := StreamClientCircuitbreakerInterceptor(context.Background(), nil, nil, "/svc/Stream", streamer)
	assert.NotNil(t, err)
	assert.Nil(t, s)
}
