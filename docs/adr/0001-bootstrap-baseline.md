# ADR 0001 — M0 dependency and runtime baseline

日期：2026-10-09。状态：Accepted。

使用 Node 24.21.0 LTS / pnpm 10.34.6；ESM / TypeScript 6.0.3；Next 16.4.0 / React 19.3.0；Nest 12.1.2；Prisma 7.10.0（不选 Prisma 8 RC）；BullMQ 5.81.5 / ioredis 5.11.1（保持成熟的直接连接 API，暂不迁移 BullMQ 6 的 adapter 架构）；OpenAI 7.31.0。

Prisma CLI / client / PostgreSQL adapter 使用完全相同版本；新 prisma-client generator 输出至 server-only database 包，用 adapter-pg 管连接。Next App Router 兼容 React 19，Nest 12 为 ESM，需要支持 require(esm) 的 Node；Node 24 满足这些边界。所有直接依赖精确固定，提交 lockfile。

ESLint 9.39.4 已被上游标记结束支持，但 Next 当前依赖的 eslint-plugin-import/jsx-a11y/react peer 范围仍只支持 9；为兼容现有 Next 工具链暂固定 9。后续插件支持 ESLint 10 后单独升级并运行 lint。TypeScript 6 满足 Nest 12 与 typescript-eslint <6.1 peer 范围。

M0 默认 fake / fixture，不指定付费模型或 embedding 维度；只建 User 和 vector 扩展，完整领域模型与真实来源 seed 留到 M1。首次初始化目录已有交接文档与 IDE 文件，没有代码仓；保留原文档并复制为 technical-design.md，忽略 IDE 文件。

官方依据（核验于上述日期）：

- [Node release schedule](https://github.com/nodejs/Release/blob/main/README.md)
- [Next installation](https://nextjs.org/docs/app/getting-started/installation)
- [Nest migration guide](https://docs.nestjs.com/migration-guide)
- [Prisma system requirements](https://docs.prisma.io/docs/orm/reference/system-requirements)
- [BullMQ Redis compatibility](https://docs.bullmq.io/guide/redis-tm-compatibility/)
- [OpenAI TypeScript SDK](https://developers.openai.com/api/reference/typescript)
- [pgvector installation](https://github.com/pgvector/pgvector/tree/v0.8.2)

Compose 固定 pgvector 0.8.2 / PostgreSQL 17 与 Redis 7.4.6，标签已通过 Docker Hub API 核验；没有 Docker 的主机不能宣称容器和真实迁移检查通过。
