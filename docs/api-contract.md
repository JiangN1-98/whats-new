# M0 API contract

Base：`/api/v1`。

| Route | 行为 |
|---|---|
| GET /health/live | 200 `{status:"ok",service:"api"}`，只检查进程 |
| GET /health/ready | DB/Redis 都可用返回 200；依赖失败返回 503 |

错误：`{error:{code,message,requestId}}`，响应携带服务端生成的 `x-request-id`，不反射任意客户端 requestId，不暴露异常栈/凭证。所有请求如携带 Origin，必须等于 WEB_ORIGIN。

Next 只读 BFF 路径 `/api/v1/health/live` 转发 API 的响应；连接失败为 503/API_UNAVAILABLE。业务 REST/DTO、Dev User 身份授权、SSE 在后续里程碑实现，交接中的路由表当前是设计而非已提供服务。
