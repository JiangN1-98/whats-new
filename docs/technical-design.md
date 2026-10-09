# What's New V1 — Codex 建仓与实施交接文档

- 文档日期：2026-10-09
- 产品：What's New — AI-powered Software Update Intelligence
- 状态：V1 技术基线 + 可执行实施交接
- 面向：负责建仓、数据库、API、Worker、Web 和 Agent 的 Codex
- 建议入仓位置：`docs/technical-design.md`
- 设计来源：ChatGPT 对话「全栈Agent学习路线」，conversation ID `6aba251d-e5c0-83ee-8ce9-2961127950ba`

> 目标：聚合开发者关注的软件、框架和工具的官方更新，通过结构化数据和可信 Agent 回答“最近更新了什么”。核心原则：**No source, no answer.**

## 0. 如何使用本交接

本文件是建仓和实施基线，不是已经实现或通过测试的系统。先完成第 23 节建仓清单，再按里程碑逐步交付可运行的纵向链路。

**已确定的设计**：单仓 pnpm + Turborepo；Next.js + React 19；NestJS；独立 Node.js/BullMQ Worker；Prisma + PostgreSQL + pgvector；Redis；OpenAI SDK；官方来源；Release/Change 分离；5 个只读 Agent 工具；最多 8 步；REST + SSE；开发期 Dev User；公开 Alpha 前接入认证。

**本文件补齐的实施默认值**：数据修订与引用快照、任务恢复、搜索降级、接口错误格式、POST SSE 的读取方式、版本比较区间、配置边界、测试和验收细则。它们用于消除实施歧义，遇到真实项目限制可通过 ADR 调整，不应被描述为原对话已经确认的全部细节。

**仍需在对应阶段核定**：Auth.js 或 Clerk；部署服务商与区域；LLM/Embedding 型号及维度；各项目真实官方来源地址、版本策略和初始回填范围。它们不阻塞本地建仓。默认本地 Dev User、可配置模型、近 90 天回填；实际数据不足应展示覆盖范围。

原对话的技术设计读取内容在 Testing 节附近达到单条消息长度上限；本文件的测试、里程碑及建仓清单为基于前述设计的实施补充。原对话中出现的软件版本号只视为示例，不作为当前真实版本或 seed 事实。

建仓时核对所选框架、SDK 和 Node 的官方兼容说明，记录准确版本并提交 lockfile；本文件不声称任一依赖是当前最新版。不得通过自动换框架来解决普通集成问题。

## 1. 产品目标与用户流程

目标用户为同时依赖多种技术的软件开发者。更新散落在 GitHub Releases、官方 changelog、博客、RSS/Atom 和迁移文档中；平台将它们转换为可浏览、检索、引用的更新事实。

核心流程：

```text
Explore → Follow → Track → Structure → Feed/Search → Ask Agent → Official citations
```

首批候选项目共 12 个：React、Next.js、Vue、Vite、TypeScript、React Native、Expo、Node.js、NestJS、LangChain、LangGraph、OpenAI。先用 2～3 个已核实来源的项目跑通链路，再扩充到 12 个。数据质量优先于项目数量。

注意：OpenAI 是组织/产品集合，不能把 API 平台、Python SDK、JavaScript SDK 的版本混为一谈。首次 seed 前明确追踪对象，建议先用独立 slug `openai-js` 表示 JavaScript SDK；平台更新在以后作为独立 Project。LangChain/LangGraph 同样明确语言生态。保留产品候选名称，具体粒度记入 `docs/source-catalog.md`。

### V1 包含

- Explore、关注项目、个人更新 Feed、Project/Release 详情。
- 官方来源登记、GitHub Release 和 RSS/Atom 增量采集。
- Release 归一化、Change 结构化、异步提取与 embedding。
- 按项目、版本、时间、channel、分类筛选；关键词和语义搜索。
- 简单 Tool Calling Agent、版本比较、SSE 流式回答和官方引用。
- 对话保存、基础管理后台、手动同步、来源健康状态和失败检查。
- 本地 Docker Compose、测试、独立部署 API 与 Worker。

### 显式非目标

V1 不做：仓库代码扫描、package.json 自动识别、依赖影响分析、自动迁移计划、自动改代码、自动 PR、Coding Agent、Multi-Agent、社区信息采集、移动 App、VSCode 插件、Slack/Telegram Bot、团队 Workspace、企业 RBAC、自研认证系统。LangGraph、Python、FastAPI 不引入 V1。未来方向可保留为 My Stack → Dependency Intelligence → Migration Agent → Coding Agent，但不能提前建设。

## 2. 架构与不可漂移的约束

```text
Browser
  │ UI / same-origin requests
  ▼
Next.js web — UI、App Router、SSR/RSC、SEO、轻量 BFF
  │ REST / SSE forwarding
  ▼
NestJS api — 领域业务、权限、搜索、Agent、队列生产者
  ├── PostgreSQL + pgvector
  └── Redis + BullMQ
           │
           ▼
Independent worker — 定时同步、Provider、提取、Embedding
  ├── GitHub / RSS / Atom / approved official pages
  ├── OpenAI SDK
  └── PostgreSQL + pgvector
```

架构 invariants：

1. Next.js 不直连业务数据库、不消费队列、不执行 extraction/Agent Loop；业务规则只在 NestJS 与服务端共享能力中定义。
2. API 请求内不爬取来源、不同步提取 Release、不批量生成 embedding。手动同步只入队，返回 202。
3. Worker 是独立进程与部署单元；API 只生产队列任务。
4. 原始官方内容、来源身份、发布时间、版本是事实底座；LLM 不能创造这些字段。
5. 一个 Release 表示一次发布；一个 Change 表示其中一项变化。博客文章不能一律冒充软件发布。
6. 重试和并发执行不得产生重复业务记录；数据库约束是最终防线，jobId 不是唯一防线。
7. 向量只用于相关性检索；项目、时间、版本和 channel 必须由数据库过滤。
8. 默认只展示 stable；unknown 不得静默升级为 stable。
9. 更新事实必须有引用，且引用对应本次检索证据；没有证据则说明不足。
10. Agent 只读，最多 8 轮模型决策；不能调用任意 URL、写库、执行代码或管理任务。
11. 服务端密钥不能进入浏览器包、公开环境变量、日志或版本控制。
12. Monorepo 不等于单运行时。Web/API/Worker 保持独立构建与部署。

调整这些约束需写 ADR，说明问题、备选、影响和迁移方式；普通实现细节无需反复向用户确认。

## 3. 技术栈与目录

