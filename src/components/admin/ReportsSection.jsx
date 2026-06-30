import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../common';
import { AlertCircle, CheckCircle, Search, RefreshCw } from 'lucide-react';

const statusConfig = {
  open: { variant: 'danger', label: 'Open' },
  investigating: { variant: 'warning', label: 'Investigating' },
  resolved: { variant: 'success', label: 'Resolved' }
};

const ReportsSection = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const result = await res.json();
        if (result.success) setReports(result.data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          setReports(prev =>
            prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r)
          );
        }
      } else {
        const errData = await res.json();
        alert('Failed to update status: ' + (errData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating report status:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Card>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">User Support Reports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor and resolve issues filed by customers, sellers, and delivery partners.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={fetchReports}>
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <p className="text-center py-8 text-sm text-slate-400">No support reports submitted yet.</p>
        ) : (
          reports.map((report) => {
            const status = statusConfig[report.status] || { variant: 'neutral', label: report.status };
            const reporter = report.reporter || { full_name: 'Unknown User', email: 'N/A', role: 'customer' };
            const dateStr = report.created_at ? new Date(report.created_at).toLocaleString() : 'N/A';

            return (
              <div key={report.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant} size="sm">{status.label}</Badge>
                      <span className="text-xs text-slate-400">{dateStr}</span>
                    </div>
                    <h3 className="mt-1.5 font-semibold text-slate-950">{report.title}</h3>
                  </div>

                  {report.status !== 'resolved' && (
                    <div className="flex gap-2">
                      {report.status === 'open' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(report.id, 'investigating')}
                        >
                          Investigate
                        </Button>
                      )}
                      <Button
                        variant="success"
                        size="sm"
                        icon={<CheckCircle className="h-3.5 w-3.5" />}
                        onClick={() => handleUpdateStatus(report.id, 'resolved')}
                      >
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {report.description}
                </p>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                  <div>
                    Reported by: <span className="font-semibold text-slate-700">{reporter.full_name}</span> ({reporter.email})
                  </div>
                  <div>
                    Role: <Badge variant={reporter.role === 'customer' ? 'success' : reporter.role === 'seller' ? 'warning' : 'info'} size="xs">
                      {reporter.role === 'delivery_partner' ? 'Delivery Partner' : reporter.role}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default ReportsSection;
