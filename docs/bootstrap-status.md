# M0 bootstrap status

验证日期：2026-10-09（Asia/Shanghai）。本轮范围是工程初始化，不是 V1 交付。

## 已建立

- 本地 Git main 分支；保留原始交接文档并复制到 technical-design.md。
- pnpm 10.34.6 / Node 24.21.0 LTS / Turborepo / strict TypeScript，精确版本与 lockfile。
- Next.js / React 19 / Tailwind 4 首页，shadcn 配置与 Button，health BFF。
- NestJS /api/v1、全局验证、统一错误、requestId、Origin/CORS、live/ready 探针。
- 独立 Worker：fixture 默认模式、BullMQ 演示 consumer、SIGINT/SIGTERM shutdown。
- shared/config/database/ai/source-providers/eslint-config/tsconfig 包及显式 exports。
- PostgreSQL+pgvector / Redis Compose；Prisma client、User migration、幂等 Dev User seed。
- 环境示例、真实根 scripts、GitHub CI、架构/领域/来源/API/运行文档与 ADR。

## 实际检查

| 检查 | 结果 |
|---|---|
| Node / pnpm | 使用 24.21.0 / 10.34.6 执行 |
| frozen lockfile install | 通过；干净副本 offline 安装也通过 |
| pnpm db:generate / db:validate | 通过，Prisma client 生成和 schema 校验成功 |
| pnpm lint / typecheck / build | 通过；所有应用与代码包完成构建 |
| pnpm test | 3 files / 9 tests 通过 |
| pnpm fixture:smoke | demo=true，1 release / 1 change；不调用网络或写 DB |
| pnpm test:e2e | 2 tests 通过：首页/demo、health BFF、404 requestId、Origin 403 |
| pnpm dev | Web/API/Worker 同时启动，无付费凭证 |
| API live / BFF | 实际 HTTP 200 |
| API ready 无 infra | 实际 HTTP 503 / DEPENDENCY_UNAVAILABLE |
| Worker 独立构建产物 SIGTERM | shutdown log 存在，exit code 0 |
| 首页视觉检查 | Chromium 1440×1000 截图已检查，布局正常 |
| 干净副本 | 未复制 node_modules/dist/.next/.env；install → generate → lint → typecheck → unit → build → fixture 全部通过 |

## 未验证与限制

本机没有 Docker CLI/Engine，因此 `infra:up`、真实空库 migration、重复 seed、DB/Redis 集成测试以及 CI 远程运行尚未验证。测试和 CI 配置已经提交，但不能将其存在视为执行通过。Compose 镜像标签通过 Docker Hub API 核验。

ESLint 9 已被上游标记结束支持，因 Next 当前插件 peer 范围暂固定兼容版本；详见 ADR 0001。pnpm 禁止两个可选 native build scripts（msgpackr-extract / unrs-resolver）；当前安装、lint 和 smoke 正常，未通过全局放开 lifecycle scripts 解决。

已创建根 .env（安全的本地默认值），被 Git 忽略；不会提交。验证使用临时 Node 24 / pnpm 10，不更改用户全局 Node 26 / 内置 pnpm 11。后续启动需按 README 切换版本。验证服务均已停止。

当前没有真实来源、领域查询/关注、数据库中的 Release/Change、提取/embedding、Agent/SSE、认证或业务 scheduler/recovery。没有创建远程 Git repo、推送或公开部署。

## 下一步

先在 Docker 可用环境完成基础设施/迁移/seed/集成测试，确认 M0 完整启动 gate；然后进入 M1，补齐领域 schema、组合约束、核实 2–3 个官方来源及 Projects/Releases/Follows/Feed API。后续按交接的 M2–M6 交付纵向链路。
