package middleware

import (
	"context"
	"net"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/peer"
)

func TestJsonFormat_WithMarshalable(t *testing.T) {
	data := map[string]string{"key": "value"}
	s := jsonFormat(data)
	assert.Equal(t, `{"key":"value"}`, s)
}

func TestJsonFormat_WithStringer(t *testing.T) {
	s := jsonFormat(jsonErrorStringer{})
	assert.Equal(t, "fallback-string", s)
}

type jsonErrorStringer struct{}

func (jsonErrorStringer) MarshalJSON() ([]byte, error) {
	return nil, assert.AnError
}

func (jsonErrorStringer) String() string { return "fallback-string" }

func TestJsonFormat_WithMarshalAndStringer(t *testing.T) {
	data := struct {
		Name string
	}{Name: "test"}
	s := jsonFormat(data)
	assert.Contains(t, s, "test")
}

func TestUnaryServerLogInterceptor_Success(t *testing.T) {
	logger = zap.NewNop()
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return "response", nil
	}

	ctx := context.Background()
	resp, err := UnaryServerLogInterceptor(ctx, "request", &grpc.UnaryServerInfo{FullMethod: "/svc/Method"}, handler)
	require.Nil(t, err)
	assert.Equal(t, "response", resp)
}

func TestUnaryServerLogInterceptor_WithPeer(t *testing.T) {
	logger = zap.NewNop()
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return "ok", nil
	}

	addr := &net.TCPAddr{IP: net.ParseIP("10.0.0.1"), Port: 8080}
	ctx := peer.NewContext(context.Background(), &peer.Peer{Addr: addr})
	resp, err := UnaryServerLogInterceptor(ctx, "req", &grpc.UnaryServerInfo{FullMethod: "/svc2/Method2"}, handler)
	require.Nil(t, err)
	assert.Equal(t, "ok", resp)
}

func TestStreamServerLogInterceptor_Success(t *testing.T) {
	logger = zap.NewNop()
	handler := func(srv interface{}, stream grpc.ServerStream) error {
		return nil
	}

	stream := &mockServerStream{ctx: context.Background()}
	err := StreamServerLogInterceptor(nil, stream, &grpc.StreamServerInfo{FullMethod: "/svc/Stream"}, handler)
	assert.Nil(t, err)
}

func TestStreamServerLogInterceptor_WithPeer(t *testing.T) {
	logger = zap.NewNop()
	handler := func(srv interface{}, stream grpc.ServerStream) error {
		return nil
	}

	addr := &net.TCPAddr{IP: net.ParseIP("10.0.0.2"), Port: 8081}
	ctx := peer.NewContext(context.Background(), &peer.Peer{Addr: addr})
	stream := &mockServerStream{ctx: ctx}

	err := StreamServerLogInterceptor(nil, stream, &grpc.StreamServerInfo{FullMethod: "/svc/Stream2"}, handler)
	assert.Nil(t, err)
}

type mockServerStream struct {
	grpc.ServerStream
	ctx context.Context
}

func (m *mockServerStream) Context() context.Context {
	if m.ctx != nil {
		return m.ctx
	}
	return context.Background()
}
