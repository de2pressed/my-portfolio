/**
 * Environment variable validation
 * This ensures required environment variables are set at build time
 */

const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
} as const;

const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}. ` +
    'Please set them in your environment or .env.local file.'
  );
}

// Validate ADMIN_SESSION_SECRET is sufficiently long
if (process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length < 32) {
  console.warn(
    'ADMIN_SESSION_SECRET should be at least 32 characters long for security. ' +
    'Current length: ' + process.env.ADMIN_SESSION_SECRET.length
  );
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET!,
  demoAdminEmail: process.env.DEMO_ADMIN_EMAIL,
  demoAdminPassword: process.env.DEMO_ADMIN_PASSWORD,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  vercelUrl: process.env.VERCEL_URL,
} as const;
