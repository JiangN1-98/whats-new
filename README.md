# What's New

AI-powered Software Update Intelligence。原则：**No source, no answer.**

当前范围为 **M0 工程初始化**：pnpm/Turborepo 单仓、Next.js 首页及只读 health BFF、NestJS 健康接口、独立 Worker、共享包、基础迁移、Compose 与 CI。尚未实现真实更新采集、领域 API、关注、搜索或 Agent。合成 fixture 只验证工程合约，不代表官方更新。

## 版本与运行要求

Node **24.21.0 LTS**、pnpm **10.34.6**。Next **16.4.0**、React **19.3.0**、Nest **12.1.2**、Prisma **7.10.0**、BullMQ **5.81.5**、OpenAI SDK **7.31.0**。完整精确版本见 [dependency-versions.json](docs/dependency-versions.json)，依赖兼容依据见 [ADR 0001](docs/adr/0001-bootstrap-baseline.md)。`pnpm-lock.yaml` 固定解析结果。

需要 Docker Engine / Docker Desktop 和 Compose v2 才能运行数据库与 Redis。本机 Node/pnpm 不符时先用自己的版本管理器切换，例如 `nvm install && nvm use`，再 `corepack enable && corepack prepare pnpm@10.34.6 --activate`。不要使用 Node 26 代替本仓库的 LTS 基线。

## 本地启动

在仓库根目录执行：

```sh
cp .env.example .env
pnpm install --frozen-lockfile
pnpm infra:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

首次 `db:migrate` 会应用已有 bootstrap migration；本轮仅创建 Dev User 表和 vector 扩展。seed 可重复执行，只 upsert 固定本地用户。M1 才会添加 Project/Source/Release 等领域表和经过核实的来源 seed。

- Web：http://localhost:3000
- API 存活：http://localhost:4000/api/v1/health/live
- API 就绪：http://localhost:4000/api/v1/health/ready（真实检查 PostgreSQL/Redis，不可用时 503）
- Web health BFF：http://localhost:3000/api/v1/health/live
- PostgreSQL / Redis：127.0.0.1:5432 / 127.0.0.1:6379

默认 `WORKER_MODE=fixture`：启动时运行一次合成 provider → fake extraction → evidence validation，随后保持独立进程并输出 heartbeat。无需 Docker 或任何付费凭证也可运行 `pnpm dev` 和 `pnpm fixture:smoke`；此时 readiness 返回 503 是预期行为。fixture 流程不落库，不能算真实采集纵向链路。

`WORKER_MODE=queue` 使用 Redis/BullMQ，仅消费 `whats-new-fixture-smoke` 演示队列；M0 没有业务队列、scheduler 或管理同步接口。fixture 队列由集成测试投递，不对外提供管理接口。

## 环境与边界

API、Worker、Prisma 命令通过 `@whats-new/config` 向上定位 workspace，加载根 `.env`，已有进程环境变量优先。Next 的配置阶段也加载根 `.env`；仅 `NEXT_PUBLIC_*` 可进入浏览器。`API_INTERNAL_URL` 是 Next 服务端访问 API 的地址。默认同源 BFF 只有 health 路径，后续 REST/SSE forwarding 在对应里程碑增加。

没有任何线上身份验证功能；`AUTH_MODE=dev` 只是本地配置基线，seed 固定用户供 M1 接入。production 拒绝 dev/fake/fixture 模式。`session` 和 `live` 虽为未来配置值，M0 启动会明确报未实现，不会返回假成功。OpenAI 包只提供服务端 SDK factory 与 fake adapter，没有模型默认值，也不发起网络调用。模型和 embedding 维度在 M3 选定并通过迁移固定。

Web 不依赖 database/ai/source-providers，不直接访问数据库或队列。API 中没有 consumer；Worker 是独立进程。shared 入口只有浏览器安全 schemas/types，config 属于服务端。

## 检查与测试

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm fixture:smoke
pnpm exec playwright install chromium
pnpm test:e2e
```

E2E 启动 API 构建产物及 Next dev，验证首页 demo 标记、BFF 转发、错误格式、Origin 拒绝。运行时避免端口被其他项目占用。API/Worker 可独立构建与启动：

```sh
pnpm exec turbo run build --filter=@whats-new/api...
pnpm --filter @whats-new/api start
pnpm exec turbo run build --filter=@whats-new/worker...
pnpm --filter @whats-new/worker start
pnpm exec turbo run build --filter=@whats-new/web...
pnpm --filter @whats-new/web start
```

集成测试必须使用独立、名称以 `_test` 结尾的数据库。先启动 infra，再用数据库管理工具创建本地测试库，例如：

```sh
docker compose exec postgres createdb -U whats_new whats_new_test
TEST_DATABASE_URL='postgresql://whats_new:whats_new_dev@localhost:5432/whats_new_test?schema=public' pnpm test:integration
```

该脚本拒绝开发库，先 migrate deploy，再真实验证 User 唯一约束、pgvector SQL 和 BullMQ fixture job。只删除测试创建的标识记录及随机队列，不 reset/清空整个数据库。CI 使用独立 services，重复 seed 验证幂等。测试不调用 GitHub/LLM；安装依赖与 Playwright 浏览器需要网络。

## 维护

`pnpm infra:down` 停止服务并保留数据卷。`pnpm db:deploy` 应用已提交迁移，`pnpm db:migrate` 用于开发新增迁移；两者都先构建配置包。不要手工改已应用 migration。排错与后续范围见 [runbook](docs/runbook.md)、[工程状态](docs/bootstrap-status.md) 和 [技术交接](docs/technical-design.md)。

此仓库仅在本地初始化，没有创建远程仓库或发布站点。
