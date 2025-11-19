import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) redirect('/auth/signin');

  if (session.user.role === 'admin') redirect('/admin/comptables');
  else if (session.user.role === 'comptable') redirect('/comptable/dashboard');
  else if (session.user.role === 'client') redirect('/client/dashboard');
}
