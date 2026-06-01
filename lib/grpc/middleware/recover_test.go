package middleware

import (
	"context"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestUnaryServerRecoveryInterceptor_NoPanic(t *testing.T) {
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return "ok", nil
	}
	resp, err := UnaryServerRecoveryInterceptor(context.Background(), "req", &grpc.UnaryServerInfo{}, handler)
	require.Nil(t, err)
	assert.Equal(t, "ok", resp)
}

func TestUnaryServerRecoveryInterceptor_Panic(t *testing.T) {
	devNull, err := os.OpenFile(os.DevNull, os.O_WRONLY, 0)
	require.Nil(t, err)
	orig := os.Stderr
	os.Stderr = devNull
	defer func() { os.Stderr = orig; devNull.Close() }()

	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		panic("test panic")
	}
	_, err = UnaryServerRecoveryInterceptor(context.Background(), "req", &grpc.UnaryServerInfo{}, handler)
	assert.NotNil(t, err)
	s, _ := status.FromError(err)
	assert.Equal(t, codes.Internal, s.Code())
	assert.Contains(t, err.Error(), "test panic")
}

func TestStreamServerRecoveryInterceptor_NoPanic(t *testing.T) {
	handler := func(srv interface{}, stream grpc.ServerStream) error {
		return nil
	}
	err := StreamServerRecoveryInterceptor(nil, nil, &grpc.StreamServerInfo{}, handler)
	assert.Nil(t, err)
}

func TestStreamServerRecoveryInterceptor_Panic(t *testing.T) {
	devNull, err := os.OpenFile(os.DevNull, os.O_WRONLY, 0)
	require.Nil(t, err)
	orig := os.Stderr
	os.Stderr = devNull
	defer func() { os.Stderr = orig; devNull.Close() }()

	handler := func(srv interface{}, stream grpc.ServerStream) error {
		panic("stream panic")
	}
	err = StreamServerRecoveryInterceptor(nil, nil, &grpc.StreamServerInfo{}, handler)
	assert.NotNil(t, err)
	s, _ := status.FromError(err)
	assert.Equal(t, codes.Internal, s.Code())
	assert.Contains(t, err.Error(), "stream panic")
}
