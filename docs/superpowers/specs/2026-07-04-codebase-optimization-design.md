# 代码精简优化设计

**日期:** 2026-07-04
**版本:** 1.0
**状态:** 已批准

## 概述

对 personal-service 代码库进行全面精简优化，包括删除死代码、去重、修复 Bug、修复安全隐患和架构调整。

## 目标

- 删除 ~750 行未使用代码
- 去重 ~250 行重复代码
- 修复 5 个 Bug/逻辑错误
- 修复 5 个安全隐患
- 修复 4 个架构问题

## 实施方案

分 4 个阶段增量推进，每阶段独立验证。

---

## 第 1 阶段：删除死代码 + 去重

### 1.1 删除未使用的包/文件

| 删除目标 | 行数 | 原因 |
|----------|------|------|
| `lib/language/` 整个包 | 50 | 从未导入 |
| `lib/timeutil/weekday.go` | 24 | 从未调用 |
| `lib/timeutil/ticker.go` | 297 | 三种 ticker 类型从未实例化 |
| `lib/fsutil/sha256sum.go` | 38 | 从未调用 |
| `lib/fsutil/filepath.go` | 12 | 从未调用 |
| `lib/fsutil/paniclog.go` | 27 | 从未调用 |
| `lib/procutil/pid.go` | 35 | 从未调用 |

### 1.2 删除未使用函数（保留文件）

| 文件 | 删除内容 | 行数 |
|------|----------|------|
| `lib/netutil/ip.go` | `GetInterfaceFirst`, `GetLocalareaIP`, `GetInterfaceIPList`, `IPNetworkInfo`, `GetIPNetworkInfo`, `calculateGatewayIP` | 243 |
| `lib/netutil/port.go` | `IsPortAvailable` | 7 |
| `lib/timeutil/duration.go` | `ParseDurationWithString`, `ParseDurationWithInt32`, `YearWeek` | 30 |
| `lib/auth/statetoken.go` | `StateTokenWithExists` | 11 |
| `lib/auth/context.go` | `TokenFromContext` | 3 |
| `lib/procutil/process.go` | `FindProcessWithPid`, `FindProcessWithPidFile`, `StopProcessWithPidFile` | 35 |
| `lib/db/mysql/client.go` | `QueryPerLimit` 常量 | 1 |

### 1.3 去重

| 重复代码 | 方案 |
|----------|------|
| `ResetSystem()` 三份相同 | 提取到 `lib/netutil/config.go`，三个 app 共享 |
| `setTokenCookies/clearTokenCookies` 两份 | 统一到 `lib/http/middleware/jwt.go`，handler 调用 |
| `cmd/root.go` Run() 两份近似 | 提取共享启动逻辑到 `lib/startup/` 包 |

---

## 第 2 阶段：修复 Bug 和逻辑错误

| # | 文件 | 问题 | 修复方案 |
|---|------|------|----------|
| B1 | `lib/zlog/config.go:84-91` | `Validate()` 永远返回 `nil` | 加入 `return fmt.Errorf("invalid level: %s", c.Level)` |
| B2 | `lib/netutil/ip.go:183-186` | IPv6/IPv4 分支代码完全相同 | 删除冗余分支，直接 `gatewayStr = gatewayIP.String()` |
| B3 | `lib/grpc/middleware/circuitbreaker.go:28` | 电路断开时返回 `nil` 吞掉错误 | 返回 `status.Error(codes.Unavailable, "circuit breaker open")` |
| B4 | `lib/auth/jwt.go:42-79` | 重复的错误检查逻辑 | 简化控制流，合并两个 switch |
| B5 | `lib/auth/jwt.go:43` | 缺少签名算法验证 | 加入 `token.Method.(*jwt.SigningMethodHMAC)` 检查 |

---

## 第 3 阶段：修复安全隐患

| # | 文件 | 问题 | 修复方案 |
|---|------|------|----------|
| S1 | `lib/encrypt/pbkdf2.go:14` | `panic(err)` 当 crypto/rand 失败时 | 改为 `return "", err`，调用方处理错误 |
| S2 | `lib/snowflake/id.go:11` | 硬编码 `machineID = 1` | 支持环境变量 `SNOWFLAKE_MACHINE_ID`，默认 1 |
| S3 | `lib/auth/jwt.go:12` | 默认签名密钥 `[]byte("123")` | 改为空 `[]byte{}`，启动时必须显式设置，未设置则 panic |
| S4 | `apps/personal-api/pkg/config/config.go:70-78` | 日志明文输出 `signing_key` | 脱敏处理，输出 `***` |
| S5 | `apps/personal-auth/pkg/config/config.go:87-99` | 同上 | 同上 |

---

## 第 4 阶段：架构调整

| # | 问题 | 修复方案 |
|---|------|----------|
| A1 | `lib/grpc/client/` 反向依赖 `apps/*/adapter/pb` | 将 5 个工厂文件移到 `apps/personal-api/pkg/provider/` |
| A2 | circuit breaker 中间件定义但未接入 | 删除未使用的 `lib/grpc/middleware/circuitbreaker.go` 及其测试 |
| A4 | `netutil.Config.DisableTLS` 字段从未使用 | 删除该字段，三个 app 的 config 中也删除 |

---

## 验证方案

每阶段完成后执行：

1. `make fmt` — 代码格式化
2. `go build ./...` — 编译检查
3. `go test ./...` — 单元测试
4. `go vet ./...` — 静态分析

## 风险评估

| 阶段 | 风险等级 | 缓解措施 |
|------|----------|----------|
| 第 1 阶段 | 低 | 仅删除未使用代码，不影响运行时行为 |
| 第 2 阶段 | 中 | Bug 修复可能改变行为，需仔细测试 |
| 第 3 阶段 | 中 | 安全修复可能影响兼容性（如签名密钥） |
| 第 4 阶段 | 中 | 架构调整涉及文件移动和导入路径变更 |

## 不包含的内容

- `lib/log/` 保留不动，不做与 `lib/zlog/` 的合并
- 不修改测试文件
- 不添加新功能
