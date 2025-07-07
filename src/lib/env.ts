export const validateEnvironmentVariables = () => {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    );
  }

  // Validate URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL should start with https://');
  }

  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    jwtSecret: process.env.JWT_SECRET || 'restaurant-saas-secret-key-change-in-production',
  };
};

export const getEnvironmentConfig = () => {
  try {
    return validateEnvironmentVariables();
  } catch (error) {
    console.error('Environment validation failed:', error);
    throw error;
  }
};