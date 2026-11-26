import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = { title: '운명의 정원', description: '사주로 열리는 나만의 운명 세계. 작은 정원을 탐험하며 나의 운명을 발견하세요.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: 'cover', themeColor: '#170c36' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
