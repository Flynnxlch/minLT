import { Card } from '../widgets';

// Sample users data
const SAMPLE_USERS = [
  { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'Risk Manager', regionCabang: 'ID', department: 'Operations', avatar: '/src/assets/img/user1-128x128.jpg', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Compliance Officer', regionCabang: 'US', department: 'Legal', avatar: '/src/assets/img/user3-128x128.jpg', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'Internal Auditor', regionCabang: 'GB', department: 'Audit', avatar: '/src/assets/img/user8-128x128.jpg', status: 'active' },
  { id: 4, name: 'Alice Williams', email: 'alice.williams@example.com', role: 'Risk Analyst', regionCabang: 'JP', department: 'Risk Management', avatar: '/src/assets/img/user5-128x128.jpg', status: 'active' },
  { id: 5, name: 'Charlie Brown', email: 'charlie.brown@example.com', role: 'Security Officer', regionCabang: 'AU', department: 'IT Security', avatar: '/src/assets/img/user2-160x160.jpg', status: 'inactive' },
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
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Department</th>
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
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{user.regionCabang}</td>
                <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{user.department}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current opacity-60"></span>
                    {user.status === 'active' ? 'Active' : 'Inactive'}
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

