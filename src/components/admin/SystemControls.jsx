import { useState } from 'react';
import { Card, Button, Badge, Toggle } from '../common';

const SystemControls = ({ paused, onToggle }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastChanged, setLastChanged] = useState(null);

  const handleToggle = () => {
    setIsAnimating(true);
    setLastChanged(new Date());
    onToggle();
    setTimeout(() => setIsAnimating(false), 500);
  };

  const formatLastChanged = () => {
    if (!lastChanged) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - lastChanged) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return lastChanged.toLocaleTimeString();
  };

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">System Controls</h2>
        <p className="mt-1 text-sm text-slate-500">
          Emergency controls to manage platform-wide operations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-slate-900">Order Processing</h3>
                  <Badge variant={paused ? 'danger' : 'success'} size="md" dot>
                    {paused ? 'Paused' : 'Active'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {paused 
                    ? 'New orders are blocked. Existing orders will be fulfilled.'
                    : 'Orders are being accepted and processed normally.'}
                </p>
              </div>
            </div>

            <div className={`mt-4 flex items-center gap-4 transition-all duration-300 ${isAnimating ? 'scale-105' : ''}`}>
              <Toggle 
                checked={!paused} 
                onChange={() => handleToggle()}
                size="lg"
              />
              <span className="text-sm text-slate-500">
                Last changed: {formatLastChanged()}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-medium text-slate-700">Quick Actions</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear Cache
              </Button>
              <Button variant="secondary" size="sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Logs
              </Button>
              <Button variant="secondary" size="sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-medium text-slate-700">System Status</h4>
            <div className="mt-3 space-y-3">
              <StatusItem label="API Servers" status="operational" />
              <StatusItem label="Database" status="operational" />
              <StatusItem label="Payment Gateway" status="operational" />
              <StatusItem label="Push Notifications" status="operational" />
              <StatusItem label="CDN" status="degraded" warning />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h4 className="text-sm font-medium text-slate-700">Active Sessions</h4>
            <div className="mt-3 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-slate-900">1,247</p>
                <p className="text-xs text-slate-500">Customers</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">89</p>
                <p className="text-xs text-slate-500">Sellers</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">12</p>
                <p className="text-xs text-slate-500">Admins</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const StatusItem = ({ label, warning = false }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-slate-600">{label}</span>
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${
      warning ? 'text-amber-600' : 'text-emerald-600'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${warning ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
      {warning ? 'Degraded' : 'Operational'}
    </span>
  </div>
);

export default SystemControls;
