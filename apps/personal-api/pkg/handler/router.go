package handler

import (
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	libhttp "github.com/eviltomorrow/personal-service/lib/http"
	"github.com/labstack/echo/v4"
)

type Router struct {
	*echo.Group
}

type Dependencies struct {
	AuthClient         model.AuthClient
	CashFlowClient     model.CashFlowClient
	BalanceSheetClient model.BalanceSheetClient
}

var handlers []func(r *Router, deps *Dependencies)

func Register(setup func(r *Router, deps *Dependencies)) {
	handlers = append(handlers, setup)
}

func SetupRoutes(deps *Dependencies, apiPrefix string) func(libhttp.Router) error {
	return func(r libhttp.Router) error {
		api := &Router{Group: r.(*echo.Echo).Group(apiPrefix)}
		for _, setup := range handlers {
			setup(api, deps)
		}
		return nil
	}
}