| 层 | 选型 | 用途 |
|---|---|---|
| 工程 | pnpm、Turborepo、TypeScript strict | 工作区、构建、共享类型 |
| Web | Next.js App Router、React 19、Tailwind CSS、shadcn/ui | 内容页与应用 UI |
| 客户端数据 | TanStack Query | 交互页面的服务端状态 |
| 本地 UI 状态 | React state；有实际需要才加 Zustand | 输入、展开、流式显示 |
| API | NestJS、REST、SSE、DTO runtime validation | 领域接口与 Agent |
| 数据 | PostgreSQL、Prisma、pgvector | 事实、关系、语义索引 |
| 异步 | Redis、BullMQ、独立 Node Worker | 抓取、提取、embedding |
| AI | OpenAI SDK、Structured Output、Tool Calling、Embedding | 结构化与总结 |
| 运维 | Docker、Docker Compose、结构化日志 | 开发和部署 |
| 验证默认 | Vitest/Jest（按包）、Supertest、Playwright | 单元、集成、E2E |

```text
whats-new/
├── apps/
│   ├── web/src/app/                  # Next.js routes
│   ├── api/src/
│   │   ├── modules/                  # domain modules
│   │   └── common/                   # guards, filters, logging
│   └── worker/src/
│       ├── processors/
│       ├── scheduler/
│       └── recovery/
├── packages/
│   ├── database/
│   │   ├── prisma/schema.prisma
│   │   ├── prisma/migrations/
│   │   ├── prisma/seed.ts
│   │   └── src/                      # Prisma client, vector SQL helpers
│   ├── shared/src/                   # DTO contracts, enums, schemas, job payloads
│   ├── ai/src/                       # SDK adapters, prompts, validated outputs
│   ├── source-providers/src/         # provider registry, normalizers, fixtures
│   ├── eslint-config/
│   └── tsconfig/
├── docs/
│   ├── technical-design.md
│   ├── domain-model.md
│   ├── architecture.md
│   ├── source-catalog.md
│   ├── api-contract.md
│   ├── runbook.md
│   └── adr/
├── tests/fixtures/                   # official-content snapshots, fake AI responses
├── .github/workflows/ci.yml
├── .env.example
├── .gitignore
├── docker-compose.yml
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── README.md
```

包名使用 `@whats-new/*`。apps 不相互 import；浏览器只能导入 shared 的浏览器安全入口。database/ai/source-providers 属于 server-only，不能被 web 客户端依赖。shared 不导出 Prisma Client 或包含密钥的配置。数据库类型与公开 DTO 明确映射，避免 schema 改动直接泄漏到 HTTP 合约。

## 4. 领域模型与枚举

```text
User → Follow → Project → Source
                    └── Release → Change
User → Conversation → Message → Citation
```

| 实体 | 职责与主要字段 |
|---|---|
| Project | id、slug、name、description、category、homepageUrl、githubRepo、logoUrl、status、versionStrategy、latestStableVersion、timestamps |
| Source | projectId、type、url、priority、enabled、config、cursor、etag、lastModified、lastFetchedAt、lastSuccessAt、lastErrorAt、lastError |
| Release | projectId、sourceId、externalId、versionRaw、versionNormalized、channel、title、publishedAt、sourceUrl、rawContent、contentHash、contentRevision、summary、processingStatus |
| Change | projectId、releaseId、title、description、category、importance、sourceUrl、evidence、metadata、extractionRevision、timestamps |
| User | id、externalAuthId（nullable）、displayName、timestamps；开发身份也要独立记录 |
| Follow | id、userId、projectId、createdAt |
| Conversation | id、userId、title、timestamps |
| Message | id、conversationId、role、content、status、metadata、createdAt |
| Citation | messageId、projectId/releaseId/changeId/sourceId（按证据设置）、sourceUrl、title、evidenceSnapshot、contentRevision |

枚举固定为：

- ProjectCategory：`frontend | mobile | backend | ai | tooling | database | devops | other`
- ProjectStatus：`active | paused | archived`（实施补充）
- SourceType：`github_release | github_tag | rss | atom | official_blog | changelog | documentation`
- ReleaseChannel：`stable | rc | beta | alpha | canary | nightly | unknown`
- ChangeCategory：`feature | breaking_change | deprecation | performance | security | bug_fix | developer_experience | documentation | other`
- ChangeImportance：`low | medium | high | critical`
- ProcessingStatus：`pending | processing | ready | failed | skipped`（实施补充）
- MessageRole：`user | assistant | tool | system`
- MessageStatus：`pending | completed | interrupted | failed`（实施补充）

SourceType 的枚举允许扩展，但枚举存在不代表 Provider 已实现。github_tag、通用页面抓取、文档采集先不启用；不要为展示一个类型创建空实现并假装支持。

## 5. Prisma schema 实施指导

以下为 schema **起点片段**，不是可直接生成的完整 schema。建仓时补齐 enums、反向 relations、User/Source/Conversation/Message/Citation、时间字段以及 SQL migration，并执行 Prisma validate 与真实迁移。

```prisma
model Project {
  id                  String    @id @default(uuid()) @db.Uuid
  slug                String    @unique
  name                String
  versionStrategy     String    @default("unknown")
  latestStableVersion String?
  releases            Release[]
  follows             Follow[]
}

model Release {
  id                String           @id @default(uuid()) @db.Uuid
  projectId         String           @db.Uuid
  sourceId          String           @db.Uuid
  externalId        String
  versionRaw        String?
  versionNormalized String?
  channel           ReleaseChannel   @default(unknown)
  title             String
  publishedAt       DateTime         @db.Timestamptz(3)
  sourceUrl         String
  rawContent        String           @db.Text
  contentHash       String
  contentRevision   Int              @default(1)
  extractionRevision Int             @default(0)
  summary           String?          @db.Text
  processingStatus  ProcessingStatus @default(pending)
  processingStartedAt DateTime?      @db.Timestamptz(3)
  retryCount        Int              @default(0)
  lastAttemptAt     DateTime?         @db.Timestamptz(3)
  lastError         String?           @db.Text
  project           Project          @relation(fields: [projectId], references: [id])
  source            Source           @relation(fields: [sourceId], references: [id])
  changes           Change[]
  @@unique([sourceId, externalId])
  @@index([projectId, channel, publishedAt, id])
  @@index([processingStatus, processingStartedAt])
}

model Change {
  id                String           @id @default(uuid()) @db.Uuid
  projectId         String           @db.Uuid
  releaseId         String           @db.Uuid
  ordinal           Int
  title             String
  description       String           @db.Text
  category          ChangeCategory
  importance        ChangeImportance
  sourceUrl         String
  evidence          Json
  metadata          Json?
  extractionRevision Int
  release           Release          @relation(fields: [releaseId], references: [id])
  embeddings        ChangeEmbedding[]
  @@unique([releaseId, extractionRevision, ordinal])
  @@index([projectId, category, releaseId])
}

model ChangeEmbedding {
  id         String   @id @default(uuid()) @db.Uuid
  changeId   String   @db.Uuid
  model      String
  dimension  Int
  inputHash  String
  // 维度是建仓时按已选择模型固定的 schema 参数；此处 D 是占位符。
  // vector Unsupported("vector(D)")?
  change     Change   @relation(fields: [changeId], references: [id], onDelete: Cascade)
  @@unique([changeId, model, inputHash])
}

model Follow {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @db.Uuid
  projectId String   @db.Uuid
  createdAt DateTime @default(now()) @db.Timestamptz(3)
  user      User     @relation(fields: [userId], references: [id])
  project   Project  @relation(fields: [projectId], references: [id])
  @@unique([userId, projectId])
}
```

