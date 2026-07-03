package handler

import (
	"bytes"
	"crypto/rand"
	"fmt"
	"io"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/eviltomorrow/personal-service/lib/minio"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/labstack/echo/v4"
	minio7 "github.com/minio/minio-go/v7"
	"go.uber.org/zap"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
)

const maxAvatarSize = 2 << 20

var allowedAvatarExts = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
}

type ProfileHandler struct {
	client model.ProfileClient
}

func init() {
	Register(func(r *Router, deps *Dependencies) {
		h := &ProfileHandler{client: deps.ProfileClient}
		r.GET("/profile", h.GetProfile)
		r.PUT("/profile", h.UpdateProfile)
		r.POST("/profile/avatar", h.UploadAvatar)
	})
}

func (h *ProfileHandler) GetProfile(c echo.Context) error {
	resp, err := h.client.GetProfile(tokenCtx(c), accountID(c))
	if err != nil {
		zlog.Error("profile get failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *ProfileHandler) UpdateProfile(c echo.Context) error {
	var req model.UpdateProfileRequest
	if err := c.Bind(&req); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "invalid request body", nil)
	}
	resp, err := h.client.UpdateProfile(tokenCtx(c), accountID(c), &req)
	if err != nil {
		zlog.Error("profile update failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}
	return Respond(c, http.StatusOK, 0, "success", resp)
}

func (h *ProfileHandler) UploadAvatar(c echo.Context) error {
	accID := accountID(c)

	if err := c.Request().ParseMultipartForm(maxAvatarSize); err != nil {
		return Respond(c, http.StatusBadRequest, 400, "file too large or invalid multipart", nil)
	}

	file, header, err := c.Request().FormFile("avatar")
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "missing avatar file", nil)
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	mime, ok := allowedAvatarExts[ext]
	if !ok {
		return Respond(c, http.StatusBadRequest, 400, "only JPEG and PNG files are allowed", nil)
	}

	data, err := io.ReadAll(file)
	if err != nil {
		zlog.Error("read avatar file failure", zap.Error(err))
		return Respond(c, http.StatusInternalServerError, 500, "failed to read file", nil)
	}

	if len(data) > maxAvatarSize {
		return Respond(c, http.StatusBadRequest, 400, "file exceeds 2MB limit", nil)
	}

	objectKey := fmt.Sprintf("avatars/%s/%s%s", accID, newObjectID(), ext)

	_, err = minio.Client.PutObject(c.Request().Context(), minio.Bucket, objectKey, bytes.NewReader(data), int64(len(data)), minio7.PutObjectOptions{
		ContentType: mime,
	})
	if err != nil {
		zlog.Error("upload avatar to minio failure", zap.Error(err))
		return Respond(c, http.StatusInternalServerError, 500, "failed to upload avatar", nil)
	}

	oldProfile, err := h.client.GetProfile(tokenCtx(c), accID)
	if err == nil && oldProfile.AvatarURL != "" {
		if err := minio.Client.RemoveObject(c.Request().Context(), minio.Bucket, oldProfile.AvatarURL, minio7.RemoveObjectOptions{}); err != nil {
			zlog.Warn("remove old avatar from minio failure", zap.Error(err))
		}
	}

	avatarURL := fmt.Sprintf("%s/%s/%s", minio.EndpointURL.String(), minio.Bucket, objectKey)

	resp, err := h.client.UpdateProfile(tokenCtx(c), accID, &model.UpdateProfileRequest{
		AvatarURL: avatarURL,
	})
	if err != nil {
		zlog.Error("profile update avatar url failure", zap.Error(err))
		httpStatus, msg := GrpcStatusToHTTP(err)
		return Respond(c, httpStatus, httpStatus, msg, nil)
	}

	return Respond(c, http.StatusOK, 0, "success", resp)
}

func newObjectID() string {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		zlog.Error("generate object id failure", zap.Error(err))
		return fmt.Sprintf("%d", nanoTime())
	}
	return fmt.Sprintf("%x", b)
}

func nanoTime() int64 {
	return time.Now().UnixNano()
}
