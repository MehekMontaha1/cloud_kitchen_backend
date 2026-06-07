import { supabaseAdmin, getUserProfile, getUserDocuments } from './supabase';
import type { UserProfile, PendingApproval } from '@/app/types';

// Get all pending sellers and delivery partners
export async function getPendingApprovals() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('status', 'pending')
      .in('role', ['seller', 'delivery_partner']);

    if (error) throw error;

    // Fetch documents for each pending user
    const approvalsWithDocs = await Promise.all(
      (data || []).map(async (profile) => {
        const documents = await getUserDocuments(profile.id);
        return {
          ...profile,
          documents,
        };
      })
    );

    return approvalsWithDocs;
  } catch (error) {
    console.error('[v0] Error fetching pending approvals:', error);
    throw error;
  }
}

// Approve a user (seller or delivery_partner)
export async function approveUser(userId: string) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) throw new Error('User not found');

    if (!['seller', 'delivery_partner'].includes(profile.role)) {
      throw new Error('Only sellers and delivery partners can be approved');
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[v0] Error approving user:', error);
    throw error;
  }
}

// Reject a user (seller or delivery_partner)
export async function rejectUser(userId: string) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) throw new Error('User not found');

    if (!['seller', 'delivery_partner'].includes(profile.role)) {
      throw new Error('Only sellers and delivery partners can be rejected');
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[v0] Error rejecting user:', error);
    throw error;
  }
}

// Get all users (for admin dashboard)
export async function getAllUsers() {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[v0] Error fetching all users:', error);
    throw error;
  }
}

// Create a customer manually (admin only)
export async function createCustomerManually(email: string, fullName: string, phone: string) {
  try {
    // Create auth user with temporary password
    const tempPassword = `Temp_${Math.random().toString(36).substring(7)}`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create auth user');

    // Create customer profile (auto-approved)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        phone,
        role: 'customer',
        status: 'approved',
      })
      .select()
      .single();

    if (profileError) {
      // Rollback - delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return {
      user: authData.user,
      profile: profileData,
      tempPassword,
    };
  } catch (error) {
    console.error('[v0] Error creating customer manually:', error);
    throw error;
  }
}

// Delete a customer (admin only)
export async function deleteCustomer(userId: string) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) throw new Error('User not found');

    if (profile.role !== 'customer') {
      throw new Error('Only customers can be deleted by admin');
    }

    // Delete profile (which cascades to auth.users)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return { success: true };
  } catch (error) {
    console.error('[v0] Error deleting customer:', error);
    throw error;
  }
}

// Get user with role and status check
export async function getUserForAdmin(userId: string) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) throw new Error('User not found');

    const documents = await getUserDocuments(userId);

    return {
      ...profile,
      documents,
    };
  } catch (error) {
    console.error('[v0] Error fetching user for admin:', error);
    throw error;
  }
}