### 约束和迁移要求

- `Project.slug`、`Follow(userId, projectId)`、`Release(sourceId, externalId)` 必须唯一。
- User.externalAuthId 非空时唯一；Conversation 必须绑定身份，开发阶段也绑定 Dev User，不采用所有人共享的匿名会话。
- 所有时间用 UTC timestamptz 存储；API ISO 8601 输出；UI 按用户时区显示。
- Source.config 是经 provider-specific schema 校验的 JSON，不是任意运行配置，不存 token。
- Source.projectId 与 Release.projectId 一致；Change.projectId 与 Release.projectId 一致。优先增加组合外键/唯一键，在 SQL migration 中落实；至少在写入事务中验证并有集成测试。
- Relation 的删除行为显式定义。Project/Source 默认停用或归档，保留来源审计；Citation 允许关联实体被删除后置空，但 URL、标题和证据快照仍保存。
- Citation 必须保存证据快照和 contentRevision；重新提取不能让历史答案引用悄悄指向新内容。
- SQL migration 创建 `vector` 扩展；vector/全文索引通过版本化 SQL 管理。Prisma 对 Unsupported 字段的操作能力按所选版本核验，用参数化 raw SQL helper 封装，不拼接用户输入。
- Embedding 使用独立表是对原 `Change.embedding` 的实现细化：模型、维度、输入 hash 和重建状态独立管理。搜索只访问配置的活动模型，不能混合不同向量空间。
- 可用 `to_tsvector('simple', ...)` 对来源和提取文本建 GIN 索引；初期中文召回不足时明确展示能力范围，可用参数化关键词包含检索补充，不先引入外部搜索服务。
- 向量索引是否用 HNSW 及其参数由所选 pgvector/模型维度支持情况与真实数据量决定。初期可精确搜索，不能为了索引强行改模型维度。
- 新 revision 提取完成后，用事务替换当前 Change 集与 summary，并更新 extractionRevision；旧引用靠快照保留。提交前验证 revision 仍匹配，过期 job 不可覆盖新内容。

### 重复来源与 latestStableVersion

`sourceId + externalId` 只能防止同源重复，不保证跨来源合并。V1 为每项目指定主要发布来源；辅助来源用于补充官方链接。遇到相同标准版本的候选发布，按明确 canonical key 规则关联已有 Release 或进入管理复核；不要凭标题相似自动合并。没有可靠身份时保留可审计记录，但 Feed 避免重复展示已关联发布。

latestStableVersion 是可重算缓存：只从 ready、stable、具有可靠版本顺序的 Release 计算；旧版本回填不能覆盖更高版本。未知版本策略不声称“最新版本”，可展示“最近收录发布”。

## 6. NestJS 模块边界

| 模块 | 责任 | 禁止承担 |
|---|---|---|
| AuthModule | 身份 adapter、Dev User gate、Auth Guard、Admin Guard | 自研完整认证系统 |
| UsersModule | 本地用户映射 | 用请求 body 中的 userId 授权 |
| ProjectsModule | 列表、详情、版本策略、项目读写 service | 抓取 |
| SourcesModule | 来源校验、配置、健康状态 | 请求内采集 |
| ReleasesModule | 发布详情、版本解析、比较范围 | LLM extraction |
| ChangesModule | Change 查询与分类 | 任意向量 SQL 散落 controller |
| FollowsModule | 关注关系、Feed 查询 | 前端重复实现过滤规则 |
| SearchModule | metadata、关键词/语义检索、排序 | 不受项目范围限制的召回 |
| ConversationsModule | 会话所有权、消息与引用持久化 | Agent 决策循环 |
| AgentModule | 五工具、bounded loop、citation validation、SSE | 抓取、写操作工具 |
| QueueModule | queue producer、job contracts、同步受理 | BullMQ consumer |
| AdminModule | 管理接口、组合调用、运行状态 | 绕过领域 service 直接写库 |
| DatabaseModule / HealthModule | client 生命周期、健康探针 | 产品规则 |

Controller 只做输入验证、身份和响应映射；Service 承担业务规则。共享服务通过模块 exports/imports 组合，避免 circular dependency。Worker 可用轻量 Node composition root；无需为了目录名字复制整个 API AppModule。

## 7. Source Provider 与官方来源登记

优先级：P0 GitHub Release/官方 Changelog；P1 官方 Blog/RSS/Atom；P2 官方 Documentation/Migration Guide。优先级表示证据权威和合并偏好，不表示 V1 必须实现所有抓取类型。

```ts
interface SourceProvider {
  supports(source: SourceConfig): boolean;
  discover(source: SourceConfig, context: SyncContext): Promise<DiscoverResult>;
}
interface RawRelease {
  externalId: string;
  title: string;
  version?: string;
  publishedAt: string;
  url: string;
  content: string;
  metadata?: Record<string, unknown>;
}
interface DiscoverResult {
  items: RawRelease[];
  nextCursor?: string;
  etag?: string;
  lastModified?: string;
  notModified?: boolean;
}
```

SyncContext 包含 cursor、回填时间范围、AbortSignal、requestId；Provider 不负责数据库写入、LLM 或队列。用 registry 按 Source.type/config 找实现，不在主流程写 `if project === 'react'`。项目差异放版本策略或校验过的 provider 配置。

### GitHubReleaseProvider

- 管理配置提供 repo owner/name；token 从服务端环境读取。
- 官方 release id 作为 externalId；tag/name/body/html_url/published_at 映射到输出。
- 忽略 draft；prerelease flag 与 tag 一起决定 channel。
- 支持分页、请求超时、限流、ETag/条件请求；按响应限流时间安排重试。
- 增量采集保留重叠窗口，重新检查近期 release 的编辑内容；不能只依靠发布时间 watermark。
- GitHub tags 不含发布说明时不能伪造 Change。

