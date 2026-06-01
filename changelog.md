# 更新日志

## API 清单

### 认证服务 (`personal-api` → `personal-auth` gRPC)

| 方法 | 路由 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 注册账号 |
| POST | `/api/v1/auth/login` | 登录，返回 access_token / refresh_token |
| POST | `/api/v1/auth/token/refresh` | 刷新 access_token |
| POST | `/api/v1/auth/token/validate` | 校验 access_token |
| POST | `/api/v1/auth/token/revoke` | 撤销 refresh_token |
| POST | `/api/v1/auth/profile/get` | 获取用户资料 |
| POST | `/api/v1/auth/profile/update` | 更新用户资料 |

### 请求/响应格式

所有接口统一返回 JSON：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### gRPC → HTTP 状态码映射

| gRPC Code | HTTP 状态码 |
|-----------|------------|
| InvalidArgument | 400 Bad Request |
| Unauthenticated | 401 Unauthorized |
| PermissionDenied | 403 Forbidden |
| NotFound | 404 Not Found |
| AlreadyExists | 409 Conflict |
| ResourceExhausted | 429 Too Many Requests |
| Internal / Others | 500 Internal Server Error |

## 构建项目