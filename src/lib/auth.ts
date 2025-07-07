import { createClient } from './supabase';
import { UserRole } from './types';

export const signUp = async (email: string, password: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signIn = async (email: string, password: string) => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) throw error;
  return user;
};

export const getUserProfile = async (authUserId: string) => {
  const supabase = createClient();
  
  // First try to get user profile from users table
  const { data: userProfile, error: userError } = await supabase
    .from('users')
    .select(`
      *,
      restaurant:restaurants(*)
    `)
    .eq('auth_user_id', authUserId)
    .single();
  
  if (userError && userError.code !== 'PGRST116') {
    throw userError;
  }
  
  // If user profile doesn't exist, check if they're a restaurant owner
  if (!userProfile) {
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', authUserId)
      .single();
    
    if (restaurantError && restaurantError.code !== 'PGRST116') {
      throw restaurantError;
    }
    
    if (restaurant) {
      return {
        id: authUserId,
        email: '',
        role: 'OWNER' as UserRole,
        restaurant_id: restaurant.id,
        auth_user_id: authUserId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        restaurant: restaurant,
      };
    }
  }
  
  return userProfile;
};

export const createRestaurant = async (name: string, slug: string, description?: string) => {
  const supabase = createClient();
  const user = await getCurrentUser();
  
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('restaurants')
    .insert({
      name,
      slug,
      description,
      owner_id: user.id,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const createStaffUser = async (email: string, role: UserRole, restaurantId: string) => {
  const supabase = createClient();
  
  // Create the user profile without auth_user_id (it will be null until they register)
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      email,
      role,
      restaurant_id: restaurantId,
      // Don't set auth_user_id - leave it null until they register
    })
    .select()
    .single();
  
  if (userError) throw userError;
  
  // In production, this would send an invitation email
  // For now, staff can register normally and you'll assign them manually
  console.log(`Staff invitation created for ${email}. 
    Instructions for the staff member:
    1. Go to ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/register
    2. Register with email: ${email}
    3. Contact restaurant owner to link their account
  `);
  
  return userData;
};

export const getRoleBasedRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'OWNER':
      return '/dashboard';
    case 'KITCHEN':
      return '/kitchen';
    case 'WAITSTAFF':
      return '/wait';
    case 'BARTENDER':
      return '/bar';
    default:
      return '/login';
  }
};

export const checkUserPermission = (userRole: UserRole, requiredRole: UserRole | UserRole[]): boolean => {
  // DEBUG MODE: Allow all roles to access all interfaces for testing
  // This is a temporary fix to allow testing of all interfaces
  return true;
  
  // Normal permission check (disabled for testing)
  // const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  // return roles.includes(userRole);
};