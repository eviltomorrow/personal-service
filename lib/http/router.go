package http

import (
	"github.com/labstack/echo/v4"
)

type Router interface {
	POST(string, echo.HandlerFunc, ...echo.MiddlewareFunc) *echo.Route
	GET(string, echo.HandlerFunc, ...echo.MiddlewareFunc) *echo.Route
	PUT(string, echo.HandlerFunc, ...echo.MiddlewareFunc) *echo.Route
	DELETE(string, echo.HandlerFunc, ...echo.MiddlewareFunc) *echo.Route
}
