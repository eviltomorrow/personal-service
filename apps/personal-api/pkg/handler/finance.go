package handler

import (
	"net/http"
	"strconv"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type FinanceHandler struct {
	client model.FinanceClient
}

func init() {
	Register(func(r *Router, deps *Dependencies) {
		h := &FinanceHandler{client: deps.FinanceClient}

		// Categories
		r.GET("/finance/categories", h.ListCategories)
		r.POST("/finance/categories", h.CreateCategory)
		r.PUT("/finance/categories/:id", h.UpdateCategory)
		r.DELETE("/finance/categories/:id", h.DeleteCategory)

		// Transactions
		r.GET("/finance/transactions", h.ListTransactions)
		r.POST("/finance/transactions", h.CreateTransaction)
		r.PUT("/finance/transactions/:id", h.UpdateTransaction)
		r.DELETE("/finance/transactions/:id", h.DeleteTransaction)
	})
}

func accountID(c echo.Context) string {
	v, _ := c.Get("account_id").(string)
	return v
}

func (h *FinanceHandler) ListCategories(c echo.Context) error {
	resp, err := h.client.ListCategories(c.Request().Context(), accountID(c))
	if err != nil {
		zlog.Error("finance list categories failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) CreateCategory(c echo.Context) error {
	var req model.CreateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	resp, err := h.client.CreateCategory(c.Request().Context(), accountID(c), &req)
	if err != nil {
		zlog.Error("finance create category failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) UpdateCategory(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	var req model.UpdateCategoryRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.ID = id
	resp, err := h.client.UpdateCategory(c.Request().Context(), accountID(c), &req)
	if err != nil {
		zlog.Error("finance update category failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) DeleteCategory(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	if err := h.client.DeleteCategory(c.Request().Context(), accountID(c), id); err != nil {
		zlog.Error("finance delete category failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", nil)
}

func (h *FinanceHandler) ListTransactions(c echo.Context) error {
	year, _ := strconv.Atoi(c.QueryParam("year"))
	month, _ := strconv.Atoi(c.QueryParam("month"))
	catID, _ := strconv.ParseInt(c.QueryParam("category_id"), 10, 64)
	page, _ := strconv.Atoi(c.QueryParam("page"))
	pageSize, _ := strconv.Atoi(c.QueryParam("page_size"))

	resp, err := h.client.ListTransactions(c.Request().Context(), accountID(c), &model.ListTransactionsRequest{
		Year:       year,
		Month:      month,
		CategoryID: catID,
		Page:       page,
		PageSize:   pageSize,
	})
	if err != nil {
		zlog.Error("finance list transactions failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) CreateTransaction(c echo.Context) error {
	var req model.CreateTransactionRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	resp, err := h.client.CreateTransaction(c.Request().Context(), accountID(c), &req)
	if err != nil {
		zlog.Error("finance create transaction failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) UpdateTransaction(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	var req model.UpdateTransactionRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.ID = id
	resp, err := h.client.UpdateTransaction(c.Request().Context(), accountID(c), &req)
	if err != nil {
		zlog.Error("finance update transaction failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *FinanceHandler) DeleteTransaction(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	if err := h.client.DeleteTransaction(c.Request().Context(), accountID(c), id); err != nil {
		zlog.Error("finance delete transaction failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", nil)
}


