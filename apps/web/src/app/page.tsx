import Link from 'next/link';
import { Button } from '@/components/ui/button';
const services = [
  { number: '01', title: 'Web', detail: 'Next.js App Router · React 19', copy: '内容页面与轻量 BFF，保留业务服务边界。', status: '工程已就绪' },
  { number: '02', title: 'API', detail: 'NestJS · REST', copy: '统一接口、输入验证与真实依赖健康检查。', status: '健康检查已就绪' },
  { number: '03', title: 'Worker', detail: 'Node.js · BullMQ', copy: '独立异步进程，fixture 验证来源与提取合约。', status: '演示流程已就绪' },
];
export default function Home() {
  return <main className="mx-auto min-h-screen max-w-6xl px-6 py-8 md:px-12">
    <header className="flex items-center justify-between border-b border-border pb-6">
      <Link href="/" className="text-xl font-bold tracking-tight">what’s new<span className="text-emerald-600">.</span></Link>
      <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium">M0 · Local development</span>
    </header>
    <section className="grid gap-10 py-20 md:grid-cols-[1.4fr_1fr] md:items-center">
      <div>
        <p className="mb-6 text-xs font-semibold tracking-[0.2em] text-emerald-800">SOFTWARE UPDATE INTELLIGENCE</p>
        <h1 className="text-5xl font-semibold leading-[1.12] tracking-tight md:text-6xl">跟上变化。<br /><span className="text-emerald-700">从官方来源开始。</span></h1>
        <p className="mt-7 max-w-lg text-base leading-8 text-slate-600">聚合你关注的软件、框架与工具更新，让每一条回答都有可核验的出处。</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Button asChild><a href="#foundation">查看工程基线 <span aria-hidden="true">↗</span></a></Button>
          <Button asChild variant="outline"><a href="/api/v1/health/live">检查 API 连接</a></Button>
        </div>
      </div>
      <aside className="rounded-2xl border border-border bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-slate-500">THE PRINCIPLE</p>
        <p className="mt-7 text-3xl font-medium leading-tight">No source,<br />no answer.</p>
        <div className="my-7 h-px bg-border" />
        <p className="text-sm leading-7 text-slate-600">当前为工程初始化阶段。演示 fixture 是合成数据，不代表任何软件的真实更新；官方采集、关注与 Agent 将按后续里程碑交付。</p>
        <span className="mt-6 inline-block rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">DEMO · 无需付费凭证</span>
      </aside>
    </section>
    <section id="foundation" className="pb-16">
      <div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-semibold">独立运行，共享合约</h2><span className="text-xs text-slate-500">FOUNDATION / 3 SERVICES</span></div>
      <div className="grid gap-4 md:grid-cols-3">{services.map(service => <article key={service.number} className="rounded-xl border border-border bg-white p-6">
        <div className="flex items-center justify-between"><span className="font-mono text-xs text-slate-400">{service.number}</span><span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" /></div>
        <h3 className="mt-6 text-2xl font-semibold">{service.title}</h3><p className="mt-2 text-xs text-emerald-800">{service.detail}</p>
        <p className="mt-5 text-sm leading-7 text-slate-600">{service.copy}</p><p className="mt-6 border-t border-border pt-4 text-xs text-slate-500">{service.status} · 运行状态请查探针</p>
      </article>)}</div>
    </section>
    <footer className="flex flex-wrap justify-between gap-3 border-t border-border py-6 text-xs text-slate-500"><span>What’s New · V1 engineering foundation</span><span>Official sources. Traceable evidence.</span></footer>
  </main>;
}
