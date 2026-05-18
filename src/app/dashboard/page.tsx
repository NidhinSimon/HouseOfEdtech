import DashboardClient from './DashboardClient';
import { getApplicationsData, type ApplicationRecord } from '@/lib/applications';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function DashboardPage() {
  let initialApps: ApplicationRecord[] = [];
  let userName = 'User';
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    if (user) {
      userName = user.user_metadata?.full_name || user.email || 'User';
      // Extract just the first name if full name is provided
      if (userName && userName !== 'User') {
        userName = userName.split(' ')[0];
      }
    }

    initialApps = await getApplicationsData(userId);
  } catch (error) {
    console.error('Failed to preload dashboard applications:', error);
  }

  return <DashboardClient initialApps={initialApps} userName={userName} />;
}
