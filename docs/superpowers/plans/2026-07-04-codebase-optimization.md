# 代码精简优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对 personal-service 代码库进行全面精简优化，删除死代码、去重、修复 Bug、修复安全隐患和架构调整。

**Architecture:** 分 4 个阶段增量推进，每阶段独立验证。删除 ~750 行未使用代码，去重 ~250 行，修复 5 个 Bug、5 个安全隐患、4 个架构问题。

**Tech Stack:** Go 1.26.3, Echo v4, gRPC, Protobuf, MySQL, Redis, etcd

## Global Constraints

- 所有变更必须通过 `make fmt && go build ./... && go test ./... && go vet ./...`
- 不修改测试文件（除删除整个测试文件的情况）
- 不添加新功能
- 保留 `lib/log/` 不做合并

---

## 第 1 阶段：删除死代码 + 去重

### Task 1: 删除未使用的包和文件

**Files:**
- Delete: `lib/language/simplifiedchinese.go`
- Delete: `lib/timeutil/weekday.go`
- Delete: `lib/timeutil/ticker.go`
- Delete: `lib/fsutil/sha256sum.go`
- Delete: `lib/fsutil/filepath.go`
- Delete: `lib/fsutil/paniclog.go`
- Delete: `lib/procutil/pid.go`

- [ ] **Step 1: 删除 lib/language/ 整个包**

```bash
rm -rf lib/language/
```

- [ ] **Step 2: 删除 lib/timeutil/weekday.go**

```bash
rm lib/timeutil/weekday.go
```

- [ ] **Step 3: 删除 lib/timeutil/ticker.go**

```bash
rm lib/timeutil/ticker.go
```

- [ ] **Step 4: 删除 lib/fsutil/ 中未使用的文件**

```bash
rm lib/fsutil/sha256sum.go lib/fsutil/filepath.go lib/fsutil/paniclog.go
```

- [ ] **Step 5: 删除 lib/procutil/pid.go**

```bash
rm lib/procutil/pid.go
```

- [ ] **Step 6: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 7: 提交**

```bash
git add -A && git commit -m "chore: delete unused packages and files"
```

---

### Task 2: 删除未使用函数（保留文件）

**Files:**
- Modify: `lib/netutil/ip.go`
- Modify: `lib/netutil/port.go`
- Modify: `lib/timeutil/duration.go`
- Modify: `lib/auth/statetoken.go`
- Modify: `lib/auth/context.go`
- Modify: `lib/procutil/process.go`
- Modify: `lib/db/mysql/client.go`

- [ ] **Step 1: 清理 lib/netutil/ip.go — 删除未使用函数**

删除以下函数和类型：
- `GetInterfaceFirst()` (行 20-38)
- `GetLocalareaIP()` (行 49-67)
- `GetInterfaceIPList()` (行 99-133)
- `IPNetworkInfo` 结构体及相关函数 `GetIPNetworkInfo()`, `calculateGatewayIP()` (行 136-262)

保留 `GetInterfaceIPv4First()` (被 `apps/personal-api/pkg/config/config.go` 调用)。

- [ ] **Step 2: 清理 lib/netutil/port.go — 删除 IsPortAvailable**

删除 `IsPortAvailable()` 函数 (行 23-30)。

- [ ] **Step 3: 清理 lib/timeutil/duration.go — 删除未使用函数**

删除以下函数：
- `ParseDurationWithString()` (行 39-48)
- `ParseDurationWithInt32()` (行 50-55)
- `YearWeek()` (行 102-118)

- [ ] **Step 4: 清理 lib/auth/statetoken.go — 删除 StateTokenWithExists**

删除 `StateTokenWithExists()` 函数 (行 66-77)。

- [ ] **Step 5: 清理 lib/auth/context.go — 删除 TokenFromContext**

删除 `TokenFromContext()` 函数 (行 25-27)。

- [ ] **Step 6: 清理 lib/procutil/process.go — 删除未使用函数**

删除以下函数：
- `FindProcessWithPid()` (行 17-26)
- `FindProcessWithPidFile()` (行 28-39)
- `StopProcessWithPidFile()` (行 41-51)

- [ ] **Step 7: 清理 lib/db/mysql/client.go — 删除 QueryPerLimit 常量**

删除 `QueryPerLimit` 常量定义。

