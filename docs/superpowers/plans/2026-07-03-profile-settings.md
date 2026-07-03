# Profile / Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace localStorage-based settings with a backend-backed profile system (nickname, email, bio, avatar). Avatar stored in MinIO.

**Architecture:** New `Profile` gRPC service in personal-core handles text CRUD. Avatar upload handled in personal-api HTTP handler (reads multipart → saves to MinIO → persists URL via gRPC). Existing MinIO lib used as-is.

**Tech Stack:** Go 1.26.3, gRPC, Echo v4, MinIO, Next.js 15

## Global Constraints

- Follow existing patterns in balance_sheet service (proto, model, service, handler)
- Soft delete with `deleted_at` field
- No new external dependencies
- Proto field numbers increment sequentially
- `lib/minio/` used as-is for MinIO client (global `minio.Client`)

---

### Task 1: SQL Migration + Proto + Compile

**Files:**
- Create: `apps/personal-core/scripts/init-sql/08_profiles.sql`
- Create: `apps/personal-core/adapter/profile.proto`
- Modify: auto-generated `apps/personal-core/adapter/pb/profile.pb.go`, `profile_grpc.pb.go`

**Interfaces:**
- Consumes: existing personal-core MySQL + embedded SQL pattern
- Produces: `profiles` table DDL + gRPC service definition

- [ ] **Step 1: Create SQL migration file**

Write `apps/personal-core/scripts/init-sql/08_profiles.sql`:
```sql
CREATE TABLE IF NOT EXISTS `profiles` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `account_id`   VARCHAR(32)     NOT NULL,
  `nickname`     VARCHAR(64)     NOT NULL DEFAULT '',
  `email`        VARCHAR(128)    NOT NULL DEFAULT '',
  `bio`          VARCHAR(512)    NOT NULL DEFAULT '',
  `avatar_url`   VARCHAR(256)    NOT NULL DEFAULT '',
  `deleted_at`   BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`   BIGINT UNSIGNED NOT NULL,
  `updated_at`   BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_account_id` (`account_id`, `deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

- [ ] **Step 2: Create proto definition**

Write `apps/personal-core/adapter/profile.proto`:
```protobuf
syntax = "proto3";
package personal.core;
option go_package = "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb";

import "google/protobuf/empty.proto";

message ProfileInfo {
  int64 id = 1;
  string account_id = 2;
  string nickname = 3;
  string email = 4;
  string bio = 5;
  string avatar_url = 6;
  int64 created_at = 7;
  int64 updated_at = 8;
}

message UpdateProfileRequest {
  string nickname = 1;
  string email = 2;
  string bio = 3;
  string avatar_url = 4;
}

service Profile {
  rpc GetProfile(google.protobuf.Empty) returns (ProfileInfo);
  rpc UpdateProfile(UpdateProfileRequest) returns (ProfileInfo);
}
```

- [ ] **Step 3: Compile proto**

Run: `make compile`
Expected output: `编译文件: ...profile.proto => [成功]`

---

### Task 2: personal-core Model

**Files:**
- Create: `apps/personal-core/pkg/model/profile.go`
- Modify: `apps/personal-core/pkg/service/profile.go` (register model function variables)

**Interfaces:**
- Consumes: `model.Profile` struct, existing sqlutil
- Produces: `SelectProfile(accountID)`, `InsertProfile(p)`, `UpdateProfile(accountID, updates)`

- [ ] **Step 1: Create model file**

