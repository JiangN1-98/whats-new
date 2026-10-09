import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: "What's New · Software Update Intelligence", description: '从官方来源了解软件更新。No source, no answer.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