- [ ] **Step 8: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 9: 提交**

```bash
git add -A && git commit -m "chore: remove unused functions from remaining files"
```

---

### Task 3: 提取共享 ResetSystem()

**Files:**
- Modify: `lib/netutil/config.go`
- Modify: `apps/personal-api/pkg/config/config.go`
- Modify: `apps/personal-auth/pkg/config/config.go`
- Modify: `apps/personal-core/pkg/config/config.go`

- [ ] **Step 1: 在 lib/netutil/config.go 中添加 ResetSystem 方法**

在 `lib/netutil/config.go` 中添加：

```go
func (c *Config) ResetSystem() {
	if c.BindIP != "" {
		system.Network.SetBindIP(c.BindIP)
	} else {
		system.Network.SetBindIP("0.0.0.0")
	}
	if c.AccessIP != "" {
		system.Network.SetAccessIP(c.AccessIP)
	} else if system.Network.BindIP() == "0.0.0.0" {
		ip, err := GetInterfaceIPv4First()
		if err != nil {
			system.Network.SetAccessIP("0.0.0.0")
		} else {
			system.Network.SetAccessIP(ip)
		}
	} else {
		system.Network.SetAccessIP(system.Network.BindIP())
	}
}
```

- [ ] **Step 2: 修改三个 app 的 config.go — 删除本地 ResetSystem()，调用共享方法**

在 `apps/personal-api/pkg/config/config.go`、`apps/personal-auth/pkg/config/config.go`、`apps/personal-core/pkg/config/config.go` 中：

删除本地的 `ResetSystem()` 方法，将 `ReadConfigFromFile()` 中的 `cfg.ResetSystem()` 改为 `cfg.Network.ResetSystem()`。

- [ ] **Step 3: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "refactor: extract shared ResetSystem() to lib/netutil"
```

---

### Task 4: 统一 Cookie Helper

**Files:**
- Modify: `lib/http/middleware/jwt.go`
- Modify: `apps/personal-api/pkg/handler/utils.go`

- [ ] **Step 1: 确认 lib/http/middleware/jwt.go 中已有 setTokenCookies/clearTokenCookies**

检查 `lib/http/middleware/jwt.go` 中是否已有这两个函数。如果有，直接使用；如果没有，需要添加。

- [ ] **Step 2: 修改 apps/personal-api/pkg/handler/utils.go — 删除本地副本**

删除 `setTokenCookies()` 和 `clearTokenCookies()` 的本地定义，改为调用 `middleware` 包中的版本。

如果 handler 中需要直接调用 cookie 函数，可以在 handler 包中创建 wrapper 调用 middleware 包。

- [ ] **Step 3: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "refactor: unify cookie helpers to lib/http/middleware"
```

---

### Task 5: 提取共享启动逻辑

**Files:**
- Create: `lib/startup/startup.go`
- Modify: `apps/personal-api/cmd/root.go`
- Modify: `apps/personal-auth/cmd/root.go`

- [ ] **Step 1: 创建 lib/startup/startup.go**

```go
package startup

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/eviltomorrow/personal-service/lib/buildinfo"
	"github.com/eviltomorrow/personal-service/lib/finalizer"
	"github.com/eviltomorrow/personal-service/lib/flagsutil"
	"github.com/eviltomorrow/personal-service/lib/pprofutil"
	"github.com/eviltomorrow/personal-service/lib/procutil"
	"github.com/eviltomorrow/personal-service/lib/system"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.uber.org/zap"
)

type AppContext struct {
	ConfigFile string
	AppName    string
}

func Run(opts *flagsutil.Flags, appName string, initServer func(cfgFile string) error) error {
	if _, err := flagsutil.Parse(opts); err != nil {
		return err
	}

	if opts.Version {
		fmt.Println(buildinfo.Version())
		return nil
	}

	if opts.Daemon {
		if err := procutil.RunAppInBackground(os.Args); err != nil {
			return fmt.Errorf("run daemon failure: %w", err)
		}
		return nil
	}

	if opts.EnablePprof {
		go func() {
			if err := pprofutil.Run(opts.PprofAddr); err != nil {
				zlog.Error("pprof startup failure", zap.Error(err))
			}
		}()
	}
	defer finalizer.RunCleanupFuncs()

	if err := initServer(opts.ConfigFile); err != nil {
		return err
	}

	procutil.StopDaemon()
	procutil.WaitForSigterm()

	return nil
}

func InitLogger(cfgLevel string, disableStdlog bool) error {
	global, prop, err := zlog.InitLogger(&zlog.Config{
		Level:  cfgLevel,
		Format: "json",
		File: zlog.FileLogConfig{
			Filename:    filepath.Join(system.Directory.LogDir(), "data.log"),
			MaxSize:     100,
			MaxDays:     30,
			MaxBackups:  90,
			Compression: "gzip",
		},
		DisableStacktrace: true,
		DisableStdlog:     disableStdlog,
	})
	if err != nil {
		return fmt.Errorf("init global log failure, nest error: %v", err)
	}
	zlog.ReplaceGlobals(global, prop)
	finalizer.RegisterCleanupFuncs(global.Sync)
	return nil
}
```

