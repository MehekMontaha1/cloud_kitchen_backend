import { useState, useMemo } from 'react';
import { Card, Button, Badge, Input } from '../common';

const statusConfig = {
  pending: { variant: 'warning', label: 'Pending' },
  approved: { variant: 'success', label: 'Approved' },
  rejected: { variant: 'danger', label: 'Rejected' },
};

const CustomerVerification = ({ customers, onAction }) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => {
        const matchesQuery = 
          customer.name.toLowerCase().includes(query.toLowerCase()) ||
          customer.email.toLowerCase().includes(query.toLowerCase()) ||
          customer.id.toLowerCase().includes(query.toLowerCase());
        const matchesFilter = filter === 'all' || customer.status === filter;
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'status') return a.status.localeCompare(b.status);
        return new Date(b.joinedAt) - new Date(a.joinedAt);
      });
  }, [customers, filter, query, sortBy]);

  const counts = useMemo(() => ({
    all: customers.length,
    pending: customers.filter(c => c.status === 'pending').length,
    approved: customers.filter(c => c.status === 'approved').length,
    rejected: customers.filter(c => c.status === 'rejected').length,
  }), [customers]);

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Customer Verification</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage customer verification requests with search and filters.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by name, email, or ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        
        <select
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All ({counts.all})</option>
          <option value="pending">Pending ({counts.pending})</option>
          <option value="approved">Approved ({counts.approved})</option>
          <option value="rejected">Rejected ({counts.rejected})</option>
        </select>

        <select
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
          <option value="status">Sort by Status</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Customer</th>
              <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Location</th>
              <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 hidden sm:table-cell">Joined</th>
              <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCustomers.map((customer) => {
              const status = statusConfig[customer.status];
              return (
                <tr key={customer.id} className="group hover:bg-slate-50/50">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white font-semibold text-sm">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{customer.name}</p>
                        <p className="text-xs text-slate-400">{customer.email}</p>
                        <p className="text-xs text-slate-400 md:hidden">{customer.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {customer.city}
                    </span>
                  </td>
                  <td className="py-4 hidden sm:table-cell">
                    <span className="text-sm text-slate-500">{customer.joinedAt}</span>
                  </td>
                  <td className="py-4">
                    <Badge variant={status.variant} size="md" dot>
                      {status.label}
                    </Badge>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-end gap-2">
                      {customer.status === 'pending' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => onAction(customer.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => onAction(customer.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {customer.status !== 'pending' && (
                        <span className="text-xs text-slate-400">No action needed</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredCustomers.length === 0 && (
          <div className="py-12 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-sm text-slate-500">No customers found matching your criteria.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CustomerVerification;
