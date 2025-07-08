import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, role, restaurantId } = await request.json();

    // Validate required fields
    if (!email || !role || !restaurantId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create admin client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate a temporary password
    const tempPassword = `temp-${Math.random().toString(36).slice(2, 10)}`;

    // Step 1: Create actual Supabase auth user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email for staff
      user_metadata: {
        role,
        restaurant_id: restaurantId,
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 400 }
      );
    }

    // Step 2: Create user profile linked to auth account
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        role,
        restaurant_id: restaurantId,
        auth_user_id: authData.user.id, // Link to real auth account
      })
      .select()
      .single();

    if (userError) {
      console.error('Error creating user profile:', userError);
      // If profile creation fails, we should clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 400 }
      );
    }

    // Return user data with temp password for display
    return NextResponse.json({
      ...userData,
      temp_password: tempPassword,
      login_url: `${request.nextUrl.origin}/login`
    });

  } catch (error) {
    console.error('Error in staff creation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}