Write `apps/personal-core/pkg/model/profile.go`:
```go
package model

import (
	"context"
	"database/sql"
	"errors"

	dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
	"github.com/eviltomorrow/personal-service/lib/sqlutil"
)

const TableNameProfiles = "profiles"

const (
	FieldProfileAccountID = "account_id"
	FieldProfileNickname  = "nickname"
	FieldProfileEmail     = "email"
	FieldProfileBio       = "bio"
	FieldProfileAvatarURL = "avatar_url"
	FieldProfileDeletedAt = "deleted_at"
	FieldProfileCreatedAt = "created_at"
	FieldProfileUpdatedAt = "updated_at"
)

type Profile struct {
	ID        int64
	AccountID string
	Nickname  string
	Email     string
	Bio       string
	AvatarURL string
	DeletedAt int64
	CreatedAt int64
	UpdatedAt int64
}

var ProfileColumns = []string{
	FieldProfileAccountID, FieldProfileNickname, FieldProfileEmail,
	FieldProfileBio, FieldProfileAvatarURL, FieldProfileDeletedAt,
	FieldProfileCreatedAt, FieldProfileUpdatedAt,
}

var ProfileColumnsWithID = append([]string{"id"}, ProfileColumns...)

func scanProfile(row *sql.Row) (*Profile, error) {
	p := &Profile{}
	err := row.Scan(&p.ID, &p.AccountID, &p.Nickname, &p.Email, &p.Bio,
		&p.AvatarURL, &p.DeletedAt, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func SelectProfile(ctx context.Context, exec dbmysql.Exec, accountID string) (*Profile, error) {
	var p *Profile
	err := sqlutil.NewQuery(exec).
		Columns(ProfileColumnsWithID).
		Table(TableNameProfiles).
		Where(
			sqlutil.WithEq(FieldProfileAccountID, accountID),
			sqlutil.WithEq(FieldProfileDeletedAt, 0),
		).
		QueryOneCtx(ctx, func(row *sql.Row) error {
			var err error
			p, err = scanProfile(row)
			return err
		})
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return p, nil
}

func InsertProfile(ctx context.Context, exec dbmysql.Exec, p *Profile) (int64, error) {
	return sqlutil.NewInsert(exec).Table(TableNameProfiles).InsertCtx(ctx, map[string]interface{}{
		FieldProfileAccountID: p.AccountID,
		FieldProfileNickname:  p.Nickname,
		FieldProfileEmail:     p.Email,
		FieldProfileBio:       p.Bio,
		FieldProfileAvatarURL: p.AvatarURL,
		FieldProfileDeletedAt: 0,
		FieldProfileCreatedAt: p.CreatedAt,
		FieldProfileUpdatedAt: p.UpdatedAt,
	})
}

func UpdateProfile(ctx context.Context, exec dbmysql.Exec, accountID string, updates map[string]interface{}) (int64, error) {
	return sqlutil.NewUpdate(exec).
		Table(TableNameProfiles).
		Field(updates).
		Where(
			sqlutil.WithEq(FieldProfileAccountID, accountID),
			sqlutil.WithEq(FieldProfileDeletedAt, 0),
		).
		UpdateCtx(ctx)
}
```

- [ ] **Step 2: Verify build**

Run: `GOWORK=off go build ./apps/personal-core/...`
Expected: no output (success)

---

### Task 3: personal-core gRPC Service

**Files:**
- Create: `apps/personal-core/pkg/service/profile.go`
- Modify: `apps/personal-core/pkg/server/server.go` (register service)

**Interfaces:**
- Consumes: `model.Profile`, `pb.ProfileServer`, `pb.RegisterProfileServer`
- Produces: `Profile` struct with `GetProfile`, `UpdateProfile` methods

- [ ] **Step 1: Create service file**