### RSSProvider / AtomProvider

- 先 RSS，随后 Atom；允许同一 parser adapter 支持二者，但需分别验证 fixtures。
- externalId 使用稳定 guid/id；没有时使用规范化官方 item URL；不能使用整个正文 hash 作为身份，否则编辑会产生新 Release。
- 区分发布日期、更新时间；缺少可信发布日期的条目进入检查状态，不能拿抓取时间冒充发布时刻。
- 通用博客文章先判断是否是明确发布公告；无法映射具体发布则不进入 Release/Change 主库，可记录 skipped 原因。
- feed 内容截断时，只允许访问已登记官方域名的文章页面；通用 WebPageProvider 延后。

### source-catalog 必填项

每个来源记录：project slug、生态/产品边界、官方 URL、官方归属证据、provider type、优先级、版本策略、是否 prerelease、回填范围、fixture、最近验证日期。不编造 RSS 地址，不因一个 repo 可访问就认定它是项目官方来源。

来源请求限制 HTTPS、官方域名 allowlist、内容大小、超时和重定向次数；每一跳校验目标，拒绝 loopback/private/link-local 地址。普通用户不可提交任意抓取 URL。原始 HTML/Markdown 展示必须 sanitize。

## 8. 发布处理 Pipeline 与状态

```text
Scheduler / Admin
 → project-sync
 → Provider.discover
 → normalize + validate + hash
 → upsert Release + pending processing intent
 → release-processing
 → validated structured extraction
 → transaction: summary + Change[] + ready
 → embedding
 → vector rows
 → Search / Feed / Agent
```

同步空结果不等于失败；304 视作成功且不修改内容。来源游标只在该批记录成功落库后推进；分页中途失败不能越过未处理数据。

Release 状态：`pending → processing → ready`；暂时错误可重新进入 pending，耗尽重试进入 failed。非发布文章或没有可提取事实可为 skipped，并记录理由。ready 表示结构化内容可用，embedding 是否就绪单独跟踪；embedding 失败不隐藏可读的 Release。

正文内容 hash 未变时跳过重复提取。正文变化时递增 contentRevision 并重新入队；旧 Changes 与新 rawContent 不混用。默认在新 revision ready 前，将旧提取结果标为待更新并从 Agent 检索排除，UI 可展示原文与处理状态。

## 9. BullMQ 与 Worker 设计

| Queue / job | Payload | 初始 concurrency | 职责 |
|---|---|---:|---|
| project-sync / sync-project | projectId、requestedAt、reason | 10 | 读取有效 Source、采集、归一化、落库 |
| release-processing / process-release | releaseId、contentRevision、promptVersion | 3 | 提取并提交 Change |
| embedding / embed-change | changeId、extractionRevision、model、inputHash | 5 | 生成并持久化向量 |

Job payload 只带 ID 和修订信息，不携带大正文、凭证或整个 Prisma 对象。并发是起始上限，所有副本总请求量还需受 provider/模型限额控制。

### 幂等与恢复

- jobId 用安全格式，例如 `process-release-<uuid>-r<revision>-p<promptVersion>`；示意名称不直接使用带冒号 ID，实际限制按 BullMQ 版本核验。
- 数据库 upsert/unique 保证重复同步不会重复生成 Release；任务去重不替代这些约束。
- 原子 claim + revision 条件更新 + lease/超时恢复防止并发写入；仅检查 processingStatus 后执行不够。
- extraction 事务提交时检查 contentRevision；过期结果丢弃，不能写成 ready。
- 数据库提交与 Redis 入队不是同一事务。V1 默认数据库记录 pending 意图，由周期 reconciler 补发 pending Release、缺失 embedding；不得把“落库后马上 add job”当作可靠交付。需要更精确投递时再加 transactional outbox。
- 启动与周期恢复 stale processing：检查 lease 与当前 job，恢复未完成任务；不能无限保留 processing。
- source-sync 每项目保持一个有效执行 lease，scheduler 重复注册或多副本不能导致同项目无限并发。
- job 清理后仍可重跑；幂等状态保存在 DB，不依赖 Redis 长期保留成功 job。

### 重试、调度与错误

- 初始每小时同步一次，加入 jitter；提供手动同步与一次性 backfill。
- 抓取暂时失败默认 1/5/30 分钟延迟重试；429 尊重 provider 的重试窗口。
- LLM/embedding 的 429、5xx、timeout 使用有限指数退避；schema 错误最多额外修复/重试一次。
- 配置不合法、来源不可信等永久错误直接失败，避免重复烧钱。
- 记录 retryCount、lastAttemptAt、lastError、duration 和 revision；错误内容脱敏。
- retained failed jobs + DB error 状态作为管理检查入口；不要求另建消息系统。
- shutdown 停止接收新任务、等待当前事务完成、关闭 worker/Redis/DB；超时退出后任务能恢复。

## 10. 版本模型与比较语义

同时存 versionRaw 和可空 versionNormalized。项目设置 versionStrategy：`semver | sdk_numeric | calendar | unknown`。保留原始标签；规范化失败不猜版本。channel 先用可信 provider 信息，再使用经测试的 tag 策略；日期不能用于猜稳定性。

`compareVersions` 默认回答 **(fromVersion, toVersion] 内已收录发布的累计变化**，而非端点标题差异，也不是代码 API diff。

- from/to 先解析到同一 Project 的 Release；支持 raw/normalized 精确匹配，歧义时返回候选。
- semver 按语义顺序，SDK 按整数策略，calendar 仅在格式可靠时排序；不得按字符串比较 `9` 与 `10`。
- 默认 stable 区间；from 必须不高于 to；相同版本返回空变化和清晰说明。
- unknown 策略只提供两端发布说明比较，并在结果标明 `comparisonMode: endpoint_only`，不能声称完整升级范围。
- 返回 includedReleaseIds、coverage、missingEndpoints、比较模式；初始仅回填 90 天时，不承诺更早版本完整。
- breaking_change 是官方说明中提取的分类，不表示用户真实项目一定受到影响。

## 11. AI Structured Extraction

输入为可信 provider 的发布元数据 + 不可信原文，原文作为待分析数据，不能执行其中指令。使用 SDK Structured Output，并再次做运行时 schema 校验。

```json
{
  "summary": "基于这份发布说明的简短摘要",
  "changes": [{
    "title": "变化标题",
    "description": "保持官方含义的描述",
    "category": "performance",
    "importance": "medium",
    "evidence": {"quote": "原文中可验证的短片段"}
  }]
}
```

