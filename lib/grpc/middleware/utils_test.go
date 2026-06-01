package middleware

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.opentelemetry.io/otel/attribute"
	otel_codes "go.opentelemetry.io/otel/codes"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestParseFullMethod_Valid(t *testing.T) {
	name, attrs := parseFullMethod("/proto.Service/Method")
	assert.Equal(t, "proto.Service/Method", name)
	assert.Len(t, attrs, 2)
	assert.Equal(t, semconv.RPCService("proto.Service"), attrs[0])
	assert.Equal(t, semconv.RPCMethod("Method"), attrs[1])
}

func TestParseFullMethod_NoPrefix(t *testing.T) {
	name, attrs := parseFullMethod("no-slash")
	assert.Equal(t, "no-slash", name)
	assert.Nil(t, attrs)
}

func TestParseFullMethod_NoMethod(t *testing.T) {
	name, attrs := parseFullMethod("/service-only")
	assert.Equal(t, "service-only", name)
	assert.Nil(t, attrs)
}

func TestServerStatus_ErrorCodes(t *testing.T) {
	errorCodes := []codes.Code{
		codes.Unknown, codes.DeadlineExceeded, codes.Unimplemented,
		codes.Internal, codes.Unavailable, codes.DataLoss,
	}
	for _, code := range errorCodes {
		s := status.New(code, "err msg")
		c, msg := serverStatus(s)
		assert.Equal(t, otel_codes.Error, c, "code=%v", code)
		assert.Equal(t, "err msg", msg, "code=%v", code)
	}
}

func TestServerStatus_OK(t *testing.T) {
	s := status.New(codes.OK, "")
	c, msg := serverStatus(s)
	assert.Equal(t, otel_codes.Unset, c)
	assert.Empty(t, msg)
}

func TestServerStatus_NotFound(t *testing.T) {
	s := status.New(codes.NotFound, "not found")
	c, msg := serverStatus(s)
	assert.Equal(t, otel_codes.Unset, c)
	assert.Empty(t, msg)
}

func TestPeerAttr_ValidIP(t *testing.T) {
	attrs := peerAttr("10.0.0.1:8080")
	if assert.Len(t, attrs, 2) {
		assert.Equal(t, semconv.NetSockPeerAddr("10.0.0.1"), attrs[0])
		assert.Equal(t, semconv.NetSockPeerPort(8080), attrs[1])
	}
}

func TestPeerAttr_ValidHostname(t *testing.T) {
	attrs := peerAttr("example.com:8080")
	if assert.Len(t, attrs, 2) {
		assert.Equal(t, semconv.NetPeerName("example.com"), attrs[0])
		assert.Equal(t, semconv.NetPeerPort(8080), attrs[1])
	}
}

func TestPeerAttr_InvalidAddr(t *testing.T) {
	attrs := peerAttr("bad-address-no-port")
	assert.Nil(t, attrs)
}

func TestPeerAttr_EmptyHost(t *testing.T) {
	attrs := peerAttr(":8080")
	if assert.Len(t, attrs, 2) {
		assert.Equal(t, semconv.NetSockPeerAddr("127.0.0.1"), attrs[0])
	}
}

func TestPeerAttr_InvalidPort(t *testing.T) {
	attrs := peerAttr("10.0.0.1:bad")
	assert.Nil(t, attrs)
}

func TestStatusCodeAttr(t *testing.T) {
	attr := statusCodeAttr(codes.Internal)
	assert.Equal(t, attribute.Key("rpc.grpc.status_code"), attr.Key)
	assert.Equal(t, int64(codes.Internal), attr.Value.AsInt64())
}

func TestSpanInfo(t *testing.T) {
	name, attrs := spanInfo("/svc/method", "10.0.0.1:8080")
	assert.Equal(t, "svc/method", name)
	found := false
	for _, a := range attrs {
		if a.Key == semconv.RPCSystemGRPC.Key {
			found = true
			break
		}
	}
	assert.True(t, found, "should contain RPCSystemGRPC")
}

func TestPeerFromCtx_NoPeer(t *testing.T) {
	addr := peerFromCtx(context.Background())
	assert.Empty(t, addr)
}
