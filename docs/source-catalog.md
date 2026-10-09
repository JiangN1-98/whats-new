# Source catalog

M0 不启用真实来源，也不 seed 发布记录。以下是待核定对象清单，状态均为 **paused / 未登记**；须在 M1/M2 验证官方身份、真实 URL、版本策略与回填范围后逐一启用。

| 候选 | 建议跟踪对象 | 状态 |
|---|---|---|
| React | React JavaScript library | paused |
| Next.js | Next.js framework | paused |
| Vue | Vue core | paused |
| Vite | Vite build tool | paused |
| TypeScript | TypeScript compiler | paused |
| React Native | React Native framework | paused |
| Expo | Expo SDK（明确 SDK 与 CLI 粒度） | paused |
| Node.js | Node.js runtime | paused |
| NestJS | NestJS framework | paused |
| LangChain | JavaScript ecosystem（待核定） | paused |
| LangGraph | JavaScript ecosystem（待核定） | paused |
| OpenAI | openai-js SDK；API 平台另建项目 | paused |

FixtureProvider 使用合成数据，URL 为保留的 `example.invalid` 域；不属于官方来源，不进入正式 seed、Feed 或 Agent 引用。首条真实纵向链路优先核定 2–3 个来源，避免把库的工程依赖版本当成产品收录事实。