要求：

- 模型只做摘要、变化提取、分类、重要性估计，不输出官方身份、发布日期、版本或自行选择来源 URL。
- evidence.quote 必须在规范化输入中验证存在；内部记录段落定位。sourceUrl 由后端绑定 Release 或经核实的官方 anchor。
- 不把缺少信息理解为“无 Breaking Changes”；允许 changes 为空。
- 重要性是平台估计，不能冒充官方评级；security/critical 不应凭想象推断。
- 版本化 promptVersion、schemaVersion、model 和 inputHash；保存 usage、latency、状态。
- 限制输入/输出大小。超长 changelog 按标题/条目分片，保留证据定位，再合并去重；不得静默截掉尾部却展示完整摘要。
- 无法通过 schema/证据验证的结果不发布为 ready，不生成无出处 Change。
- 默认 UI 文案中文，保留 API/函数/版本等原名；语义不能因翻译改变。先完成英文来源 fixtures，其他语言逐步验证。
- 本地与 CI 使用 fake AI adapter；LIVE_AI 仅显式启用并设置预算。

## 12. Embedding、Search 与 RAG

Embedding 文本包含 Project name、version、Change title/description/category；以结构化 Change 为主要检索单元，不把整篇 changelog 作为唯一向量块。

```text
输入 query
 → 解析/验证 project、channel、version/date/category filters
 → 在 SQL 中限制候选
 → 关键词召回 + 活动模型的向量召回
 → 合并去重/排序
 → bounded evidence results
 → Agent 基于证据总结
```

- 时间过滤使用 Release.publishedAt，默认 `from` 包含、`to` 不包含；Date-only 输入按约定时区转 UTC。Agent 运行保存 now/timezone，便于复现“最近一个月”。
- project/channel/category/time filters 同时作用于关键词与向量分支，不能全库召回后再把错误项目交给模型。
- 默认 stable；仅检索 ready 且 extractionRevision 对应当前 contentRevision 的事实。
- 关键词与语义结果可用 reciprocal rank fusion 合并，不能直接相加不可比较的原始分数。
- 默认 limit=20、最大=50；Agent 每次工具结果默认最多 10 条、最大 20 条，并限制字符预算。
- embedding 暂不可用时降级关键词检索，返回 `searchMode` 和覆盖限制；旧向量不得用于新 Change revision。
- 检索结果含 Change/Release/Project ID、官方 URL、publishedAt、version、category、证据片段、来源 freshness。
- 相似度阈值需用 fixtures/真实问题评估；没有足够证据时返回空或低覆盖，不能强行回答。
- V1 不进行 Agent 请求时的实时网络搜索。最新回答基于已同步数据，应展示 lastSuccessAt/覆盖范围。

## 13. Agent Runtime 与五个工具

简单 Tool Calling Loop，不使用 LangGraph。NestJS AgentModule 通过领域 Service 执行工具，模型没有直接 SQL 权限。

| Tool | 输入 | 主要输出 |
|---|---|---|
| searchProjects | query | 匹配项目 ID、slug、name，歧义候选 |
| getProjectUpdates | projectId、from?、to?、limit? | 默认 stable 发布及 Changes、引用、freshness |
| getVersionChanges | projectId、version | 指定发布变化或版本歧义/缺失 |
| compareVersions | projectId、fromVersion、toVersion | 明确区间语义的变化、覆盖信息 |
| searchChanges | query、projectId?、category?、from?、to?、limit? | 经 metadata 过滤的证据结果 |

工具参数用同一 runtime schema 校验，日期/枚举/limit/ID 均不能直接信任模型。工具只读，无管理或抓取能力。

运行流程：保存 user message → 建立 run context → model → validated tool calls → bounded results → model → grounded answer → 保存 assistant + citations → done。

- MAX_STEPS=8，每轮可以有多个工具调用，另设总工具调用上限默认 16，避免单轮无限 fan-out。
- 默认单 run deadline 120 秒；可配置 token/费用预算。超限返回有依据的部分结果或无法完成说明，不重新开始无限循环。
- 保留工具 call ID、结果对应关系和 run 状态；持久化工具结果默认仅存必要摘要，不泄露隐藏推理。
- searchProjects 歧义未消除前不能查询错误项目；项目未知时请求用户澄清或返回候选。
- 工具结果生成 citation candidate IDs；模型只能引用本 run 的候选，后端检查 ID、URL 与证据匹配。
- 缺失来源时回答“目前没有找到足够的官方来源支持这个结论”，可注明数据覆盖不足。
- 引用合法不等于每项事实已被验证。对关键事实使用结构化 answer segments + citation IDs，验证其证据关联；模型生成的无依据断言在最终答案中移除或标明无法确认。
- 流式文本可能尚未验证，UI 将 token 内容作为草稿；done 携带通过校验并持久化的最终答案，客户端以最终内容替换草稿。
- 客户端断开时取消模型和工具请求，标记 interrupted；不得把半句话保存为 completed。

## 14. SSE 合约

固定入口：`POST /agent/chat`，NestJS 发出 `text/event-stream`。请求：

```json
{"conversationId": "optional UUID", "message": "React 最近一个月更新了什么？", "clientRequestId": "UUID", "timezone": "Asia/Shanghai"}
```

服务器从已验证 session 得 userId。原生 EventSource 不能发 POST；Web 使用 fetch + ReadableStream 增量解析 SSE。Next BFF 原样转发流、取消信号和必要 headers；不把整个流缓冲后返回。

标准 wire 格式，每条事件以空行结束：

```text
id: run-uuid-1
event: status
data: {"runId":"run-uuid","seq":1,"phase":"searching","message":"正在检索官方更新"}

id: run-uuid-2
event: token
data: {"runId":"run-uuid","seq":2,"content":"本次收录的更新包括"}

```

| event | data 字段（除 runId/seq） |
|---|---|
| status | phase、message、conversationId（初始事件提供） |
| tool_start | toolCallId、tool；可公开的摘要 |
| tool_result | toolCallId、tool、count、durationMs；不发完整敏感结果 |
| token | content；仅展示草稿增量 |
| citation | citationId、sourceUrl、title、releaseId?、changeId? |
| done | messageId、conversationId、content、citationIds、finishReason、usageSummary? |
| error | code、message、retryable；无堆栈或凭证 |

header：`Content-Type: text/event-stream; charset=utf-8`、`Cache-Control: no-cache, no-transform`；在适用代理关闭 buffering。每约 15 秒发送 `: heartbeat` 注释。客户端 parser 支持 UTF-8 跨 chunk、多行 data、注释和不完整尾部。

