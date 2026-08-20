import { supabase } from '@/lib/supabase';
import ApproveButton from '@/components/ApproveButton';

// Force Next.js to always fetch fresh data when loading this page
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Fetch all profiles
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return <div>Error loading users: {error.message}</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Pending Registrations</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden border">
        {users?.length === 0 ? (
          <p className="p-4 text-gray-500">No users found.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {users.map((user) => (
              <li key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                
                {/* User Details */}
                <div>
                  <p className="font-medium text-gray-900">
                    {user.full_name || 'Unknown User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.email || 'No email provided'}
                  </p>
                </div>

                {/* The Approve Button Component */}
                <ApproveButton 
                  userId={user.id} 
                  isVerified={user.is_verified} 
                />
                
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}