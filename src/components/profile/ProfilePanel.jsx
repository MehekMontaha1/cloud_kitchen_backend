import { useState, useEffect, useRef } from 'react';
import { Card, Input, Button } from '../common';
import { User, Mail, Phone, Lock, Store, Save, MapPin, Camera, Upload, CheckCircle, AlertCircle, Loader } from 'lucide-react';

/* ─── Role badge colours ─── */
const ROLE_COLORS = {
  customer:  { bg: 'bg-indigo-100', text: 'text-indigo-700',  ring: 'ring-indigo-400' },
  seller:    { bg: 'bg-orange-100', text: 'text-orange-700',  ring: 'ring-orange-400' },
  delivery:  { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-400' },
  admin:     { bg: 'bg-rose-100',   text: 'text-rose-700',    ring: 'ring-rose-400'   },
};

const ROLE_LABELS = {
  customer: 'Customer',
  seller: 'Kitchen Seller',
  delivery: 'Delivery Partner',
  admin: 'Administrator',
};

/* ─── Default avatar placeholder ─── */
const DEFAULT_AVATAR = (name = '') => {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  return initials;
};

const ProfilePanel = ({ session, onUpdate }) => {
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    shop_name: '',
    location: '',
    password: '',
    avatar_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  /* ─── Photo upload states ─── */
  const [photoPreview, setPhotoPreview] = useState(null); // local blob URL for preview
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMsg, setPhotoMsg] = useState({ type: '', text: '' });

  /* ─── Report states ─── */
  const [report, setReport] = useState({ title: '', description: '' });
  const [reportMsg, setReportMsg] = useState({ type: '', text: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  /* ─── Fetch profile on mount ─── */
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
              password: '',
              avatar_url: result.data.avatar_url || '',
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

  /* ─── Pick photo ─── */
  const handlePickPhoto = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setPhotoMsg({ type: 'error', text: 'Invalid file type. Please select a JPEG, PNG, WebP, or GIF image.' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoMsg({ type: 'error', text: 'File too large. Maximum allowed size is 5 MB.' });
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoMsg({ type: '', text: '' });
  };

  /* ─── Upload photo ─── */
  const handleUploadPhoto = async () => {
    if (!photoFile) return;
    setPhotoUploading(true);
    setPhotoMsg({ type: '', text: '' });
    try {
      const form = new FormData();
      form.append('photo', photoFile);

      const res = await fetch('/api/users/avatar', { method: 'POST', body: form });
      const result = await res.json();

      if (res.ok && result.success) {
        const newUrl = result.data.avatar_url;
        setProfile(p => ({ ...p, avatar_url: newUrl }));
        setPhotoPreview(null);
        setPhotoFile(null);
        setPhotoMsg({ type: 'success', text: 'Profile photo updated successfully!' });
        if (onUpdate) onUpdate(result.data.profile);
      } else {
        setPhotoMsg({ type: 'error', text: result.error || 'Upload failed. Please try again.' });
      }
    } catch (err) {
      console.error('Photo upload error:', err);
      setPhotoMsg({ type: 'error', text: 'An unexpected error occurred during upload.' });
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ─── Save profile info ─── */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        if (onUpdate) onUpdate(result.data);
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

  /* ─── Submit report ─── */
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!report.title || !report.description) return;
    setSubmittingReport(true);
    setReportMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/users/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const role = session?.role || 'customer';
  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.customer;
  const displayAvatar = photoPreview || profile.avatar_url;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* ── Page header ── */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">My Profile</h2>
        <p className="mt-1 text-slate-500">View and update your personal information, photo, and credentials.</p>
      </div>

      {/* ── Profile photo card ── */}
      <Card>
        <h3 className="mb-5 text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Camera className="h-5 w-5 text-orange-500" />
          Profile Photo
        </h3>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          {/* Avatar display */}
          <div className="relative shrink-0 group cursor-pointer" onClick={handlePickPhoto}>
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt="Profile"
                className={`h-28 w-28 rounded-full object-cover ring-4 ${roleColor.ring} shadow-lg transition-all duration-200 group-hover:brightness-75`}
              />
            ) : (
              <div
                className={`h-28 w-28 rounded-full flex items-center justify-center text-3xl font-bold ring-4 ${roleColor.ring} shadow-lg ${roleColor.bg} ${roleColor.text} transition-all duration-200 group-hover:brightness-90 select-none`}
              >
                {DEFAULT_AVATAR(profile.full_name)}
              </div>
            )}
            {/* Camera overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Camera className="h-7 w-7 text-white" />
            </div>
          </div>

          {/* Upload controls */}
          <div className="flex-1 space-y-3 w-full">
            <div>
              <p className="text-sm font-semibold text-slate-700">{profile.full_name || 'Your Name'}</p>
              <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${roleColor.bg} ${roleColor.text}`}>
                {ROLE_LABELS[role] || role}
              </span>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePickPhoto}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
              >
                <Upload className="h-3.5 w-3.5 text-slate-500" />
                {photoPreview ? 'Change Photo' : 'Choose Photo'}
              </button>

              {photoFile && (
                <button
                  type="button"
                  onClick={handleUploadPhoto}
                  disabled={photoUploading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:opacity-60"
                >
                  {photoUploading ? (
                    <><Loader className="h-3.5 w-3.5 animate-spin" /> Uploading…</>
                  ) : (
                    <><Save className="h-3.5 w-3.5" /> Save Photo</>
                  )}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400">Supported: JPEG, PNG, WebP, GIF · Max 5 MB</p>

            {/* Photo preview name */}
            {photoFile && (
              <p className="text-[11px] text-slate-500 italic truncate">
                Selected: {photoFile.name}
              </p>
            )}

            {/* Photo upload status */}
            {photoMsg.text && (
              <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
                photoMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {photoMsg.type === 'success'
                  ? <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                  : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                {photoMsg.text}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── Profile info card ── */}
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

          {session?.role === 'seller' && (
            <Input
              label="Shop Name"
              icon={<Store className="h-4 w-4 text-slate-400" />}
              value={profile.shop_name}
              onChange={(e) => setProfile(p => ({ ...p, shop_name: e.target.value }))}
              placeholder="Enter your shop name"
              required
            />
          )}

          {(session?.role === 'seller' || session?.role === 'delivery') && (
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
            <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success'
                ? <CheckCircle className="h-4 w-4 shrink-0" />
                : <AlertCircle className="h-4 w-4 shrink-0" />}
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

      {/* ── Report a problem card ── */}
      {session?.role !== 'admin' && (
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
              <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                reportMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {reportMsg.type === 'success'
                  ? <CheckCircle className="h-4 w-4 shrink-0" />
                  : <AlertCircle className="h-4 w-4 shrink-0" />}
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
