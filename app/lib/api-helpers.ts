// Constants and helpers for frontend integration
export const AUTH_ENDPOINTS = {
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  SESSION: '/api/auth/session',
};

export const USER_ENDPOINTS = {
  PROFILE: '/api/users/profile',
  DOCUMENTS: '/api/users/documents',
};

export const ADMIN_ENDPOINTS = {
  PENDING_APPROVALS: '/api/admin/pending-approvals',
  ALL_USERS: '/api/admin/users',
  APPROVE_USER: (userId: string) => `/api/admin/users/${userId}/approve`,
  REJECT_USER: (userId: string) => `/api/admin/users/${userId}/reject`,
  CUSTOMERS: '/api/admin/customers',
};

export const ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  DELIVERY_PARTNER: 'delivery_partner',
  SUPER_ADMIN: 'super_admin',
} as const;

export const ROLE_DASHBOARDS: Record<string, string> = {
  [ROLES.CUSTOMER]: '/customer/dashboard',
  [ROLES.SELLER]: '/seller/dashboard',
  [ROLES.DELIVERY_PARTNER]: '/delivery/dashboard',
  [ROLES.SUPER_ADMIN]: '/admin/dashboard',
};

export const STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const STATUS_LABELS: Record<string, string> = {
  [STATUS.PENDING]: 'Awaiting Approval',
  [STATUS.APPROVED]: 'Approved',
  [STATUS.REJECTED]: 'Rejected',
};

// Helper functions for frontend

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  phone: string,
  role: 'customer' | 'seller' | 'delivery_partner'
) {
  const res = await fetch(AUTH_ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName,
      phone,
      role,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }

  return await res.json();
}

/**
 * Login user
 */
export async function loginUser(email: string, password: string) {
  const res = await fetch(AUTH_ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }

  return await res.json();
}

/**
 * Logout user
 */
export async function logoutUser() {
  const res = await fetch(AUTH_ENDPOINTS.LOGOUT, {
    method: 'POST',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Logout failed');
  }

  return await res.json();
}

/**
 * Get current user session
 */
export async function getSession() {
  const res = await fetch(AUTH_ENDPOINTS.SESSION);

  if (!res.ok) {
    return null;
  }

  return await res.json();
}

/**
 * Get user profile
 */
export async function getUserProfile() {
  const res = await fetch(USER_ENDPOINTS.PROFILE);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch profile');
  }

  return await res.json();
}

/**
 * Update user profile
 */
export async function updateUserProfile(fullName?: string, phone?: string) {
  const res = await fetch(USER_ENDPOINTS.PROFILE, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: fullName,
      phone,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to update profile');
  }

  return await res.json();
}

/**
 * Upload document
 */
export async function uploadDocument(file: File, documentType: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', documentType);

  const res = await fetch(USER_ENDPOINTS.DOCUMENTS, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to upload document');
  }

  return await res.json();
}

/**
 * Get user documents
 */
export async function getUserDocuments() {
  const res = await fetch(USER_ENDPOINTS.DOCUMENTS);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch documents');
  }

  return await res.json();
}

// Admin helpers

/**
 * Get pending approvals (admin only)
 */
export async function getPendingApprovals() {
  const res = await fetch(ADMIN_ENDPOINTS.PENDING_APPROVALS);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch pending approvals');
  }

  return await res.json();
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  const res = await fetch(ADMIN_ENDPOINTS.ALL_USERS);

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch users');
  }

  return await res.json();
}

/**
 * Approve user (admin only)
 */
export async function approveUser(userId: string) {
  const res = await fetch(ADMIN_ENDPOINTS.APPROVE_USER(userId), {
    method: 'PUT',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to approve user');
  }

  return await res.json();
}

/**
 * Reject user (admin only)
 */
export async function rejectUser(userId: string) {
  const res = await fetch(ADMIN_ENDPOINTS.REJECT_USER(userId), {
    method: 'PUT',
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to reject user');
  }

  return await res.json();
}

/**
 * Create customer (admin only)
 */
export async function createCustomer(email: string, fullName: string, phone: string) {
  const res = await fetch(ADMIN_ENDPOINTS.CUSTOMERS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      full_name: fullName,
      phone,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to create customer');
  }

  return await res.json();
}

/**
 * Delete customer (admin only)
 */
export async function deleteCustomer(userId: string) {
  const res = await fetch(ADMIN_ENDPOINTS.CUSTOMERS, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to delete customer');
  }

  return await res.json();
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const session = await getSession();
    return session && session.success;
  } catch {
    return false;
  }
}

/**
 * Get dashboard URL for role
 */
export function getDashboardUrl(role: string): string {
  return ROLE_DASHBOARDS[role] || '/';
}

/**
 * Format status for display
 */
export function formatStatus(status: string): string {
  return STATUS_LABELS[status] || status;
}

/**
 * Check if user can be approved (is seller or delivery_partner and pending)
 */
export function canBeApproved(role: string, status: string): boolean {
  return (role === ROLES.SELLER || role === ROLES.DELIVERY_PARTNER) && status === STATUS.PENDING;
}

/**
 * Check if user is in pending approval
 */
export function isPending(status: string): boolean {
  return status === STATUS.PENDING;
}

/**
 * Check if user is approved
 */
export function isApproved(status: string): boolean {
  return status === STATUS.APPROVED;
}

/**
 * Check if user is rejected
 */
export function isRejected(status: string): boolean {
  return status === STATUS.REJECTED;
}