- 身份/DTO 错误发生在流建立前，以普通 HTTP 4xx JSON 返回。
- 流建立后不可改 HTTP status，用 error 并关闭。成功发送一次 done；错误发送一次 error；客户端取消可以无终止事件，但 DB 必须标记 interrupted。
- done 必须在 assistant 和 Citation 事务成功后发送；保存失败不能宣告成功。
- V1 不实现 Last-Event-ID 自动续传。断线后读取已保存会话；通过 clientRequestId 幂等避免再次保存同一用户请求/重复运行。运行中重复请求返回冲突状态，客户端改查会话。
- UI 只展示执行状态、工具名和结果数量，不显示模型隐藏推理。

## 15. REST API 与 Web 页面

默认 API base 为 `/api/v1`；下表路径相对 base，保留原设计的资源命名。

| Method / route | 行为与权限 |
|---|---|
| GET /projects | 公共列表；query/category/status、cursor/limit |
| GET /projects/:slug | 公共详情、最新版本、官方来源与 freshness |
| GET /projects/:slug/releases | channel/from/to/cursor/limit，stable 默认 |
| GET /releases/:id | 原文、摘要、状态、官方链接 |
| GET /releases/:id/changes | 分类分组/筛选 |
| GET /changes | projectId/category/channel/from/to/cursor/limit |
| GET /changes/search | query + filters；需在 :id 路由前注册 |
| GET /changes/:id | 单条变化和证据 |
| GET /me/follows | 当前用户关注 |
| POST /me/follows | body {projectId}；幂等创建 |
| DELETE /me/follows/:projectId | 幂等取消，204 |
| GET /me/feed | 当前用户关注项目的 ready stable 更新 |
| POST /agent/chat | 当前用户；SSE |
| GET /agent/conversations | 当前用户会话列表 |
| GET /agent/conversations/:id | 所有权检查；消息、引用和 run 状态 |
| POST /admin/projects | Admin；创建项目 |
| PATCH /admin/projects/:id | Admin；修改/暂停 |
| POST /admin/projects/:id/sync | Admin；202 {jobId,status}，不等待抓取 |
| POST /admin/sources | Admin；验证并登记官方来源 |
| PATCH /admin/sources/:id | Admin；更新配置/停用 |
| GET /admin/sources | 实施补充；健康状态、同步与错误 |
| GET /admin/jobs/:id | 实施补充；队列状态与脱敏错误 |
| GET /health/live | 进程存活 |
| GET /health/ready | DB/Redis 可用，部署探针 |

公共列表默认 limit 20/max 50，按 `publishedAt DESC, id DESC` 等稳定排序使用不透明 cursor。错误统一：`{error:{code,message,requestId,details?}}`。404/409/422/429/503 按明确错误类型映射；未登录 401、无权 403。禁止未限定的全库查询与直接暴露 raw Prisma 记录。

Web 路由：`/`、`/explore`、`/project/[slug]`、`/project/[slug]/release/[version]`、`/ask`、`/following`、`/admin`。版本路径使用 URL 编码和 canonical slug；没有版本或发生歧义时增加 ID 形式的稳定详情路由并重定向，不能假设所有发布都有唯一 SemVer。比较能力 V1 在 Agent 提供，独立 `/project/[slug]/compare` 页面延后。

UI 最低要求：

- 首页 Your Stack、Latest Updates、Important Changes；没有关注时给 Explore 入口。
- Project 页：标题、关注、版本、来源、同步时间、发布列表、Ask AI。
- Release 页：摘要、变化分类、原始官方链接、处理状态、Ask about this release。
- Ask 页：执行进度、流式草稿、最终答案、Sources；空证据/失败/中断可识别。
- Admin 页：项目/来源新增修改、停用、手动同步、最后成功时间、失败原因。
- loading、empty、error 均有状态；展示 Markdown/HTML 前 sanitize。

SSR/RSC 用于公开内容首屏与 metadata；TanStack Query 用于交互页面，避免同一请求重复获取。SEO sitemap 只收录可访问的 canonical 公开页面，不收录私人 Feed/会话。

## 16. 认证与安全边界

本地开发默认固定 Dev User，由 `AUTH_MODE=dev` 开启，仅非 production 可用。它不是公开访问方案。公开 Alpha 必须接入 Auth.js 或 Clerk，并在 NestJS 验证真实 session/token；BFF 不能仅转发一个可伪造的 userId header。

Admin 默认显式服务端 allowlist，普通用户不可创建来源或触发同步。会话所有权每次查询与 chat 都检查。cookie 请求有 SameSite/CSRF 或 origin 验证；CORS 只允许登记 origin。Agent 与 admin sync 有按身份/IP 的频率限制，避免无上限 LLM 花费。

密钥只在 api/worker 服务端环境；Next 服务端 session secret 也不能 NEXT_PUBLIC。来源正文与用户消息都作为不可信数据，不能成为系统 prompt 指令。运行日志不包含完整用户消息/密钥，必要原文审计存储按权限控制。

## 17. 本地开发与配置

Compose 运行带 pgvector 的 PostgreSQL 和 Redis，持久化 volume、健康检查、明确映射端口。应用开发期在宿主机运行；API、Worker 使用统一环境加载方式。

