import { useState } from 'react';
import { Card, BarChart, LineChart, StatCard, Badge } from '../common';
import { analyticsData, dailyOrdersData, growthData } from '../../data/adminData';

const icons = {
  users: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  orders: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  revenue: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  sellers: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  delivery: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  satisfaction: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const AnalyticsDashboard = () => {
  const [activeChart, setActiveChart] = useState('orders');

  const stats = [
    { key: 'totalUsers', label: 'Total Users', icon: icons.users },
    { key: 'ordersToday', label: 'Orders Today', icon: icons.orders },
    { key: 'monthlyRevenue', label: 'Monthly Revenue', icon: icons.revenue },
    { key: 'activeSellers', label: 'Active Sellers', icon: icons.sellers },
    { key: 'avgDeliveryTime', label: 'Avg. Delivery', icon: icons.delivery },
    { key: 'customerSatisfaction', label: 'Satisfaction', icon: icons.satisfaction },
  ];

  return (
    <Card>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Platform Analytics</h2>
        <p className="mt-1 text-sm text-slate-500">
          Real-time insights into platform performance and growth metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => {
          const data = analyticsData[stat.key];
          return (
            <StatCard
              key={stat.key}
              label={stat.label}
              value={data.value}
              delta={data.delta}
              trend={data.trend}
              icon={stat.icon}
            />
          );
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-4 border-b border-slate-200">
          <button
            onClick={() => setActiveChart('orders')}
            className={`pb-3 text-sm font-medium transition-colors ${activeChart === 'orders'
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Daily Orders
          </button>
          <button
            onClick={() => setActiveChart('revenue')}
            className={`pb-3 text-sm font-medium transition-colors ${activeChart === 'revenue'
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Revenue Trend
          </button>
          <button
            onClick={() => setActiveChart('growth')}
            className={`pb-3 text-sm font-medium transition-colors ${activeChart === 'growth'
                ? 'border-b-2 border-slate-900 text-slate-900'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Monthly Growth
          </button>
        </div>

        <div className="mt-6">
          {activeChart === 'orders' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Orders This Week</p>
                  <p className="text-2xl font-semibold text-slate-900">489</p>
                </div>
                <Badge variant="success">+12.3% vs last week</Badge>
              </div>
              <BarChart
                data={dailyOrdersData.map(d => ({ day: d.day, value: d.orders }))}
                height={200}
                showValues
              />
            </div>
          )}

          {activeChart === 'revenue' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Revenue This Week</p>
                  <p className="text-2xl font-semibold text-slate-900">$13,090</p>
                </div>
                <Badge variant="success">+8.7% vs last week</Badge>
              </div>
              <LineChart
                data={dailyOrdersData.map(d => ({ value: d.revenue }))}
                height={200}
              />
            </div>
          )}

          {activeChart === 'growth' && (
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="mb-4 text-sm font-medium text-slate-700">User Growth</p>
                <LineChart
                  data={growthData.map(d => ({ value: d.users }))}
                  height={150}
                  lineColor="#8b5cf6"
                />
              </div>
              <div>
                <p className="mb-4 text-sm font-medium text-slate-700">Order Volume</p>
                <LineChart
                  data={growthData.map(d => ({ value: d.orders }))}
                  height={150}
                  lineColor="#f97316"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AnalyticsDashboard;
