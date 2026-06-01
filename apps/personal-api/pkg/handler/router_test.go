package handler

import (
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
)

func TestSetupRoutes(t *testing.T) {
	called := false
	Register(func(r *Router, deps *Dependencies) {
		called = true
	})

	deps := &Dependencies{}
	e := echo.New()
	setup := SetupRoutes(deps, "/api/v1")
	assert.NoError(t, setup(e))
	assert.True(t, called, "registered handler should have been called")
}