Write `apps/personal-core/pkg/service/profile.go`:
```go
package service

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/personal-core/pkg/model"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.uber.org/zap"
)

var (
	selectProfileFn = model.SelectProfile
	insertProfileFn = model.InsertProfile
	updateProfileFn = model.UpdateProfile
)

type ProfileService struct {
	pb.UnimplementedProfileServer
}

func NewProfileService() *ProfileService {
	return &ProfileService{}
}

func (s *ProfileService) GetProfile(ctx context.Context, _ *emptypb.Empty) (*pb.ProfileInfo, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	p, err := selectProfileFn(ctx, selectDB(ctx), accountID)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			// Auto-create profile on first access
			n := now()
			p = &model.Profile{
				AccountID: accountID,
				Nickname:  "",
				Email:     "",
				Bio:       "",
				AvatarURL: "",
				DeletedAt: 0,
				CreatedAt: n,
				UpdatedAt: n,
			}
			if _, err := insertProfileFn(ctx, selectDB(ctx), p); err != nil {
				zlog.Error("insert profile failure", zap.Error(err))
				return nil, status.Error(codes.Internal, "internal server error")
			}
			p.ID, _ = selectProfileFn(ctx, selectDB(ctx), accountID)
			_ = p // re-fetch to get ID
			// Re-read to get the inserted row with ID
			p, err = selectProfileFn(ctx, selectDB(ctx), accountID)
			if err != nil {
				zlog.Error("re-select profile failure", zap.Error(err))
				return nil, status.Error(codes.Internal, "internal server error")
			}
		} else {
			zlog.Error("select profile failure", zap.Error(err))
			return nil, status.Error(codes.Internal, "internal server error")
		}
	}

	return &pb.ProfileInfo{
		Id:        p.ID,
		AccountId: p.AccountID,
		Nickname:  p.Nickname,
		Email:     p.Email,
		Bio:       p.Bio,
		AvatarUrl: p.AvatarURL,
		CreatedAt: p.CreatedAt,
		UpdatedAt: p.UpdatedAt,
	}, nil
}

func (s *ProfileService) UpdateProfile(ctx context.Context, req *pb.UpdateProfileRequest) (*pb.ProfileInfo, error) {
	accountID, err := accountIDFromCtx(ctx)
	if err != nil {
		return nil, err
	}

	n := now()
	updates := map[string]interface{}{
		model.FieldProfileNickname:  req.Nickname,
		model.FieldProfileEmail:     req.Email,
		model.FieldProfileBio:       req.Bio,
		model.FieldProfileAvatarURL: req.AvatarUrl,
		model.FieldProfileUpdatedAt: n,
	}
	if _, err := updateProfileFn(ctx, selectDB(ctx), accountID, updates); err != nil {
		zlog.Error("update profile failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	p, err := selectProfileFn(ctx, selectDB(ctx), accountID)
	if err != nil {
		zlog.Error("re-select profile after update failure", zap.Error(err))
		return nil, status.Error(codes.Internal, "internal server error")
	}

	return &pb.ProfileInfo{
		Id:        p.ID,
		AccountId: p.AccountID,
		Nickname:  p.Nickname,
		Email:     p.Email,
		Bio:       p.Bio,
		AvatarUrl: p.AvatarURL,
		CreatedAt: p.CreatedAt,
		UpdatedAt: p.UpdatedAt,
	}, nil
}
```

- [ ] **Step 2: Register service in server.go**

Edit `apps/personal-core/pkg/server/server.go`. Add after existing service registrations:
```go
profileSrv := service.NewProfileService()
pb.RegisterProfileServer(s, profileSrv)
```

Also add import for `pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"` if not already present (it should be from balance_sheet).

- [ ] **Step 3: Verify build**

Run: `GOWORK=off go build ./apps/personal-core/...`
Expected: no output (success)

---

### Task 4: gRPC Client + personal-api Layers

**Files:**
- Create: `lib/grpc/client/profile.go`
- Create: `apps/personal-api/pkg/model/profile.go`
- Create: `apps/personal-api/pkg/service/profile.go`
- Create: `apps/personal-api/pkg/provider/profile.go`
- Modify: `apps/personal-api/pkg/provider/provider.go`

**Interfaces:**
- Consumes: `pb.ProfileClient`, existing dialect pattern
- Produces: `model.ProfileClient` interface, `service.ProfileService`, provider singleton

- [ ] **Step 1: Create gRPC client**

Write `lib/grpc/client/profile.go`:
```go
package client

import (
	"fmt"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
)

func NewProfileClient(target string) (pb.ProfileClient, func() error, error) {
	conn, err := dial(target)
	if err != nil {
		return nil, nil, fmt.Errorf("dial profile service failure: %w", err)
	}
	return pb.NewProfileClient(conn), conn.Close, nil
}
```

