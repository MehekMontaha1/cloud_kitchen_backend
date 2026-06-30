import { useState, useEffect } from 'react';
import { Card, StatCard } from '../common';
import { Users, ShoppingBag, DollarSign, Store, Truck, AlertTriangle } from 'lucide-react';

const AnalyticsDashboard = () => {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeSellers: 0,
    activeDelivery: 0,
    openReports: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data) {
          setMetrics(result.data);
        }
      }
    } catch (err) {
      console.error('Error fetching analytics metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Users', value: metrics.totalUsers, icon: <Users className="h-5 w-5 text-indigo-500" /> },
    { label: 'Total Orders', value: metrics.totalOrders, icon: <ShoppingBag className="h-5 w-5 text-emerald-500" /> },
    { label: 'Total Revenue', value: `$${Number(metrics.totalRevenue).toFixed(2)}`, icon: <DollarSign className="h-5 w-5 text-amber-500" /> },
    { label: 'Active Sellers', value: metrics.activeSellers, icon: <Store className="h-5 w-5 text-orange-500" /> },
    { label: 'Active Riders', value: metrics.activeDelivery, icon: <Truck className="h-5 w-5 text-sky-500" /> },
    { label: 'Open Reports', value: metrics.openReports, icon: <AlertTriangle className="h-5 w-5 text-rose-500" /> },
  ];

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Platform Analytics</h2>
        <p className="mt-1 text-sm text-slate-500">
          Real-time metrics computed directly from the platform database.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
          />
        ))}
      </div>
    </Card>
  );
};

export default AnalyticsDashboard;
