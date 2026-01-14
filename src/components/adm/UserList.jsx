import { Card } from '../widgets';
import UserIcon from '../ui/UserIcon';

// Helper function to truncate text
function truncateText(value, maxChars) {
  const s = String(value ?? '');
  if (!maxChars || maxChars <= 0) return s;
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars)}...`;
}

// Sample users data
const SAMPLE_USERS = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Risk Manager', regionCabang: 'ID', department: 'Operations', userRole: 'Admin Pusat' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Compliance Officer', regionCabang: 'US', department: 'Legal', userRole: 'Admin Cabang' },
  { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'Internal Auditor', regionCabang: 'GB', department: 'Audit', userRole: 'User biasa' },
  { id: 4, name: 'Alice Williams', email: 'alice.williams@example.com', role: 'Risk Analyst', regionCabang: 'JP', department: 'Risk Management', userRole: 'Admin Cabang' },
  { id: 5, name: 'Charlie Brown', email: 'charlie.brown@example.com', role: 'Security Officer', regionCabang: 'AU', department: 'IT Security', userRole: 'User biasa' },
];

export default function UserList() {
  return (
    <Card title="User Management" collapsible>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-[var(--color-card-border-dark)]">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">User</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Region/Cabang</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Divisi</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Status</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_USERS.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 dark:border-[var(--color-card-border-dark)] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-white" title={user.name}>
                    {truncateText(user.name, 20)}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{user.regionCabang}</td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300" title={user.department}>
                  {truncateText(user.department, 20)}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      user.userRole === 'Admin Pusat'
                        ? 'bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
                        : user.userRole === 'Admin Cabang'
                        ? 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current opacity-60"></span>
                    {user.userRole}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

