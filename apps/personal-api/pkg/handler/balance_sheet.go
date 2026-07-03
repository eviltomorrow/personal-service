package handler

import (
	"net/http"
	"strconv"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

func parseQueryInt(c echo.Context, name string, defaultVal int) int {
	val := c.QueryParam(name)
	if val == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(val)
	if err != nil {
		return defaultVal
	}
	return n
}

type BalanceSheetHandler struct {
	client model.BalanceSheetClient
}

func init() {
	Register(func(r *Router, deps *Dependencies) {
		h := &BalanceSheetHandler{client: deps.BalanceSheetClient}
		r.GET("/cash-flow/balance-sheet/items", h.ListItems)
		r.POST("/cash-flow/balance-sheet/items", h.CreateItem)
		r.PUT("/cash-flow/balance-sheet/items/:id", h.UpdateItem)
		r.DELETE("/cash-flow/balance-sheet/items/:id", h.DeleteItem)
		r.GET("/cash-flow/balance-sheet/summaries", h.ListSummaries)
	})
}

func (h *BalanceSheetHandler) ListSummaries(c echo.Context) error {
	months := parseQueryInt(c, "months", 12)
	resp, err := h.client.ListMonthlySummaries(tokenCtx(c), accountID(c), months)
	if err != nil {
		zlog.Error("balance sheet list summaries failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *BalanceSheetHandler) ListItems(c echo.Context) error {
	year, _ := strconv.Atoi(c.QueryParam("year"))
	month, _ := strconv.Atoi(c.QueryParam("month"))
	resp, err := h.client.ListItems(tokenCtx(c), accountID(c), year, month)
	if err != nil {
		zlog.Error("balance sheet list items failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *BalanceSheetHandler) CreateItem(c echo.Context) error {
	var req model.CreateBSItemRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	resp, err := h.client.CreateItem(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("balance sheet create item failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *BalanceSheetHandler) UpdateItem(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	var req model.UpdateBSItemRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.ID = id
	resp, err := h.client.UpdateItem(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("balance sheet update item failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *BalanceSheetHandler) DeleteItem(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	if err := h.client.DeleteItem(tokenCtx(c), accountID(c), id); err != nil {
		zlog.Error("balance sheet delete item failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", nil)
}