- [ ] **Step 2: 重构 apps/personal-auth/cmd/root.go 使用共享逻辑**

```go
package cmd

import (
	"fmt"
	"path/filepath"

	"github.com/eviltomorrow/personal-service/lib/buildinfo"
	"github.com/eviltomorrow/personal-service/lib/flagsutil"
	"github.com/eviltomorrow/personal-service/lib/startup"
	"github.com/eviltomorrow/personal-service/lib/system"
	"github.com/eviltomorrow/personal-service/lib/zlog"
	"go.uber.org/zap"

	appconfig "github.com/eviltomorrow/personal-service/apps/personal-auth/pkg/config"
	appserver "github.com/eviltomorrow/personal-service/apps/personal-auth/pkg/server"
)

func Run() error {
	return startup.Run(flagsutil.Opts, "personal-auth", func(cfgFile string) error {
		cfg, err := appconfig.ReadConfigFromFile(flagsutil.Opts)
		if err != nil {
			return fmt.Errorf("load config failure: %w", err)
		}

		if err := startup.InitLogger(cfg.Log.Level, cfg.Log.DisableStdlog); err != nil {
			return err
		}

		zlog.Info("app is preparing to launch, initializing environment...")

		srv, err := appserver.New(cfg)
		if err != nil {
			return fmt.Errorf("create server failure: %w", err)
		}

		if err := srv.Serve(); err != nil {
			return fmt.Errorf("start server failure: %w", err)
		}

		zlog.Info("system info", zap.String("detail", system.String()))
		zlog.Info("config info", zap.String("detail", cfg.String()))
		zlog.Info("app start success", zap.String("version", buildinfo.MainVersion), zap.String("commited-id", buildinfo.GitSha))
		zlog.Info("app stop completed", zap.String("launched-time", system.LaunchTime()))

		return nil
	})
}
```

- [ ] **Step 3: 重构 apps/personal-api/cmd/root.go 使用共享逻辑**

类似 personal-auth 的重构方式。

- [ ] **Step 4: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 5: 提交**

```bash
git add -A && git commit -m "refactor: extract shared startup logic to lib/startup"
```

---

## 第 2 阶段：修复 Bug 和逻辑错误

### Task 6: 修复 zlog Validate() 空操作

**Files:**
- Modify: `lib/zlog/config.go`

- [ ] **Step 1: 修复 Validate() 方法**

在 `lib/zlog/config.go` 的 `Validate()` 方法中，找到循环遍历 allowed levels 的部分，在循环结束后添加：

```go
return fmt.Errorf("invalid log level: %s, allowed: debug, info, warn, error, dpanic, panic, fatal", c.Level)
```

- [ ] **Step 2: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 3: 提交**

```bash
git add lib/zlog/config.go && git commit -m "fix: zlog Validate() now returns error for invalid levels"
```

---

### Task 7: 修复 netutil IP 冗余分支

**Files:**
- Modify: `lib/netutil/ip.go`

- [ ] **Step 1: 简化网关 IP 格式化逻辑**

在 `lib/netutil/ip.go` 中找到 `if isIPv6` 分支，将整个 if-else 替换为：

```go
gatewayStr := gatewayIP.String()
```

- [ ] **Step 2: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 3: 提交**

```bash
git add lib/netutil/ip.go && git commit -m "fix: remove redundant IPv6/IPv4 branch in netutil"
```

---

