
# service 层代码模板

基于 `apps/personal-auth/pkg/service/auth.go` 提取。

```go
package service

import (
    "context"
    "errors"
    "fmt"
    "strings"
    "time"

    "github.com/eviltomorrow/personal-service/lib/auth"
    dbmysql "github.com/eviltomorrow/personal-service/lib/db/mysql"
    "github.com/eviltomorrow/personal-service/lib/encrypt"
    "github.com/eviltomorrow/personal-service/lib/redis"
    "github.com/eviltomorrow/personal-service/lib/snowflake"
    "github.com/eviltomorrow/personal-service/lib/zlog"
    "github.com/go-sql-driver/mysql"
    "go.uber.org/zap"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"

    pb "github.com/eviltomorrow/personal-service/apps/<name>/adapter/pb"
    "github.com/eviltomorrow/personal-service/apps/<name>/pkg/config"
    "github.com/eviltomorrow/personal-service/apps/<name>/pkg/model"
)

// ════════════════════════════════════════════════════════════════
// 1. DI 函数变量（三层: model / redis / auth）
// ════════════════════════════════════════════════════════════════

// ── model 层 DI ────────────────────────────────────────────────
var (
    selectXxxByID    = model.SelectXxxByID
    selectXxxWithYyy = model.SelectXxxWithYyy
    insertXxx        = model.InsertXxx
    updateXxx        = model.UpdateXxx
    softDeleteXxx    = model.SoftDeleteXxxByID
    deleteXxx        = model.DeleteXxxByID       // 硬删除
    replaceXxxField  = model.ReplaceXxxField      // 替换字段值
)

// ── Redis DI ───────────────────────────────────────────────────
var (
    redisTTL    = func(ctx context.Context, key string) (time.Duration, error) { return redis.Client.TTL(ctx, key).Result() }
    redisIncr   = func(ctx context.Context, key string) (int64, error) { return redis.Client.Incr(ctx, key).Result() }
    redisExpire = func(ctx context.Context, key string, dur time.Duration) error { return redis.Client.Expire(ctx, key, dur).Err() }
    redisSet    = func(ctx context.Context, key string, val interface{}, exp time.Duration) error { return redis.Client.Set(ctx, key, val, exp).Err() }
    redisDel    = func(ctx context.Context, keys ...string) error { return redis.Client.Del(ctx, keys...).Err() }
    redisGet    = func(ctx context.Context, key string) (string, error) { return redis.Client.Get(ctx, key).Result() }
)

// ── lib/auth 等第三方 DI ───────────────────────────────────────
var (
    jwtCreateToken  = auth.JwtWithCreateToken
    jwtParseToken   = auth.JwtWithParseToken
    stateRenew      = auth.StateTokenWithRenew
    stateTokenHash  = auth.StateTokenWithParseJwtToken
    stateTokenCount = auth.StateTokenWithCount
    stateSearchList = auth.StateTokenWithSearchList
    stateRevoke     = auth.StateTokenWithRevoke
    stateRevokeAll  = auth.StateTokenWithRevokeAll
)

// ════════════════════════════════════════════════════════════════
// 2. Service 结构体 + 构造函数
// ════════════════════════════════════════════════════════════════

type XxxService struct {
    pb.UnimplementedXxxServer
    cfg *config.XxxConfig
}

func NewXxxService(cfg *config.Config) (*XxxService, error) {
    // 初始化全局依赖（如 auth.SigningKey）
    auth.SigningKey = []byte(cfg.Auth.SigningKey)
    return &XxxService{cfg: &cfg.Xxx}, nil
}

// ════════════════════════════════════════════════════════════════
// 3. Proto 类型转换 helper
// ════════════════════════════════════════════════════════════════

func protoXxxTypeToString(t pb.XxxType) (string, error) {
    switch t {
    case pb.XxxType_XXX_TYPE_A:
        return "type_a", nil
    case pb.XxxType_XXX_TYPE_B:
        return "type_b", nil
    default:
        return "", status.Error(codes.InvalidArgument, "invalid xxx_type")
    }
}

// ════════════════════════════════════════════════════════════════
// 4. RPC 方法模板
// ════════════════════════════════════════════════════════════════

// ── 简单查询 ───────────────────────────────────────────────────
func (s *XxxService) GetXxx(ctx context.Context, req *pb.GetXxxRequest) (*pb.GetXxxResponse, error) {
    if req.Id == "" {
        return nil, status.Error(codes.InvalidArgument, "id is required")
    }

    x, err := selectXxxByID(ctx, dbmysql.DB, req.Id)
    if err != nil {
        if errors.Is(err, model.ErrNotFound) {
            return nil, status.Error(codes.NotFound, "xxx not found")
        }
        zlog.Error("query xxx failure", zap.Error(err))
        return nil, status.Error(codes.Internal, "query xxx failure")
    }

    return &pb.GetXxxResponse{
        Field1: x.Field1,
        Field2: x.Field2,
    }, nil
}

// ── 创建（含事务）──────────────────────────────────────────────
func (s *XxxService) CreateXxx(ctx context.Context, req *pb.CreateXxxRequest) (*pb.CreateXxxResponse, error) {
    if req.Field == "" {
        return nil, status.Error(codes.InvalidArgument, "field is required")
    }

    tx, err := dbmysql.DB.BeginTx(ctx, nil)
    if err != nil {
        zlog.Error("begin transaction failure", zap.Error(err))
        return nil, status.Error(codes.Internal, "create xxx failure")
    }

    isCommit := false
    defer func() {
        if !isCommit {
            if err := tx.Rollback(); err != nil {
                zlog.Error("rollback transaction failure", zap.Error(err))
            }
        }
    }()

    // INSERT 主表
    if _, err := insertXxx(ctx, tx, &model.Xxx{ /* ... */ }); err != nil {
        var mysqlErr *mysql.MySQLError
        if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
            return nil, status.Error(codes.AlreadyExists, "xxx already exists")
        }
        zlog.Error("insert xxx failure", zap.Error(err))
        return nil, status.Error(codes.Internal, "create xxx failure")
    }

    if err := tx.Commit(); err != nil {
        zlog.Error("commit transaction failure", zap.Error(err))
        return nil, status.Error(codes.Internal, "create xxx failure")
    }
    isCommit = true

    return &pb.CreateXxxResponse{Id: "xxx"}, nil
}

// ── 更新（含状态检查）──────────────────────────────────────────
func (s *XxxService) UpdateXxx(ctx context.Context, req *pb.UpdateXxxRequest) (*pb.UpdateXxxResponse, error) {
    if req.Id == "" {
        return nil, status.Error(codes.InvalidArgument, "id is required")
    }

    m, err := selectXxxByID(ctx, dbmysql.DB, req.Id)
    if err != nil {
        if errors.Is(err, model.ErrNotFound) {
            return nil, status.Error(codes.NotFound, "xxx not found")
        }
        zlog.Error("query xxx failure", zap.Error(err))
        return nil, status.Error(codes.Internal, "update xxx failure")
    }

    if m.Status != 1 {
        return nil, status.Error(codes.PermissionDenied, "xxx is frozen or inactive")
    }

    if _, err := updateXxx(ctx, dbmysql.DB, req.Id, req.Field); err != nil {
        zlog.Error("update xxx failure", zap.Error(err))
        return nil, status.Error(codes.Internal, "update xxx failure")
    }

    return &pb.UpdateXxxResponse{}, nil
}

// ── 软删除 ─────────────────────────────────────────────────────
func (s *XxxService) DeleteXxx(ctx context.Context, req *pb.DeleteXxxRequest) (*pb.DeleteXxxResponse, error) {
    if req.Id == "" {
        return nil, status.Error(codes.InvalidArgument, "id is required")
    }

    if _, err := softDeleteXxx(ctx, dbmysql.DB, req.Id); err != nil {
        zlog.Error("soft delete xxx failure", zap.Error(err))
        return nil, status.Error(codes.Internal, "delete xxx failure")
    }

    return &pb.DeleteXxxResponse{}, nil
}

// ════════════════════════════════════════════════════════════════
// 5. 辅助方法（限流 / 令牌 / 缓存）
// ════════════════════════════════════════════════════════════════

// ── 账户级登录限流（Redis 计数器 + 锁）─────────────────────────
func (s *XxxService) recordFailedAttempt(ctx context.Context, _ string, identity string) error {
    attemptKey := fmt.Sprintf("login_attempt:%s", identity)
    attempts, err := redisIncr(ctx, attemptKey)
    if err != nil {
        return err
    }
    if attempts == 1 {
        redisExpire(ctx, attemptKey, s.cfg.LoginLockDuration)
    }
    if int(attempts) >= s.cfg.MaxLoginAttempts {
        lockKey := fmt.Sprintf("login_lock:%s", identity)
        redisSet(ctx, lockKey, "1", s.cfg.LoginLockDuration)
        redisDel(ctx, attemptKey)
    }
    return nil
}

// ── IP 级登录限流 ──────────────────────────────────────────────
func (s *XxxService) recordIPFailedAttempt(ctx context.Context, ipAddr string) error {
    attemptKey := fmt.Sprintf("login_attempt:ip:%s", ipAddr)
    attempts, err := redisIncr(ctx, attemptKey)
    if err != nil {
        return err
    }
    if attempts == 1 {
        redisExpire(ctx, attemptKey, s.cfg.IPLoginLockDuration)
    }
    if int(attempts) >= s.cfg.MaxIPLoginAttempts {
        lockKey := fmt.Sprintf("login_lock:ip:%s", ipAddr)
        redisSet(ctx, lockKey, "1", s.cfg.IPLoginLockDuration)
        redisDel(ctx, attemptKey)
    }
    return nil
}

// ── 令牌生成模板 ───────────────────────────────────────────────
func (s *XxxService) createTokenPair(ctx context.Context, accountID, role string) (accessToken, refreshToken string, err error) {
    accessToken, err = jwtCreateToken(accountID, role, s.cfg.AccessTokenExpire)
    if err != nil {
        return "", "", err
    }
    refreshToken, err = jwtCreateToken(accountID, role, s.cfg.RefreshTokenExpire)
    if err != nil {
        return "", "", err
    }
    return accessToken, refreshToken, nil
}

// ════════════════════════════════════════════════════════════════
// 6. 测试替换示例
// ════════════════════════════════════════════════════════════════
//
// func TestXxxService(t *testing.T) {
//     orig := selectXxxByID
//     t.Cleanup(func() { selectXxxByID = orig })
//     selectXxxByID = func(_ context.Context, _ dbmysql.Exec, id string) (*model.Xxx, error) {
//         if id == "not_found" {
//             return nil, model.ErrNotFound
//         }
//         return &model.Xxx{ID: id, Status: 1}, nil
//     }
//     // ... test logic
// }
```

## 关键范式速查

| 范式 | 描述 |
|------|------|
| 三层 DI（model / redis / auth） | 包变量函数替换 → 测试 mock |
| 输入校验 → `status.Error(codes.XXX, msg)` | 每个 RPC 方法开头 |
| proto enum → string | helper 函数统一转换 |
| 事务 + defer Rollback + commit | 多表写入必须事务 |
| 1062 重复 → `codes.AlreadyExists` | MySQL 唯一键冲突处理 |
| `model.ErrNotFound` → `codes.NotFound` | 查询结果不存在 |
| 状态判断 → `codes.PermissionDenied` | 账号被冻结/停用 |
| Redis 计数器 + 锁 → `codes.ResourceExhausted` | 登录限流（账户级 + IP 级） |
| `zlog.Error` 记录内部错误 | 所有错误路径，不暴露给客户端 |
| 包变量函数替换 → mock 测试 | `t.Cleanup` 恢复原始值 |
| 令牌旋转（hash + Redis） | refresh token 滚动更新 + 旧令牌作废 |
