
# Adapter（protobuf）模板

基于 `apps/personal-auth/adapter/` 提取，适用于定义 gRPC 接口和数据模型。

## proto 文件

每个 service 一个 `.proto` 文件，放在 `apps/<name>/adapter/` 目录下。

### 协议文件示例

```protobuf
// apps/<name>/adapter/hello.proto
syntax = "proto3";

package personal.hello;

option go_package = "github.com/eviltomorrow/personal-service/apps/<name>/adapter/pb";

// Hello 服务提供 XXX 相关 RPC 接口。
service Hello {
  // SayHello 向用户打招呼
  rpc SayHello(SayHelloRequest) returns (SayHelloResponse);
}

message SayHelloRequest {
  string name = 1;
}

message SayHelloResponse {
  string greeting = 1;
}
```

## pb/ 目录（自动生成）

- `.proto` 编译后生成的 Go 代码（`*_grpc.pb.go` + `*.pb.go`）输出在 `adapter/pb/`
- **不要手动编辑** pb/ 下的任何文件
- 编译命令：`make compile`（调用 `scripts/protobuf_compile.sh`）

## 目录结构

```text
apps/<name>/
└── adapter/
    ├── hello.proto          # service × 1 或按业务划分多个 proto
    ├── world.proto
    └── pb/                  # protoc 自动生成，git 提交
        ├── hello.pb.go
        ├── hello_grpc.pb.go
        ├── world.pb.go
        └── world_grpc.pb.go
```

## 约定

1. **package** 使用 `personal.<service_name>` 命名空间
2. **go_package** 固定为 `github.com/eviltomorrow/personal-service/apps/<name>/adapter/pb`
3. **文件名**小写蛇形，与 service 名称对应（如 `auth.proto` → service `Auth`）
4. **注释**每个 service 和 rpc 需要写中文文档注释
5. **字段编号**按顺序递增，为新接口预留尾部编号
6. **编译**统一使用项目级 `make compile`，无需手动调用 protoc
