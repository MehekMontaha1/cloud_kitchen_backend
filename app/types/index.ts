// User roles
export type UserRole = 'customer' | 'seller' | 'delivery_partner' | 'super_admin';

// Approval status for sellers and delivery partners
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// User profile
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  status: ApprovalStatus;
  created_at: string;
  updated_at: string;
}

// User document
export interface UserDocument {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  uploaded_at: string;
}

// Auth response
export interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  profile: UserProfile;
  token: string;
}

// Registration payload
export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  phone: string;
  role: Exclude<UserRole, 'super_admin'>; // Cannot register as super_admin
}

// Login payload
export interface LoginPayload {
  email: string;
  password: string;
}

// API error response
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Pending approval for admin view
export interface PendingApproval {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: 'seller' | 'delivery_partner';
  status: 'pending';
  created_at: string;
  documents: UserDocument[];
}
