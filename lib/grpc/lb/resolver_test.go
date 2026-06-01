package lb

import (
	"context"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"google.golang.org/grpc/resolver"
)

func TestShuffle_PreservesElements(t *testing.T) {
	addrs := []resolver.Address{
		{Addr: "10.0.0.1:8080"},
		{Addr: "10.0.0.2:8080"},
		{Addr: "10.0.0.3:8080"},
	}
	result := shuffle(addrs)
	assert.Equal(t, len(addrs), len(result))

	resultSet := make(map[string]bool)
	for _, a := range result {
		resultSet[a.Addr] = true
	}
	for _, a := range addrs {
		assert.True(t, resultSet[a.Addr])
	}
}

func TestShuffle_DoesNotMutateInput(t *testing.T) {
	addrs := []resolver.Address{
		{Addr: "a"}, {Addr: "b"}, {Addr: "c"},
	}
	original := make([]resolver.Address, len(addrs))
	copy(original, addrs)

	_ = shuffle(addrs)
	assert.Equal(t, original, addrs)
}

func TestShuffle_Empty(t *testing.T) {
	result := shuffle(nil)
	assert.Empty(t, result)
}

func TestShuffle_SingleElement(t *testing.T) {
	addrs := []resolver.Address{{Addr: "single"}}
	result := shuffle(addrs)
	assert.Equal(t, 1, len(result))
	assert.Equal(t, "single", result[0].Addr)
}

func TestBuildAddresses(t *testing.T) {
	ends := map[string]string{
		"key1": "10.0.0.1:8080",
		"key2": "10.0.0.2:8080",
	}
	result := buildAddresses(ends)
	assert.Equal(t, 2, len(result))

	addrs := make(map[string]bool)
	for _, a := range result {
		addrs[a.Addr] = true
	}
	assert.True(t, addrs["10.0.0.1:8080"])
	assert.True(t, addrs["10.0.0.2:8080"])
}

func TestBuildAddresses_Empty(t *testing.T) {
	result := buildAddresses(nil)
	assert.Empty(t, result)
}

func TestNewBuilder(t *testing.T) {
	b := NewBuilder(nil)
	assert.NotNil(t, b)
}

func TestBuilder_Scheme(t *testing.T) {
	b := NewBuilder(nil)
	assert.Equal(t, "etcd", b.Scheme())
}

func TestBuilder_Close(t *testing.T) {
	b := &builder{c: nil}
	err := b.Close()
	assert.Nil(t, err)
}

func TestBuilder_BuildNilClient(t *testing.T) {
	b := &builder{c: nil}
	_, err := b.Build(resolver.Target{URL: url.URL{Path: "/test"}}, nil, resolver.BuildOptions{})
	assert.NotNil(t, err)
	assert.Contains(t, err.Error(), "client is nil")
}

func TestResolver_ResolveNow(t *testing.T) {
	r := &Resolver{}
	r.ResolveNow(resolver.ResolveNowOptions{})
}

func TestResolver_Close_WithoutCancel(t *testing.T) {
	r := &Resolver{}
	r.Close()
}

func TestResolver_Close_WithCancel(t *testing.T) {
	r := &Resolver{}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	r.ctx = ctx
	r.cancel = cancel
	r.Close()
}
