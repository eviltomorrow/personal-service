---
name: project-structure
description: 使用此 skill 来处理 personal-auth 服务中认证相关功能（注册、登录、令牌管理、账户管理等），开发 personal-auth 功能。
---

# 1、原则

 - 遵照 KISS 原则，极简设计理念
 - 相似功能函数的参数要相同，返回参数也要相同
 - 结构清晰、简单

# 2、微服务结构模板

## 目录布局

```
apps/<service-name>/
├── main.go                 # 入口: buildinfo → system.LoadRuntime() → cmd.Run()
├── cmd/
│   └── root.go             # 启动编排: flag → config → log → schema → server → sigterm
├── conf/
│   └── etc/
│       └── config.toml     # 默认配置
├── adapter/
│   ├── <service>.proto     # gRPC service + message 定义
│   └── pb/
│       ├── <service>.pb.go           # protoc 生成的消息
│       └── <service>_grpc.pb.go      # protoc 生成的接口 + 注册
├── pkg/
│   ├── config/
│   │   └── config.go       # Viper 加载 TOML → struct
│   ├── model/
│   │   ├── errors.go       # ErrNotFound 哨兵
│   │   ├── <table1>.go     # 表模型 + CRUD (Insert / Select / Update / SoftDelete)
│   │   ├── <table2>.go
│   │   └── ...
│   ├── server/
│   │   └── server.go       # 依赖初始化 + gRPC server 构建
│   └── service/
│       ├── <service_a>.go  # gRPC server impl + DI 函数变量
│       └── <service_b>.go
└── scripts/
    ├── fs.go               # //go:embed schema.sql
    └── schema.sql           # DDL
```

# 3、各层职责 & 模板代码

## 1. `cmd/root.go` — 启动编排

参见 [cmd.md](references/cmd.md) 中的代码模板

## 2. `pkg/config/config.go` — 配置层

参见 [config.md](references/config.md) 中的代码模板

## 3. `pkg/model/<table>.go` — 数据访问层

参见 [model.md](references/model.md) 中的代码模板

### 4. `pkg/service/<service>.go` — 业务逻辑层

参见 [service.md](references/service.md) 中的代码模板

### 5. `pkg/server/server.go` — DI 装配层

参见 [server.md](references/server.md) 中的代码模板

### 6. `adapter/<service>.proto` — 接口定义

参见 [proto.md](references/proto.md) 中的代码模板

### 7. `scripts/fs.go` — 嵌入 SQL

```go
package scripts

import "embed"

//go:embed schema.sql
var SchemaFS embed.FS
```

# 4、