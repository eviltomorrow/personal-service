package server

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"path/filepath"

	"github.com/eviltomorrow/personal-service/lib/finalizer"
	libhttp "github.com/eviltomorrow/personal-service/lib/http"
	"github.com/eviltomorrow/personal-service/lib/http/middleware"
	"github.com/eviltomorrow/personal-service/lib/log"
	"github.com/eviltomorrow/personal-service/lib/netutil"
	"github.com/eviltomorrow/personal-service/lib/system"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type HTTP struct {
	network *netutil.Config
	log     *log.Config

	server  *http.Server
	handler *echo.Echo

	registeredAPI []func(libhttp.Router) error
	refresher     middleware.TokenRefresher
}

func NewHTTP(network *netutil.Config, log *log.Config, refresher middleware.TokenRefresher, supported ...func(libhttp.Router) error) *HTTP {
	return &HTTP{
		network: network,
		log:     log,

		registeredAPI: supported,
		refresher:     refresher,

		handler: echo.New(),
	}
}

func (h *HTTP) Serve() error {
	midlog, err := middleware.InitLogger(&zlog.Config{
		Level:  h.log.Level,
		Format: "json",
		File: zlog.FileLogConfig{
			Filename:    filepath.Join(system.Directory.LogDir(), "access.log"),
			MaxSize:     100,
			MaxDays:     30,
			MaxBackups:  90,
			Compression: "gzip",
		},
		DisableStacktrace: true,
		DisableStdlog:     h.log.DisableStdlog,
	})
	if err != nil {
		return fmt.Errorf("init middleware log failure, nest error: %v", err)
	}
	finalizer.RegisterCleanupFuncs(midlog)

	h.handler.Use(middleware.ServerRecoveryInterceptor())
	h.handler.Use(middleware.ServerLogInterceptor())

	h.handler.Use(middleware.ServerJWTInterceptor(func(c echo.Context) bool {
		path := c.Request().URL.Path
		if path == "/api/v1/auth/register" || path == "/api/v1/auth/login" || path == "/api/v1/auth/token/refresh" || path == "/api/v1/auth/token/revoke" {
			return true
		}
		return false
	}, h.refresher))

	for _, api := range h.registeredAPI {
		api(h.handler)
	}

	h.server = &http.Server{
		Addr:    net.JoinHostPort(h.network.BindIP, fmt.Sprintf("%d", h.network.BindPort)),
		Handler: h.handler,
	}

	go func() {
		if err := h.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			zlog.Fatal("http server start failure", zap.Error(err))
		}
	}()
	return nil
}

func (h *HTTP) Stop() error {
	if h.server != nil {
		return h.server.Shutdown(context.Background())
	}
	return nil
}
