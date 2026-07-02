package handler

import (
	"net/http"
	"strconv"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

type PortfolioHandler struct {
	client model.PortfolioClient
}

func init() {
	Register(func(r *Router, deps *Dependencies) {
		h := &PortfolioHandler{client: deps.PortfolioClient}

		r.GET("/cash-flow/portfolio/positions", h.ListPositions)
		r.POST("/cash-flow/portfolio/positions", h.CreatePosition)
		r.PUT("/cash-flow/portfolio/positions/:id", h.UpdatePosition)
		r.DELETE("/cash-flow/portfolio/positions/:id", h.DeletePosition)

		r.GET("/cash-flow/portfolio/positions/:id/trades", h.ListTrades)
		r.POST("/cash-flow/portfolio/positions/:id/trades", h.CreateTrade)
		r.PUT("/cash-flow/portfolio/trades/:id", h.UpdateTrade)
		r.DELETE("/cash-flow/portfolio/trades/:id", h.DeleteTrade)

		r.GET("/cash-flow/portfolio/snapshots", h.ListSnapshots)
		r.POST("/cash-flow/portfolio/snapshots", h.UpsertSnapshot)

		r.GET("/cash-flow/portfolio/config", h.GetConfig)
		r.PUT("/cash-flow/portfolio/config", h.UpdateConfig)
	})
}

// --- Positions ---

func (h *PortfolioHandler) ListPositions(c echo.Context) error {
	resp, err := h.client.ListPositions(tokenCtx(c), accountID(c))
	if err != nil {
		zlog.Error("portfolio list positions failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *PortfolioHandler) CreatePosition(c echo.Context) error {
	var req model.CreatePositionRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	resp, err := h.client.CreatePosition(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("portfolio create position failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *PortfolioHandler) UpdatePosition(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	var req model.UpdatePositionRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.ID = id
	resp, err := h.client.UpdatePosition(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("portfolio update position failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *PortfolioHandler) DeletePosition(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	if err := h.client.DeletePosition(tokenCtx(c), accountID(c), id); err != nil {
		zlog.Error("portfolio delete position failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", nil)
}

// --- Trades ---

func (h *PortfolioHandler) ListTrades(c echo.Context) error {
	positionID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	resp, err := h.client.ListTrades(tokenCtx(c), accountID(c), positionID)
	if err != nil {
		zlog.Error("portfolio list trades failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *PortfolioHandler) CreateTrade(c echo.Context) error {
	positionID, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var req model.CreateTradeRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.PositionID = positionID
	resp, err := h.client.CreateTrade(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("portfolio create trade failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *PortfolioHandler) UpdateTrade(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	var req model.UpdateTradeRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	req.ID = id
	resp, err := h.client.UpdateTrade(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("portfolio update trade failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *PortfolioHandler) DeleteTrade(c echo.Context) error {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid id", nil)
	}
	if err := h.client.DeleteTrade(tokenCtx(c), accountID(c), id); err != nil {
		zlog.Error("portfolio delete trade failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", nil)
}

// --- Snapshots ---

func (h *PortfolioHandler) ListSnapshots(c echo.Context) error {
	resp, err := h.client.ListSnapshots(tokenCtx(c), accountID(c))
	if err != nil {
		zlog.Error("portfolio list snapshots failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *PortfolioHandler) UpsertSnapshot(c echo.Context) error {
	var req model.UpsertSnapshotRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	resp, err := h.client.UpsertSnapshot(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("portfolio upsert snapshot failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

// --- Config ---

func (h *PortfolioHandler) GetConfig(c echo.Context) error {
	resp, err := h.client.GetConfig(tokenCtx(c), accountID(c))
	if err != nil {
		zlog.Error("portfolio get config failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *PortfolioHandler) UpdateConfig(c echo.Context) error {
	var req struct {
		TotalCapital int64 `json:"total_capital"`
	}
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	resp, err := h.client.UpdateConfig(tokenCtx(c), accountID(c), req.TotalCapital)
	if err != nil {
		zlog.Error("portfolio update config failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}
