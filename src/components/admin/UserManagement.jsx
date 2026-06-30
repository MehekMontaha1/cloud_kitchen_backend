import { useState, useMemo } from 'react';
import { Card, Button, Badge, Input } from '../common';
import { Trash2, Search, Filter, Shield } from 'lucide-react';

const roleBadges = {
  customer: { variant: 'success', label: 'Customer' },
  seller: { variant: 'warning', label: 'Seller' },
  delivery_partner: { variant: 'info', label: 'Delivery Partner' },
  super_admin: { variant: 'danger', label: 'Super Admin' }
};

const UserManagement = ({ users, onDelete }) => {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery = 
        (user.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(query.toLowerCase()) ||
        (user.id || '').toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, roleFilter, query]);

  const handleDelete = (userId, name) => {
    if (confirm(`Are you sure you want to delete the user "${name}"? This action will permanently remove their account.`)) {
      onDelete(userId);
    }
  };

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">User Management</h2>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter, and manage all platform users (Customers, Sellers, and Delivery Partners).
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>
        
        <select
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="customer">Customers</option>
          <option value="seller">Sellers</option>
          <option value="delivery_partner">Delivery Partners</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 text-left">
              <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">User</th>
              <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Role</th>
              <th className="pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => {
              const roleInfo = roleBadges[user.role] || { variant: 'neutral', label: user.role };
              return (
                <tr key={user.id} className="group hover:bg-slate-50/50">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold text-sm">
                        {(user.name || 'U').split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                        <p className="text-[10px] text-slate-300">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <Badge variant={roleInfo.variant} size="sm">
                      {roleInfo.label}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <Badge variant={user.status === 'approved' ? 'success' : user.status === 'pending' ? 'warning' : 'danger'} size="sm" dot>
                      {user.status || 'approved'}
                    </Badge>
                  </td>
                  <td className="py-4 text-right">
                    {user.role !== 'super_admin' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 className="h-3.5 w-3.5" />}
                        onClick={() => handleDelete(user.id, user.name)}
                      >
                        Delete
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center justify-end gap-1">
                        <Shield className="h-3.5 w-3.5 text-slate-400" /> System Protected
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-sm text-slate-500">No users found matching your criteria.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default UserManagement;
