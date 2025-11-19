import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'client') {
    redirect('/auth/signin');
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar userRole="client" />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header user={session.user} />
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}