### Task 8: 修复 circuit breaker 吞错误

**Files:**
- Modify: `lib/grpc/middleware/circuitbreaker.go`

- [ ] **Step 1: 修改 fallback 函数返回错误**

在 `lib/grpc/middleware/circuitbreaker.go` 中，将 fallback 函数从返回 `nil` 改为返回 gRPC 错误：

```go
fallback: func(err error) error {
    return status.Error(codes.Unavailable, "circuit breaker open: "+err.Error())
},
```

- [ ] **Step 2: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 3: 提交**

```bash
git add lib/grpc/middleware/circuitbreaker.go && git commit -m "fix: circuit breaker now returns error instead of nil"
```

---

### Task 9: 修复 JWT 重复错误处理

**Files:**
- Modify: `lib/auth/jwt.go`

- [ ] **Step 1: 简化 JwtWithParseToken 错误处理**

在 `lib/auth/jwt.go` 的 `JwtWithParseToken` 函数中，合并两个重复的 switch 语句。简化为：

```go
func JwtWithParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return SigningKey, nil
	})
	if err != nil {
		if ve, ok := err.(*jwt.ValidationError); ok {
			if ve.Errors&jwt.ValidationErrorExpired != 0 {
				return nil, ErrTokenExpired
			}
			if ve.Errors&jwt.ValidationErrorNotValidYet != 0 {
				return nil, ErrTokenNotValidYet
			}
		}
		return nil, ErrTokenNotValidYet
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrTokenNotValidYet
	}
	return claims, nil
}
```

- [ ] **Step 2: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 3: 提交**

```bash
git add lib/auth/jwt.go && git commit -m "fix: simplify JWT error handling and add algorithm validation"
```

---

## 第 3 阶段：修复安全隐患

### Task 10: 修复 PBKDF2 panic

**Files:**
- Modify: `lib/encrypt/pbkdf2.go`

- [ ] **Step 1: 修改 Salt() 函数签名**

将 `func Salt() string` 改为 `func Salt() (string, error)`，将 `panic(err)` 改为 `return "", err`。

- [ ] **Step 2: 更新所有调用方**

搜索所有调用 `encrypt.Salt()` 的地方，添加错误处理。主要在：
- `apps/personal-auth/pkg/service/auth.go` 的 Register 方法

- [ ] **Step 3: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 4: 提交**

```bash
git add lib/encrypt/pbkdf2.go && git commit -m "fix: PBKDF2 Salt() now returns error instead of panic"
```

---

### Task 11: Snowflake Machine ID 可配置

**Files:**
- Modify: `lib/snowflake/id.go`

- [ ] **Step 1: 支持环境变量**

修改 `lib/snowflake/id.go`，从环境变量读取 machine ID：

```go
func init() {
	machineID = 1
	if v := os.Getenv("SNOWFLAKE_MACHINE_ID"); v != "" {
		id, err := strconv.ParseInt(v, 10, 64)
		if err == nil && id >= 0 && id <= 1023 {
			machineID = id
		}
	}
}
```

- [ ] **Step 2: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 3: 提交**

```bash
git add lib/snowflake/id.go && git commit -m "feat: make snowflake machine ID configurable via env"
```

---

### Task 12: 修复 JWT 默认签名密钥

**Files:**
- Modify: `lib/auth/jwt.go`

- [ ] **Step 1: 移除弱默认值**

将 `var SigningKey = []byte("123")` 改为 `var SigningKey []byte`。

在 `JwtWithCreateToken` 和 `JwtWithParseToken` 函数开头添加检查：

```go
if len(SigningKey) == 0 {
    panic("auth.SigningKey not initialized")
}
```

- [ ] **Step 2: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 3: 提交**

```bash
git add lib/auth/jwt.go && git commit -m "fix: remove weak default JWT signing key"
```

---

### Task 13: 日志脱敏 signing_key

**Files:**
- Modify: `apps/personal-api/pkg/config/config.go`
- Modify: `apps/personal-auth/pkg/config/config.go`

- [ ] **Step 1: 修改 personal-api 的 ServiceConfig.String()**

在 `apps/personal-api/pkg/config/config.go` 的 `String()` 方法中，将 `signing_key` 字段脱敏：

```go
"signing_key": "***",
```

