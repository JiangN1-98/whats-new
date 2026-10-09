# Local runbook

- Node/pnpm engine 错误：按 .nvmrc / packageManager 切换到固定版本。内置或全局 pnpm 如固定到另一个 Node，应使用自己版本管理器安装的 pnpm。
- Docker 不存在：安装 Docker Engine/Desktop 后执行 `pnpm infra:up`。无需基础设施可以运行 fixture smoke、Web 与 API live；ready 503 明确表示依赖不可用。
- 端口冲突：检查 3000/4000/5432/6379；如变更 API_PORT 同步变更 API_INTERNAL_URL。如变更 Web 端口同步 WEB_ORIGIN。不要停止不属于本项目的服务。
- DB 失败：检查 DATABASE_URL、Compose health、migration 状态；执行 `pnpm db:generate`、`pnpm db:migrate`、`pnpm db:seed`。`infra:down` 保留卷，禁止用 `down -v` 当默认排错命令。
- Worker：fixture 默认不连 Redis；queue 模式必须启动 Redis。SIGINT/SIGTERM 关闭 BullMQ 与连接；10 秒仍未完成则失败退出。
- 配置问题：启动错误只打印字段和验证信息，不输出实际值。不得把 .env、密钥或完整 provider 正文写入日志。
- 测试：集成命令只接受独立 *_test 数据库。用随机外部身份/队列清理自己创建的测试记录，不能重置开发库。
- 迁移/回滚：新变更追加 migration，生产 db:deploy 必须是一次性发布任务；M0 不支持公开部署。数据库备份与恢复演练在部署阶段定义。
- 尚未提供的操作：官方来源重试/停用、stale job 恢复、embedding 重建、key 轮换与托管备份。这些操作在 M2–M6 实现后补入真实命令，不提供空成功脚本。