- [ ] **Step 2: Create API model**

Write `apps/personal-api/pkg/model/profile.go`:
```go
package model

import "context"

type ProfileInfo struct {
	ID        int64  `json:"id"`
	AccountID string `json:"account_id"`
	Nickname  string `json:"nickname"`
	Email     string `json:"email"`
	Bio       string `json:"bio"`
	AvatarURL string `json:"avatar_url"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

type UpdateProfileRequest struct {
	Nickname string `json:"nickname"`
	Email    string `json:"email"`
	Bio      string `json:"bio"`
}

type ProfileClient interface {
	GetProfile(ctx context.Context, accountID string) (*ProfileInfo, error)
	UpdateProfile(ctx context.Context, accountID string, req *UpdateProfileRequest) (*ProfileInfo, error)
}
```

- [ ] **Step 3: Create API service**

Write `apps/personal-api/pkg/service/profile.go`:
```go
package service

import (
	"context"

	pb "github.com/eviltomorrow/personal-service/apps/personal-core/adapter/pb"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"google.golang.org/protobuf/types/known/emptypb"
)

type ProfileService struct {
	client pb.ProfileClient
}

func NewProfileService(client pb.ProfileClient) *ProfileService {
	return &ProfileService{client: client}
}

func (s *ProfileService) GetProfile(ctx context.Context, accountID string) (*model.ProfileInfo, error) {
	pbResp, err := s.client.GetProfile(withAccountID(ctx, accountID), &emptypb.Empty{})
	if err != nil {
		return nil, err
	}
	return &model.ProfileInfo{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Nickname:  pbResp.Nickname,
		Email:     pbResp.Email,
		Bio:       pbResp.Bio,
		AvatarURL: pbResp.AvatarUrl,
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}

func (s *ProfileService) UpdateProfile(ctx context.Context, accountID string, req *model.UpdateProfileRequest) (*model.ProfileInfo, error) {
	pbResp, err := s.client.UpdateProfile(withAccountID(ctx, accountID), &pb.UpdateProfileRequest{
		Nickname:  req.Nickname,
		Email:     req.Email,
		Bio:       req.Bio,
		AvatarUrl: "",
	})
	if err != nil {
		return nil, err
	}
	return &model.ProfileInfo{
		ID:        pbResp.Id,
		AccountID: pbResp.AccountId,
		Nickname:  pbResp.Nickname,
		Email:     pbResp.Email,
		Bio:       pbResp.Bio,
		AvatarURL: pbResp.AvatarUrl,
		CreatedAt: pbResp.CreatedAt,
		UpdatedAt: pbResp.UpdatedAt,
	}, nil
}
```

- [ ] **Step 4: Create provider**

Write `apps/personal-api/pkg/provider/profile.go`:
```go
package provider

import (
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/config"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/service"
	grpcclient "github.com/eviltomorrow/personal-service/lib/grpc/client"
)

var profileCli model.ProfileClient

func initProfile(cfg *config.Config) error {
	pbClient, cleanup, err := grpcclient.NewProfileClient(cfg.Service.CoreServiceTarget)
	if err != nil {
		return err
	}
	registerCleanup(cleanup)
	profileCli = service.NewProfileService(pbClient)
	return nil
}

func GetProfileClient() model.ProfileClient {
	return profileCli
}
```

- [ ] **Step 5: Wire in provider.go**

Edit `apps/personal-api/pkg/provider/provider.go`:
- Add `import` for `_ "github.com/eviltomorrow/personal-service/lib/minio"` (used by profile init)
- Add `initProfile` call in `Init()` function after existing init calls:
```go
if err := initProfile(cfg); err != nil {
    return err
}
```

- [ ] **Step 6: Verify build**

Run: `GOWORK=off go build ./apps/personal-api/...`
Expected: no output (success)

---

### Task 5: MinIO Init in personal-api + Config

**Files:**
- Modify: `apps/personal-api/pkg/server/server.go` (init MinIO)
- Modify: `apps/personal-api/pkg/config/config.go` (add MinIO config field if needed)
- Modify: `apps/personal-api/conf/etc/config.toml` (add [minio] section)

**Interfaces:**
- Consumes: `config.Config`, `minio.InitMinIO`
- Produces: global `minio.Client` ready in personal-api

- [ ] **Step 1: Add MinIO config type**

Edit `apps/personal-api/pkg/config/config.go`. Add `MinIO` field to the Config struct:
```go
import "github.com/eviltomorrow/personal-service/lib/minio"

type Config struct {
    // ... existing fields
    MinIO minio.Config `mapstructure:"minio"`
}
```

- [ ] **Step 2: Init MinIO in server startup**

Edit `apps/personal-api/pkg/server/server.go`. Add after etcd init and before provider init:
```go
import (
    // ... existing imports
    "github.com/eviltomorrow/personal-service/lib/minio"
)

// In New() function, after etcd init:
if err := minio.InitMinIO(&cfg.MinIO); err != nil {
    return nil, fmt.Errorf("init minio failure: %w", err)
}
```

- [ ] **Step 3: Add default MinIO config**

Edit `apps/personal-api/conf/etc/config.toml`. Append:
```toml
[minio]
endpoint = "play.min.io"
access_key = "minioadmin"
secret_key = "minioadmin"
use_ssl = false
bucket = "profiles"
connect_timeout = "5s"
startup_retry_times = 3
startup_retry_period = "3s"
```

- [ ] **Step 4: Verify build**

Run: `GOWORK=off go build ./apps/personal-api/...`
Expected: no output (success)

---

### Task 6: HTTP Handler (Profile + Avatar)

**Files:**
- Create: `apps/personal-api/pkg/handler/profile.go`

**Interfaces:**
- Consumes: `model.ProfileClient`, `minio.Client`, account ID from context
- Produces: HTTP routes `GET /profile`, `PUT /profile`, `POST /profile/avatar`

- [ ] **Step 1: Create handler file**

Write `apps/personal-api/pkg/handler/profile.go`:
```go
package handler

import (
	"io"
	"net/http"
	"path/filepath"

	"github.com/eviltomorrow/personal-service/apps/personal-api/pkg/model"
	"github.com/eviltomorrow/personal-service/lib/minio"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"go.uber.org/zap"
)

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
	file, header, err := c.Request().FormFile("file")
	if err != nil {
		return Respond(c, http.StatusBadRequest, 400, "file is required", nil)
	}
	defer file.Close()

	// Validate size (2MB)
	if header.Size > 2*1024*1024 {
		return Respond(c, http.StatusBadRequest, 400, "file too large, max 2MB", nil)
	}

	// Validate content type
	contentType := header.Header.Get("Content-Type")
	if contentType != "image/jpeg" && contentType != "image/png" {
		return Respond(c, http.StatusBadRequest, 400, "only JPEG and PNG images are supported", nil)
	}

	// Determine extension
	ext := ".jpg"
	if contentType == "image/png" {
		ext = ".png"
	}

	// Read file data
	data, err := io.ReadAll(file)
	if err != nil {
		zlog.Error("read uploaded file failure", zap.Error(err))
		return Respond(c, http.StatusInternalServerError, 500, "failed to read file", nil)
	}

	// Build object key
	aid := accountID(c)
	objectKey := "avatars/" + aid + "/" + uuid.New().String() + ext

	// Upload to MinIO
	_, err = minio.Client.PutObject(c.Request().Context(), minio.Bucket, objectKey, nil, int64(len(data)), minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		// Use minio.Bucket from minio package or config — need to make it accessible
		zlog.Error("minio upload failure", zap.Error(err))
		return Respond(c, http.StatusInternalServerError, 500, "upload failed", nil)
	}

	// Update profile with new avatar_url
	_, err = h.client.UpdateProfile(tokenCtx(c), aid, &model.UpdateProfileRequest{AvatarURL: objectKey})
	if err != nil {
		zlog.Error("profile update avatar url failure", zap.Error(err))
		return Respond(c, http.StatusInternalServerError, 500, "failed to update avatar", nil)
	}

	return Respond(c, http.StatusOK, 0, "success", map[string]string{"avatar_url": objectKey})
}
```

Note: The minio client is accessed via `minio.Client` (global). We need to make `Bucket` name available. The `lib/minio/client.go` creates the client but doesn't store the bucket name. We need to either:
1. Store bucket in a global `minio.Bucket` variable, or
2. Create a wrapper.

Let me check the existing lib/minio code to see how to handle this.

Actually, looking at the existing code, `lib/minio/config.go` has `Config` struct with `Bucket` but the global `Client` only stores the SDK client. I'll need to add a global `Bucket` variable. Let me plan this as a sub-step.

- [ ] **Step 1a: Add bucket global to minio lib**

Edit `lib/minio/client.go`. Add:
```go
var Bucket string
```

And in `tryConnect` or `buildMinIO`, set `Bucket = c.Bucket` after successful connection.

- [ ] **Step 2: Wire handler into Dependencies**

Edit `apps/personal-api/pkg/handler/router.go`. Add `ProfileClient` field to `Dependencies`:
```go
type Dependencies struct {
    // ... existing fields
    ProfileClient model.ProfileClient
}
```

And in server setup, pass `provider.GetProfileClient()` when constructing dependencies.

Actually, let me check the current Dependencies struct to see the pattern.

Actually, the Dependencies struct is in `handler/router.go` and populated from providers in `server/server.go`. I need to modify both.

- [ ] **Step 3: Verify build**

Run: `GOWORK=off go build ./apps/personal-api/...`
Expected: no output (success)

---

### Task 7: Frontend Settings Page

**Files:**
- Modify: `apps/personal-web-admin/src/app/dashboard/settings/page.tsx`

**Interfaces:**
- Consumes: `GET /api/v1/profile`, `PUT /api/v1/profile`, `POST /api/v1/profile/avatar`

- [ ] **Step 1: Replace localStorage with API calls**

Rewrite `apps/personal-web-admin/src/app/dashboard/settings/page.tsx`:
- Remove `loadProfile()` → use `useEffect` to `GET /api/v1/profile` on mount
- Remove auto-save `useEffect` → add explicit save button calling `PUT /api/v1/profile`
- Avatar upload: onChange of file input → `POST /api/v1/profile/avatar` with FormData
- Add loading state and error handling

Key API integration points:
```typescript
// Load profile
useEffect(() => {
  api("/api/v1/profile").then(r => r.json()).then(json => {
    if (json.code === 0) setProfile(json.data);
  });
}, []);

// Save profile
async function handleSave() {
  const res = await api("/api/v1/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nickname, email, bio }),
  });
  const json = await res.json();
  if (json.code === 0) setSaved(true);
  setTimeout(() => setSaved(false), 2000);
}

// Upload avatar
async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0];
  if (!file || !file.type.startsWith("image/")) return;
  const form = new FormData();
  form.append("file", file);
  const res = await api("/api/v1/profile/avatar", { method: "POST", body: form });
  const json = await res.json();
  if (json.code === 0) setProfile(p => ({ ...p, avatar_url: json.data.avatar_url }));
}
```

- [ ] **Step 2: Verify build**

Run: `cd apps/personal-web-admin && npx next build`
Expected: build succeeds, settings page size ~2.5kB

---

### Task 8: Final Verification

- [ ] **Step 1: Build all Go services**

Run: `GOWORK=off go build ./...`
Expected: no output (success)

- [ ] **Step 2: Format**

Run: `make fmt`
Expected: no unexpected changes

- [ ] **Step 3: Full frontend build**

Run: `cd apps/personal-web-admin && npx next build`
Expected: all routes build successfully