- [ ] **Step 2: 修改 personal-auth 的 AuthConfig.String()**

在 `apps/personal-auth/pkg/config/config.go` 的 `String()` 方法中，将 `signing_key` 字段脱敏：

```go
"signing_key": "***",
```

- [ ] **Step 3: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 4: 提交**

```bash
git add apps/personal-api/pkg/config/config.go apps/personal-auth/pkg/config/config.go && git commit -m "fix: mask signing_key in config logs"
```

---

## 第 4 阶段：架构调整

### Task 14: 移动 gRPC client 工厂到 apps/personal-api

**Files:**
- Move: `lib/grpc/client/auth.go` → `apps/personal-api/pkg/provider/auth.go`
- Move: `lib/grpc/client/profile.go` → `apps/personal-api/pkg/provider/profile.go`
- Move: `lib/grpc/client/cash_flow.go` → `apps/personal-api/pkg/provider/cash_flow.go`
- Move: `lib/grpc/client/balance_sheet.go` → `apps/personal-api/pkg/provider/balance_sheet.go`
- Move: `lib/grpc/client/portfolio.go` → `apps/personal-api/pkg/provider/portfolio.go`
- Modify: `apps/personal-api/pkg/server/server.go` (更新导入路径)

- [ ] **Step 1: 移动文件**

```bash
mv lib/grpc/client/auth.go apps/personal-api/pkg/provider/
mv lib/grpc/client/profile.go apps/personal-api/pkg/provider/
mv lib/grpc/client/cash_flow.go apps/personal-api/pkg/provider/
mv lib/grpc/client/balance_sheet.go apps/personal-api/pkg/provider/
mv lib/grpc/client/portfolio.go apps/personal-api/pkg/provider/
```

- [ ] **Step 2: 更新 package 声明**

将每个文件的 `package client` 改为 `package provider`。

- [ ] **Step 3: 更新导入路径**

在 `apps/personal-api/pkg/server/server.go` 中更新导入路径，从 `lib/grpc/client` 改为 `apps/personal-api/pkg/provider`。

- [ ] **Step 4: 删除 lib/grpc/client/ 中已移动的文件**

```bash
rm lib/grpc/client/auth.go lib/grpc/client/profile.go lib/grpc/client/cash_flow.go lib/grpc/client/balance_sheet.go lib/grpc/client/portfolio.go
```

- [ ] **Step 5: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 6: 提交**

```bash
git add -A && git commit -m "refactor: move gRPC client factories to apps/personal-api/pkg/provider"
```

---

### Task 15: 删除未使用的 circuit breaker 中间件

**Files:**
- Delete: `lib/grpc/middleware/circuitbreaker.go`
- Delete: `lib/grpc/middleware/circuitbreaker_test.go`

- [ ] **Step 1: 删除文件**

```bash
rm lib/grpc/middleware/circuitbreaker.go lib/grpc/middleware/circuitbreaker_test.go
```

- [ ] **Step 2: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 3: 提交**

```bash
git add -A && git commit -m "chore: remove unused circuit breaker middleware"
```

---

### Task 16: 删除未使用的 DisableTLS 字段

**Files:**
- Modify: `lib/netutil/config.go`
- Modify: `apps/personal-api/pkg/config/config.go`
- Modify: `apps/personal-auth/pkg/config/config.go`
- Modify: `apps/personal-core/pkg/config/config.go`

- [ ] **Step 1: 从 netutil.Config 中删除 DisableTLS**

在 `lib/netutil/config.go` 中删除 `DisableTLS` 字段。

- [ ] **Step 2: 从三个 app 的默认配置中删除 DisableTLS**

在 `apps/personal-api/pkg/config/config.go`、`apps/personal-auth/pkg/config/config.go`、`apps/personal-core/pkg/config/config.go` 的 `DefaultConfig` 中删除 `DisableTLS: true`。

- [ ] **Step 3: 验证编译通过**

```bash
make fmt && go build ./...
```

- [ ] **Step 4: 提交**

```bash
git add -A && git commit -m "chore: remove unused DisableTLS config field"
```

---

## 最终验证

- [ ] **Step 1: 完整验证**

```bash
make fmt && go build ./... && go test ./... && go vet ./...
```

- [ ] **Step 2: 统计减少的代码行数**

```bash
git diff --stat HEAD~16
```
