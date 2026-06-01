package middleware

import (
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"go.uber.org/zap"
)

var logger *zap.Logger

var defaultLogSkipper = func(c echo.Context) bool {
	return false
}

func InitLogger(c *zlog.Config) (func() error, error) {
	access, _, err := zlog.InitLogger(c)
	if err != nil {
		return nil, err
	}
	logger = access
	return logger.Sync, nil
}

func ServerLogInterceptor() echo.MiddlewareFunc {
	return middleware.RequestLoggerWithConfig(middleware.RequestLoggerConfig{
		LogURI:           true,
		LogStatus:        true,
		LogMethod:        true,
		LogRemoteIP:      true,
		LogLatency:       true,
		LogHost:          true,
		LogReferer:       true,
		LogUserAgent:     true,
		LogContentLength: true,
		LogResponseSize:  true,
		LogValuesFunc: func(c echo.Context, v middleware.RequestLoggerValues) error {
			fields := []zap.Field{
				zap.Time("start_time", v.StartTime),
				zap.Int("status", v.Status),
				zap.String("method", v.Method),
				zap.String("host", v.Host),
				zap.String("uri", v.URI),
				zap.String("remote_ip", v.RemoteIP),
				zap.Duration("latency", v.Latency),
				zap.String("user_agent", v.UserAgent),
				zap.String("referer", v.Referer),
				zap.String("request_length", v.ContentLength),
				zap.Int64("response_size", v.ResponseSize),
			}

			if accountID, ok := c.Get(ContextKeyAccountID).(string); ok && accountID != "" {
				fields = append(fields, zap.String("account_id", accountID))
			}

			if v.Error != nil {
				fields = append(fields, zap.Error(v.Error))
			}

			logger.Info("request", fields...)
			return nil
		},
	})
}
