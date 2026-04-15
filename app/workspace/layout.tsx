import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workspace — AXIOM',
  robots: { index: false, follow: false },
};

export default function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="h-screen overflow-hidden">
      {children}
    </div>
  );
}
