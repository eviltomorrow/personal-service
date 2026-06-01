package server

import (
	"context"
	"testing"

	"github.com/eviltomorrow/personal-service/lib/log"
	"github.com/eviltomorrow/personal-service/lib/netutil"
	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc"
)

func TestNewGRPC(t *testing.T) {
	g := NewGRPC(&netutil.Config{}, &log.Config{})
	assert.NotNil(t, g)
	assert.NotNil(t, g.network)
	assert.NotNil(t, g.log)
	assert.Nil(t, g.server)
	assert.Nil(t, g.RegisteredAPI)
}

func TestNewGRPC_WithSupported(t *testing.T) {
	fn := func(s *grpc.Server) {}
	g := NewGRPC(&netutil.Config{}, &log.Config{}, fn)
	assert.Len(t, g.RegisteredAPI, 1)
}

func TestServe_InvalidAddress(t *testing.T) {
	g := NewGRPC(&netutil.Config{
		BindIP:   "127.0.0.1",
		BindPort: 99999,
	}, &log.Config{})

	err := g.Serve()
	assert.NotNil(t, err)
}

func TestStop_NilFields(t *testing.T) {
	g := &GRPC{}
	err := g.Stop()
	assert.Nil(t, err)
}

func TestStop_WithCancel(t *testing.T) {
	g := &GRPC{}
	g.ctx, g.cancel = context.WithCancel(context.Background())
	err := g.Stop()
	assert.Nil(t, err)
}
