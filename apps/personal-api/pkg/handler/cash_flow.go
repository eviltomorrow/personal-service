package handler

import (
	"context"
	"net/http"
	"strconv"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/lib/auth"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type CashFlowHandler struct {
	client model.CashFlowClient
}

func init() {
	Register(func(r *Router, deps *Dependencies) {
		h := &CashFlowHandler{client: deps.CashFlowClient}

		// Categories
		r.GET("/cash-flow/categories", h.ListCategories)
		r.POST("/cash-flow/categories", h.CreateCategory)
		r.PUT("/cash-flow/categories/:id", h.UpdateCategory)
		r.DELETE("/cash-flow/categories/:id", h.DeleteCategory)

		// Transactions
		r.GET("/cash-flow/transactions", h.ListTransactions)
		r.POST("/cash-flow/transactions", h.CreateTransaction)
		r.PUT("/cash-flow/transactions/:id", h.UpdateTransaction)
		r.DELETE("/cash-flow/transactions/:id", h.DeleteTransaction)
	})
}

func accountID(c echo.Context) string {
	v, _ := c.Get("account_id").(string)
	return v
}

func tokenCtx(c echo.Context) context.Context {
	token, _ := c.Get("token").(string)
	if token == "" {
		return c.Request().Context()
	}
	return auth.WithToken(c.Request().Context(), token)
}

func (h *CashFlowHandler) ListCategories(c echo.Context) error {
	year, _ := strconv.Atoi(c.QueryParam("year"))
	month, _ := strconv.Atoi(c.QueryParam("month"))
	resp, err := h.client.ListCategories(tokenCtx(c), accountID(c), year, month)
	if err != nil {
		zlog.Error("cash flow list categories failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *CashFlowHandler) CreateCategory(c echo.Context) error {
	var req model.CreateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.Date = c.QueryParam("date")
	resp, err := h.client.CreateCategory(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("cash flow create category failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *CashFlowHandler) UpdateCategory(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	var req model.UpdateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.ID = id
	resp, err := h.client.UpdateCategory(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("cash flow update category failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *CashFlowHandler) DeleteCategory(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	if err := h.client.DeleteCategory(tokenCtx(c), accountID(c), id); err != nil {
		zlog.Error("cash flow delete category failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", nil)
}

func (h *CashFlowHandler) ListTransactions(c echo.Context) error {
	year, _ := strconv.Atoi(c.QueryParam("year"))
	month, _ := strconv.Atoi(c.QueryParam("month"))
	catID, _ := strconv.ParseInt(c.QueryParam("category_id"), 10, 64)
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	resp, err := h.client.ListTransactions(tokenCtx(c), accountID(c), &model.ListTransactionsRequest{
		Year:       year,
		Month:      month,
		CategoryID: catID,
		Page:       page,
		PageSize:   pageSize,
	})
	if err != nil {
		zlog.Error("cash flow list transactions failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *CashFlowHandler) CreateTransaction(c echo.Context) error {
	var req model.CreateTransactionRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	resp, err := h.client.CreateTransaction(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("cash flow create transaction failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *CashFlowHandler) UpdateTransaction(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	var req model.UpdateTransactionRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.ID = id
	resp, err := h.client.UpdateTransaction(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("cash flow update transaction failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *CashFlowHandler) DeleteTransaction(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	if err := h.client.DeleteTransaction(tokenCtx(c), accountID(c), id); err != nil {
		zlog.Error("cash flow delete transaction failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", nil)
}
