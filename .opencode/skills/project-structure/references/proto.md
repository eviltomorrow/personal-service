
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
- 编译命令：`make compile`（调用 `third-party/protoc/<platform>/bin/protoc`）

## 目录结构

```text
apps/<name>/
└── adapter/
    ├── hello.proto          # service × 1 或按业务划分多个 proto
    └── pb/                  # protoc 自动生成，git 提交
        ├── hello.pb.go
        └── hello_grpc.pb.go
```

## 消息定义规范

- **请求消息**: 以 `Request` 结尾，包含输入参数
- **响应消息**: 以 `Response` 结尾，包含返回数据
- **枚举**: 以 `UNSPECIFIED = 0` 开头作为默认值
- **字段编号**: 按顺序递增，为新接口预留尾部编号

## 完整示例（personal-auth 的 auth.proto）

```protobuf
syntax = "proto3";
package personal.auth;
option go_package = "github.com/eviltomorrow/personal-service/apps/personal-auth/adapter/pb";

enum AuthType {
  AUTH_TYPE_UNSPECIFIED = 0;
  AUTH_TYPE_EMAIL = 1;
  AUTH_TYPE_USERNAME = 2;
  AUTH_TYPE_PHONE = 3;
}

service Auth {
  rpc Register(RegisterRequest) returns (RegisterResponse);
  rpc Login(LoginRequest) returns (LoginResponse);
  rpc UpdatePassword(UpdatePasswordRequest) returns (UpdatePasswordResponse);
  rpc ValidateToken(ValidateTokenRequest) returns (ValidateTokenResponse);
  rpc DeleteAccount(DeleteAccountRequest) returns (DeleteAccountResponse);
  rpc RefreshToken(RefreshTokenRequest) returns (RefreshTokenResponse);
  rpc RevokeToken(RevokeTokenRequest) returns (RevokeTokenResponse);
  rpc RevokeAllTokens(RevokeAllTokensRequest) returns (RevokeAllTokensResponse);
  rpc UpdateIdentifier(UpdateIdentifierRequest) returns (UpdateIdentifierResponse);
}

message RegisterRequest { AuthType auth_type = 1; string identifier = 2; string password = 3; }
message RegisterResponse { string access_token = 1; string refresh_token = 2; int64 expires_in = 3; }
message LoginRequest { AuthType auth_type = 1; string identifier = 2; string password = 3; string ip_address = 4; string user_agent = 5; }
message LoginResponse { string access_token = 1; string refresh_token = 2; int64 expires_in = 3; }
message RefreshTokenRequest { string refresh_token = 1; }
message RefreshTokenResponse { string access_token = 1; string refresh_token = 2; int64 expires_in = 3; }
message RevokeTokenRequest { string refresh_token = 1; }
message RevokeTokenResponse {}
message RevokeAllTokensRequest { string access_token = 1; }
message RevokeAllTokensResponse {}
message UpdatePasswordRequest { string account_id = 1; string old_password = 2; string new_password = 3; }
message UpdatePasswordResponse {}
message ValidateTokenRequest { string access_token = 1; }
message ValidateTokenResponse { string role = 1; int64 expires_at = 2; }
message DeleteAccountRequest { string account_id = 1; string password = 2; }
message DeleteAccountResponse {}
message UpdateIdentifierRequest { string account_id = 1; AuthType auth_type = 2; string new_identifier = 3; }
message UpdateIdentifierResponse {}
```

## 约定

1. **package** 使用 `personal.<service_name>` 命名空间
2. **go_package** 固定为 `github.com/eviltomorrow/personal-service/apps/<name>/adapter/pb`
3. **文件名**小写蛇形，与 service 名称对应（如 `auth.proto` → service `Auth`）
4. **注释**每个 service 和 rpc 需要写中文文档注释
5. **字段编号**按顺序递增，为新接口预留尾部编号
6. **编译**统一使用项目级 `make compile`，无需手动调用 protoc
