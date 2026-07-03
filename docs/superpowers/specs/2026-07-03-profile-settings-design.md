# Profile / Settings Backend Design

**Date:** 2026-07-03
**Status:** Draft

## Overview

Replace the current localStorage-based settings page with a proper backend-backed profile system. Users can view and edit their nickname, email, bio, and avatar. Avatar images are uploaded via HTTP handler and stored in MinIO directly (not through gRPC).

## Data Model

### Database Table: `profiles`

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

Each account has exactly one row. Created on first `GetProfile` if not exists (upsert pattern in service layer).

## API Design

### gRPC Service (`personal-core`)

New service `Profile` in `personal-core/adapter/profile.proto`:

```protobuf
service Profile {
  rpc GetProfile(google.protobuf.Empty) returns (ProfileInfo);
  rpc UpdateProfile(UpdateProfileRequest) returns (ProfileInfo);
}
```

Messages:
- `ProfileInfo`: id, account_id, nickname, email, bio, avatar_url, created_at, updated_at
- `UpdateProfileRequest`: nickname, email, bio, avatar_url

`avatar_url` is a plain text field in both RPCs. Avatar file upload is handled entirely at the HTTP layer (personal-api writes to MinIO and sets the resulting URL on the profile).

### HTTP Routes (`personal-api`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/profile` | Get current user profile (gRPC → personal-core) |
| PUT | `/api/v1/profile` | Update nickname, email, bio (gRPC → personal-core) |
| POST | `/api/v1/profile/avatar` | Upload avatar file → save to MinIO → set avatar_url |

### Frontend API

- `GET /api/v1/profile` → `ProfileInfo`
- `PUT /api/v1/profile` → body: `{ nickname, email, bio }`
- `POST /api/v1/profile/avatar` → `FormData` with field `file`

## Avatar Upload Flow (personal-api only)

1. HTTP handler receives multipart `file`
2. Validate: file size ≤ 2MB, content-type is image/jpeg or image/png
3. Generate UUID filename: `{uuid}.{ext}`
4. Object key: `avatars/{account_id}/{filename}`
5. Upload to MinIO bucket `profiles`
6. Delete old avatar object (if `avatar_url` is not empty)
7. Call `UpdateProfile` gRPC with the new `avatar_url` to persist
8. Return `{ avatar_url }` in response

## Avatar Storage

- **Bucket**: `profiles` (auto-created on MinIO init in personal-api)
- **Object key**: `avatars/{account_id}/{uuid}.{ext}`
- **Extension**: jpg → `.jpg`, png → `.png`
- **Old file cleanup**: delete previous object on successful upload
- **avatar_url** in DB: relative object key (e.g. `avatars/123/uuid.jpg`). Frontend gets the full URL by prepending the MinIO endpoint (resolved at build/deploy time, or returned as full URL from API).

## Error Handling

| Condition | HTTP Status |
|-----------|-------------|
| No file in request | 400 |
| File > 2MB | 400 |
| Not image/jpeg or image/png | 400 |
| MinIO upload failure | 500 |
| gRPC failure | mapped via GrpcStatusToHTTP |

## Configuration

Only `personal-api` needs the `[minio]` section (personal-core only handles text CRUD through gRPC):

```toml
[minio]
endpoint = "play.min.io"
access_key = "..."
secret_key = "..."
use_ssl = true
bucket = "profiles"
connect_timeout = "5s"
startup_retry_times = 3
startup_retry_period = "3s"
```

## Migration

Add SQL file `08_profiles.sql` to `personal-core/scripts/init-sql/`. Migrated automatically on personal-core startup.

## Files to Create/Modify

### New files
| File | Purpose |
|------|---------|
| `apps/personal-core/scripts/init-sql/08_profiles.sql` | DDL |
| `apps/personal-core/adapter/profile.proto` | gRPC service definition |
| `apps/personal-core/pkg/model/profile.go` | Model struct + CRUD |
| `apps/personal-core/pkg/service/profile.go` | gRPC service impl |
| `apps/personal-api/pkg/handler/profile.go` | HTTP handler |
| `apps/personal-api/pkg/model/profile.go` | API model + client interface |
| `apps/personal-api/pkg/service/profile.go` | API service impl |
| `apps/personal-api/pkg/provider/profile.go` | gRPC client wiring |

### Modified files
| File | Change |
|------|--------|
| `apps/personal-core/pkg/server/server.go` | Register Profile service |
| `apps/personal-api/pkg/server/server.go` | Init MinIO + Profile provider |
| `apps/personal-api/pkg/provider/provider.go` | Add profile init call |
| `apps/personal-api/conf/etc/config.toml` | Add [minio] section |
| `apps/personal-web-admin/src/app/dashboard/settings/page.tsx` | Replace localStorage with API calls |
| `lib/grpc/client/client.go` | Add Profile client dial function |

## Implementation Order

1. SQL migration (`08_profiles.sql`)
2. Proto definition + `make compile`
3. Profile model in personal-core (Go struct + CRUD functions)
4. Profile gRPC service implementation
5. MinIO init in personal-api server startup
6. gRPC profile client in `lib/grpc/client/`
7. personal-api provider, service, model, handler
8. Frontend: replace localStorage with API calls
