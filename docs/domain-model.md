# Domain model status

M0 实现 User（UUID、可空唯一 externalAuthId、displayName、UTC timestamps），用以验证客户端与迁移流程。基础 migration 启用 vector 扩展。

M1 依交接第 4–5 节增加 Project / Source / Release / Change / ChangeEmbedding / Follow / Conversation / Message / Citation，以及跨实体组合约束、修订与证据快照。当前不得把尚未实现的领域模型当可用接口。

Embedding 模型、维度与向量索引尚未选择，M0 不添加占位 vector(D) 或伪造配置值。