```text
cp .env.example .env
pnpm install
pnpm infra:up
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

建仓脚本必须真正实现以上命令。另提供 `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm test:integration`、`pnpm test:e2e`、`pnpm build`、`pnpm infra:down`、`pnpm db:deploy`。测试需创建独立 DB，不能清空开发/生产库。

| 环境变量 | 消费方 / 说明 |
|---|---|
| DATABASE_URL | API/Worker/迁移；不能公开 |
| REDIS_URL | API/Worker |
| OPENAI_API_KEY | API Agent、Worker extraction/embedding |
| OPENAI_CHAT_MODEL / OPENAI_EXTRACTION_MODEL | 可分别设置，不硬编码型号 |
| OPENAI_EMBEDDING_MODEL / EMBEDDING_DIMENSIONS | 建仓核验，须与 SQL schema 匹配 |
| GITHUB_TOKEN | Worker，可选但正式同步建议配置 |
| API_INTERNAL_URL | Next server → API，包含 /api/v1 base |
| NEXT_PUBLIC_API_URL | 仅公开、安全的 API/BFF base；默认同源 /api/v1 |
| WEB_ORIGIN / API_PORT | CORS/origin 与 API 端口 |
| AUTH_MODE / DEV_USER_ID | 本地模式；production 禁止 dev |
| AUTH_SECRET | 选定认证方案后的服务端密钥 |
| ADMIN_USER_IDS | 服务端 allowlist |
| AI_MODE | fake 或 live；production 禁止 fake 冒充真实结果 |
| SYNC_INTERVAL_MINUTES / BACKFILL_DAYS | 默认 60 / 90 |
| MAX_AGENT_STEPS / AGENT_TIMEOUT_MS | 默认 8 / 120000 |
| LOG_LEVEL | 日志级别 |

可后加 SENTRY_DSN、OTEL_EXPORTER_OTLP_ENDPOINT，V1 不以它们阻塞交付。根 .env 不提交，.env.example 仅空值/安全默认；README 说明哪个进程加载哪份配置。worker 的环境验证在启动时执行，缺失 required 配置明确失败。

无付费凭证模式也须能启动 Web/API/Worker，运行 fixture pipeline 和假模型 Agent；UI 清楚标记 demo 数据。正式同步不能把 fixtures 当真实官方最新更新。

## 18. 部署与缓存

- Web：原设计建议 Vercel；API：长期运行的 Docker container；Worker：独立长期运行 container；DB/Redis：托管服务。具体服务商待部署阶段选择。
- API 的 SSE 最大时长、Next BFF/托管平台超时必须实际测通；若 Web 平台不能承载 120 秒转发流，则配置受认证保护的 API 直连路径并严格 CORS，或缩短 run deadline，不能忽略超时限制。
- migration 作为一次性发布任务运行 `db:deploy`，不由每个副本并发自动迁移。
- API/Worker 镜像独立构建，持久状态不在容器磁盘；scheduler 多副本注册保持幂等。
- Redis 持久化、内存策略和恢复方案符合队列要求；DB 自动备份与恢复演练。
- 数据模型改动采用向后兼容迁移，先迁移再部署消费者；队列 payload 带 schemaVersion，跨版本任务不静默丢失。
- 公共页面初始缓存 TTL 60 秒；私人 Feed/对话与 SSE 不共享缓存。Worker 更新后可增加经鉴权的 revalidation；事件丢失仍靠短 TTL 收敛。
- freshness 来自 Source.lastSuccessAt，而不是 Next 页面生成时间；避免页面展示“刚更新”却使用旧数据。

## 19. 可观测性与性能

结构化日志至少包含 requestId、runId、jobId、projectId、sourceId、releaseId、provider、revision、durationMs、status。记录 provider 请求、队列等待时间/失败率、LLM latency/usage、embedding 状态、同步 lastSuccessAt。

Agent run 记录 model、steps、tool call names/counts、tokens、latency、citation count、finishReason；不保存或展示隐藏推理。可先将 run 摘要放 Message.metadata，确需独立查询再增加 AgentRun 表。

普通读 API P95 < 300ms 是原设计目标，测量条件固定：预热、分页 20、至少 12 项目/1000 Release/10000 Change、20 个并发客户端、1 分钟采样，记录环境。初期数据规模未达标时只记录实测值，不宣称已满足生产 SLO。Agent 单独测 first-status、first-token 与端到端时长，不套用 300ms。

runbook 包含来源停用、失败重试、stale job 恢复、版本策略修改、embedding 重建、迁移/回滚、API key 轮换和恢复备份。

## 20. 测试策略

默认 CI 无外部网络、无真实 LLM 费用；固定 fixtures + fake adapters。关键幂等、SQL、队列和 SSE 用真实 PostgreSQL/Redis 集成测试验证，不能全靠 mock。

| 层 | 必须验证 |
|---|---|
| Unit | 版本归一化、channel、semver/SDK 比较、provider mapping、hash、参数 schema、引用 ID 验证 |
| Provider fixtures | GitHub 分页/编辑/prerelease/空 body；RSS/Atom guid、重复、缺日期、非发布文章、截断 |
| DB integration | unique 约束、跨实体一致性、事务失败回滚、参数化过滤、vector 写入与指定模型检索 |
| Worker integration | 同任务重复/并发、429/timeout、修订竞争、落库后入队失败恢复、stale processing、embedding 重跑 |
| AI contract | schema 非法、无证据 quote、超长分片、prompt injection 内容、空 changes |
| Agent | 五工具、8 步/16 调用限制、歧义、缺来源、缺版本、覆盖不足、越权会话 |
| SSE | UTF-8 分块、多行/心跳、顺序、单终止事件、持久化失败、取消、BFF 不缓冲 |
| E2E | Explore→Follow→Feed→Release→Ask→Citation；Admin sync 202 与最终 ready |

最少 12 个固定 Agent 评估问题：项目最近更新、时间过滤、性能分类、breaking changes、精确版本、跨版本区间、unknown 版本、缺失 endpoint、无匹配来源、React/React Native 歧义、来源中恶意指令、对话越权。断言工具选择/过滤/事实证据/结果状态，避免绑定自然语言逐字输出。

实时 GitHub/LLM smoke test 仅开发者显式启用，限制条数/费用；报告来源时间和模型，不成为每次 CI 必跑项。

## 21. 里程碑与完成条件

| 里程碑 | 交付 | Gate |
|---|---|---|
| M0 工程骨架 | 工作区、3 apps、共享包、Compose、CI、README | 新机器按 README 启动；lint/typecheck/build 通过 |
| M1 数据与 API | 完整 Prisma schema/migrations、seed、Projects/Releases/Follows/Feed | 真实 DB 约束测试通过；dev user 与权限边界明确 |
| M2 采集纵向链路 | GitHub Provider、project-sync、修订/hash/reconciler | 同一 fixture 同步两次无重复；编辑会重新处理 |
| M3 结构化与检索 | AI extraction、Changes、embedding、metadata/keyword/vector search | 无证据输出被拒；embedding 失败可降级；过滤正确 |
| M4 Agent 与 SSE | 5 工具、bounded loop、会话/引用、POST SSE、Ask UI | 无来源不补答；版本区间正确；断开/完成状态正确 |
| M5 产品闭环 | RSS/Atom、Explore/Feed/Release/Admin、SEO/cache | 全链路 E2E 通过；扩展到核实过的首批项目 |
| M6 公开 Alpha | Auth 选型并集成、rate limit、部署、监控/runbook | dev auth 被 production 拒绝；SSE 部署实测；备份验证 |

每个里程碑先交付最小纵向可用功能，不一次生成所有模块的空壳后宣布完成。每次提交包含变更目的、实际运行检查和已知限制。

## 22. V1 Acceptance Criteria

- [ ] 一个 Git repo 包含 web/api/worker 与共享包；三服务可独立启动、构建、部署。
- [ ] 全新环境按 README 完成 install→infra→migration→seed→dev；无密钥可用明确标记的 fixtures。
- [ ] 首批 12 个候选项目逐一明确真实追踪对象与官方来源；无法核实者显式 paused，不声称已支持。
- [ ] GitHub 与 RSS/Atom 有测试过的 Provider；增量、分页、编辑检测、失败状态可观察。
- [ ] 同源重复同步、并发任务和重试不产生重复 Release/Follow/当前 Change 集。
- [ ] DB 与队列之间故障、stale processing、旧修订任务均有验证过的恢复路径。
- [ ] Release/Change 分离，版本保留 raw/normalized；stable 默认，unknown 不自动展示为稳定。
- [ ] extraction 输出通过 schema 与 evidence 检查；日期/版本/URL/身份来自官方采集。
- [ ] metadata filter 与关键词/向量检索均有效；embedding 失败有清楚的降级状态。
- [ ] 五工具可用，版本比较遵守区间/coverage 语义，未知或缺失不伪造完整结论。
- [ ] Agent 不超过规定步数/调用/时间预算；无证据时明确不足；最终事实有本 run 的有效官方引用。
- [ ] SSE 标准格式、终止事件、取消、最终内容与消息/引用持久化一致；部署链路不缓冲。
- [ ] Explore、Follow、Feed、Project、Release、Ask、Admin 核心流程 E2E 可用。
- [ ] 管理员可检查失败、停用来源和手动同步；普通用户无权管理来源/访问他人会话。
- [ ] 公开 Alpha 有真实认证、限流、来源 URL 防护；生产拒绝 Dev User/fake 事实模式。
- [ ] API P95 有按规定条件的测量报告；来源 freshness 与内容缓存策略可解释。
- [ ] CI 必需检查通过，README/runbook/.env.example 与实际实现一致。

若某项因外部来源缺失未达成，报告具体项目与限制，不用 mock、空接口或默认成功状态替代验收。

## 23. Codex 仓库 Bootstrap 任务清单

本交接只交付文档，不授权本轮直接创建远程仓库或发布站点。下一轮用户要求建仓时，按以下顺序执行；已有仓库优先检查并沿用，不覆盖用户改动。

### A. 初始化与版本基线

- [ ] 检查目标目录、已有 Git/AGENTS.md/文件，确认工作范围；仅空目录才执行初始化。
- [ ] 选择兼容 React 19 的 Next.js、受支持 Node LTS、pnpm/Nest/Prisma/BullMQ/SDK 版本；查官方兼容说明。
- [ ] 在 README/ADR 记录精确版本，设置 packageManager、engines、lockfile、Node 版本文件。
- [ ] 初始化 pnpm workspace 与 Turbo pipelines，确保依赖构建顺序和 dev 持续任务设置正确。
- [ ] 建立 .gitignore：node_modules、dist/.next、.env、日志、测试输出；提交 .env.example。
- [ ] 将本文件入 `docs/technical-design.md`，创建 source-catalog、architecture 与 ADR 目录。

### B. 应用和共享包

- [ ] 建 Next App Router/React 19/Tailwind/shadcn web，先做可运行首页。
- [ ] 建 Nest API：全局 /api/v1、validation、error filter、requestId、health、origin/CORS。
- [ ] 建独立 worker entrypoint 与 graceful shutdown；API 中不注册 consumer。
- [ ] 建 shared runtime schemas/enums/job contracts；各包显式 exports，避免 server-only 进入客户端。
- [ ] 建 database、ai adapter、source-providers 包，统一 TypeScript strict/lint。

### C. 本地基础设施与数据库

- [ ] Compose 加 PostgreSQL+pgvector、Redis、volumes、healthchecks；绑定开发环境合适端口。
- [ ] 环境验证与加载统一，root scripts 实现 infra/db/dev/build/test 命令。
- [ ] 完整 Prisma schema 和 migrations：基础实体、unique、indexes、relations、revision/status。
- [ ] SQL migration 创建 vector 扩展，选定模型维度，参数化 vector/全文检索 helper。
- [ ] seed 固定 Dev User、2～3 个已核实 Project/Source；fixture 与真实采集清楚分开。
- [ ] 验证空库 migration、重复 seed、约束和数据库连接关闭。

### D. 最小完整链路

- [ ] GitHubReleaseProvider + fixture tests，不硬编码项目分支。
- [ ] project-sync queue + scheduler + DB 幂等 upsert + sync health。
- [ ] pending intent/reconciler、lease/revision claim、重试、stale recovery。
- [ ] fake extraction → 真实 SDK adapter → schema/evidence validation → 事务写 Change。
- [ ] embedding queue + model/inputHash 校验 + keyword/vector search。
- [ ] Projects/Releases/Changes/Follows/Feed API 与最小页面。
- [ ] 五 Agent 工具 + MAX_STEPS=8 + 引用验证 + conversation ownership。
- [ ] POST fetch SSE、BFF 转发、取消、消息/引用保存、最终答案替换草稿。
- [ ] Admin 手动同步返回 202，展示 job/source 错误；RSS/Atom 后续并入统一链路。

### E. 验证与交付

- [ ] CI 安装、生成 client、迁移测试 DB、lint/typecheck/unit/integration/build；关键 E2E。
- [ ] 从全新开发配置实际启动三服务，完整走一次 fixture 和可选 live 同步。
- [ ] README 写真实命令、端口、凭证、demo 限制、排错、测试运行方法。
- [ ] runbook 写重试/恢复/重建/备份/迁移；记录未完成事项。
- [ ] 输出真实检查结果、可运行功能、已知风险；不把 scaffold 当 V1 完成。
- [ ] 远程 repo、推送、公开部署按后续用户授权与实际任务范围执行。

## 24. 可直接给 Codex 的开工任务

> 按 `docs/technical-design.md` 实施 What's New V1。先检查目标目录和现有说明，然后完成 M0：建立 pnpm/Turborepo monorepo，包含 Next.js + React 19 web、NestJS api、独立 BullMQ worker，以及 database/shared/ai/source-providers/config 包；创建本地 PostgreSQL+pgvector/Redis Compose、环境示例、根 scripts、health API、CI 和 README。核验依赖兼容性并固定版本。保持 Next 只做 UI/BFF、API 只生产队列、Worker 只异步处理的边界。先用 fixtures 和 fake AI adapter 验证无付费凭证可启动，再按 M1～M6 逐步扩展。不要加入 LangGraph、Python、Multi-Agent、自动升级或社区来源。每个里程碑报告实际验证与未完成项；遵守 No source, no answer。
