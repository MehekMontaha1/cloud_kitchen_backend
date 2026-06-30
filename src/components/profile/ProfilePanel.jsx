import { useState, useEffect } from 'react';
import { Card, Input, Button } from '../common';
import { User, Mail, Phone, Lock, Store, Save, MapPin } from 'lucide-react';

const ProfilePanel = ({ session, onUpdate }) => {
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    shop_name: '',
    location: '',
    password: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Report a problem states
  const [report, setReport] = useState({ title: '', description: '' });
  const [reportMsg, setReportMsg] = useState({ type: '', text: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/users/profile');
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setProfile({
              full_name: result.data.full_name || '',
              email: result.data.email || '',
              phone: result.data.phone || '',
              shop_name: result.data.shop_name || '',
              location: result.data.location || '',
              password: ''
            });
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        if (onUpdate) {
          onUpdate(result.data);
        }
        setProfile(prev => ({ ...prev, password: '' }));
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSaving(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!report.title || !report.description) return;
    setSubmittingReport(true);
    setReportMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/users/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setReportMsg({ type: 'success', text: 'Report submitted successfully to administrator.' });
        setReport({ title: '', description: '' });
      } else {
        setReportMsg({ type: 'error', text: result.error || 'Failed to submit report' });
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setReportMsg({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">My Profile</h2>
        <p className="mt-1 text-slate-500">View and update your personal information and credentials.</p>
      </div>

      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name"
            icon={<User className="h-4 w-4 text-slate-400" />}
            value={profile.full_name}
            onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
            required
          />

          <Input
            label="Email Address"
            icon={<Mail className="h-4 w-4 text-slate-400" />}
            type="email"
            value={profile.email}
            onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
            required
          />

          <Input
            label="Phone Number"
            icon={<Phone className="h-4 w-4 text-slate-400" />}
            value={profile.phone}
            onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
            required
          />

          {session.role === 'seller' && (
            <Input
              label="Shop Name"
              icon={<Store className="h-4 w-4 text-slate-400" />}
              value={profile.shop_name}
              onChange={(e) => setProfile(p => ({ ...p, shop_name: e.target.value }))}
              placeholder="Enter your shop name"
              required
            />
          )}

          {(session.role === 'seller' || session.role === 'delivery') && (
            <Input
              label="Operating Location / City"
              icon={<MapPin className="h-4 w-4 text-slate-400" />}
              value={profile.location}
              onChange={(e) => setProfile(p => ({ ...p, location: e.target.value }))}
              placeholder="e.g. Downtown, Uptown, City Center"
              required
            />
          )}

          <Input
            label="New Password (Optional)"
            icon={<Lock className="h-4 w-4 text-slate-400" />}
            type="password"
            value={profile.password}
            onChange={(e) => setProfile(p => ({ ...p, password: e.target.value }))}
            placeholder="Leave blank to keep current password"
          />

          {message.text && (
            <div className={`p-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              icon={<Save className="h-4 w-4" />}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>

      {session.role !== 'admin' && (
        <Card>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Report a Problem</h3>
            <p className="text-sm text-slate-500">Submit any platform issues, delivery issues, or seller problems directly to the system administrator.</p>
          </div>
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <Input
              label="Subject"
              value={report.title}
              onChange={(e) => setReport(r => ({ ...r, title: e.target.value }))}
              placeholder="Brief summary of the issue"
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-600">Details</label>
              <textarea
                className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-orange-500 focus:outline-none"
                rows="4"
                value={report.description}
                onChange={(e) => setReport(r => ({ ...r, description: e.target.value }))}
                placeholder="Describe your problem in detail..."
                required
              />
            </div>
            {reportMsg.text && (
              <div className={`p-3 rounded-lg text-sm ${
                reportMsg.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {reportMsg.text}
              </div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={submittingReport}>
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default ProfilePanel;
