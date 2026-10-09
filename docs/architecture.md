# Architecture

Browser → Next.js Web（UI / health BFF）→ NestJS API（HTTP 与真实依赖探针）。

独立 Node Worker → fixture provider → fake adapter → runtime schema / evidence validation。
queue 模式通过 Redis/BullMQ 投递；PostgreSQL + pgvector 提供后续领域数据底座。

包边界：shared 无服务端依赖；config 仅环境加载/验证/日志；database 只封装 Prisma factory；ai 只封装模型 adapter 与 SDK；source-providers 管来源合约。API/Worker 可依赖服务端包，Web 仅在 Next 配置阶段使用 config，客户端禁止 database/ai/source-providers。apps 不相互导入。

M0 没有 Agent loop、真实采集与业务查询。API 不注册队列 consumer，Web 不直连 DB。完整设计以 technical-design.md 为准。
