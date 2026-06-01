---
name: project-structure
description: 使用此 skill 处理 personal-auth（gRPC 认证服务）和 personal-api（HTTP API 网关）的认证功能开发，包括注册、登录、令牌管理、账户管理等。
---

# 1、原则

- 遵照 KISS 原则，极简设计理念
- 相似功能函数的参数要相同，返回参数也要相同
- 结构清晰、简单
- HTTP API 前缀为 `/api/v1`

# 2、项目架构

```
Client → personal-api (HTTP/JSON, Echo v4, :8080) → gRPC → personal-auth (:50001) → MySQL + Redis
```

- personal-api 通过 etcd 自定义 resolver (`etcd:///grpclb/personal-auth`) 发现 personal-auth，round-robin 负载均衡
- personal-auth 启动时在 etcd 注册自身到 `/grpclb/personal-auth/<host>:<port>`

# 3、微服务结构模板

## personal-auth (gRPC 服务)

```
apps/personal-auth/
├── main.go                 # entry: buildinfo → system.LoadRuntime() → cmd.Run()
├── cmd/
│   └── root.go             # 启动编排: flag → config → log → server → sigterm
├── conf/
│   └── etc/
│       └── config.toml
├── adapter/
│   ├── auth.proto          # gRPC service + message 定义
│   └── pb/
│       ├── auth.pb.go      # protoc 生成的消息
│       └── auth_grpc.pb.go # protoc 生成的接口 + 注册
├── pkg/
│   ├── config/
│   │   └── config.go       # Viper 加载 TOML → struct
│   ├── model/
│   │   ├── errors.go       # ErrNotFound 哨兵
│   │   ├── account.go      # accounts 表: CRUD + JOIN
│   │   ├── account_auth.go # account_auths 表: Insert/Delete/Replace
│   │   └── login_history.go# login_history 表: Insert
│   ├── server/
│   │   └── server.go       # DI 装配: MySQL → Redis → etcd → service → gRPC
│   └── service/
│       └── auth.go         # gRPC handler impl + DI 包变量
└── scripts/
    ├── fs.go               # //go:embed init-sql/*.sql
    └── init-sql/
        ├── 01_accounts.sql
        ├── 02_account_auths.sql
        └── 03_login_history.sql
```

## personal-api (HTTP API 网关)

```
apps/personal-api/
├── main.go                 # entry
├── cmd/
│   └── root.go             # 启动编排
├── conf/
│   └── etc/
│       └── config.toml
├── pkg/
│   ├── config/
│   │   └── config.go       # Viper 加载
│   ├── model/
│   │   └── auth.go         # 请求/响应 struct + AuthClient interface
│   ├── service/
│   │   └── auth.go         # model type ↔ proto type 转换 + gRPC 调用
│   ├── handler/
│   │   ├── router.go       # 路由注册插件模式
│   │   ├── auth.go         # HTTP handler (Echo) → model.AuthClient
│   │   └── utils.go        # Respond helper + GrpcStatusToHTTP 映射
│   ├── provider/
│   │   ├── provider.go     # 初始化编排
│   │   └── auth.go         # gRPC client 初始化
│   └── server/
│       └── server.go       # DI 装配: etcd → opentrace → provider → Echo
```

# 4、各层职责 & 模板代码

## gRPC 服务端 (personal-auth)

| 层 | 目录 | 职责 |
|----|------|------|
| 接口定义 | `adapter/` | proto 文件定义 service + message |
| 数据访问 | `pkg/model/` | 表模型 struct + CRUD (sqlutil 链式调用) |
| 业务逻辑 | `pkg/service/` | gRPC handler 实现 + DI 函数变量 |
| DI 装配 | `pkg/server/` | 基础设施初始化 + gRPC server 构建 |
| 启动编排 | `cmd/root.go` | flag → config → log → server → sigterm |

### 1. `cmd/root.go` — 启动编排

参见 [cmd.md](references/cmd.md)

### 2. `pkg/config/config.go` — 配置层

参见 [config.md](references/config.md)

### 3. `pkg/model/*.go` — 数据访问层

参见 [model.md](references/model.md)

### 4. `pkg/service/*.go` — 业务逻辑层

参见 [service.md](references/service.md)

### 5. `pkg/server/server.go` — DI 装配层

参见 [server.md](references/server.md)

### 6. `adapter/*.proto` — 接口定义

参见 [proto.md](references/proto.md)

### 7. `scripts/fs.go` — 嵌入 SQL

```go
package scripts

import "embed"

//go:embed init-sql/*.sql
var FS embed.FS
```

## HTTP API 网关 (personal-api)

| 层 | 目录 | 职责 |
|----|------|------|
| 类型定义 | `pkg/model/` | HTTP 请求/响应 struct + AuthClient interface |
| 数据转换 | `pkg/service/` | model type ↔ proto type 转换, 调用 gRPC |
| HTTP 处理 | `pkg/handler/` | Echo handler, 绑定 JSON, 调用 AuthClient, 返回统一响应 |
| 路由注册 | `pkg/handler/router.go` | 插件模式, `init()` 自注册 |
| 客户端初始化 | `pkg/provider/` | 创建 gRPC 连接 + AuthService |
| DI 装配 | `pkg/server/` | etcd → opentrace → provider → Echo |

# 5、关键约定

## 统一响应格式

所有 HTTP 响应格式: `{ "code": int, "message": string, "data": ?any }`

gRPC status → HTTP 状态码映射 (`handler/utils.go`):
| gRPC Code | HTTP Status |
|-----------|-------------|
| `InvalidArgument` | 400 |
| `Unauthenticated` | 401 |
| `PermissionDenied` | 403 |
| `NotFound` | 404 |
| `AlreadyExists` | 409 |
| `ResourceExhausted` | 429 |
| `Unimplemented` | 501 |
| `Unavailable` | 503 |
| `DeadlineExceeded` | 504 |
| default | 500 |

## Redis Key 约定

| Key Pattern | 用途 | TTL |
|-------------|------|-----|
| `token_<sha256_hash>` → `account_id:role` | refresh token 存储 | refresh_token expire |
| `token_account_<id>` (hash) | 账号下所有 refresh token 索引 | 无过期 (随 token 清理) |
| `login_attempt:<identifier>` | 登录失败计数器 | lock_duration |
| `login_lock:<identifier>` | 账户登录锁定 | lock_duration |
| `login_attempt:ip:<ip>` | IP 级失败计数器 | ip_lock_duration |
| `login_lock:ip:<ip>` | IP 登录锁定 | ip_lock_duration |
