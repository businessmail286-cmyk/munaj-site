/**
 * Centralized customer-friendly error formatter for the MUNAJ Customer Website.
 * Ensures developer/backend/database details are logged internally to the console,
 * but never exposed to customers in UI toasts, alerts, banners, or modals.
 */

export function formatCustomerError(
  err: any,
  fallbackMessage: string = 'Something went wrong. Please try again.'
): string {
  if (!err) return fallbackMessage;

  // 1. Log full technical details to the browser console for developer debugging
  console.error('[MUNAJ System Log] Error details:', err);

  const rawMessage = typeof err === 'string' 
    ? err 
    : err?.message || err?.error_description || err?.error || '';
  
  const rawCode = err?.code || '';
  const combined = `${rawMessage} ${rawCode}`.toLowerCase();

  // 2. Authentication specific mappings
  if (
    combined.includes('invalid login credentials') ||
    combined.includes('invalid_credentials') ||
    combined.includes('invalid username or password')
  ) {
    return 'Invalid email or password. Please check your details and try again.';
  }

  if (
    combined.includes('user already registered') ||
    combined.includes('user_already_exists') ||
    combined.includes('already exists')
  ) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  if (combined.includes('password should be at least') || combined.includes('weak_password')) {
    return 'Password must be at least 6 characters long.';
  }

  if (combined.includes('email rate limit') || combined.includes('over_email_send_rate_limit') || combined.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment and try again.';
  }

  if (combined.includes('auth_required') || combined.includes('authentication required') || combined.includes('user session not found')) {
    return 'Please sign in or create an account to continue.';
  }

  if (combined.includes('suspended') || combined.includes('banned')) {
    return 'Your account has been suspended. Please contact Customer Support if you believe this was a mistake.';
  }

  if (combined.includes('restricted')) {
    return 'Your account currently has restricted access. Please contact Customer Support for assistance.';
  }

  // 3. Network & Connection mappings
  if (
    combined.includes('failed to fetch') ||
    combined.includes('networkerror') ||
    combined.includes('network error') ||
    combined.includes('timeout') ||
    combined.includes('econnrefused')
  ) {
    return 'Something went wrong. Please check your connection and try again.';
  }

  // 4. Scrub backend / database / SQL / RLS / technical jargon
  const technicalKeywords = [
    'supabase',
    'postgres',
    'postgrest',
    'database',
    'rls',
    'row level security',
    'row-level security',
    'jwt',
    'bearer',
    'auth.uid()',
    'uuid',
    'relation',
    'column',
    'table',
    'syntax error',
    'pgrst',
    'violates',
    'foreign key',
    'duplicate key',
    'null value',
    'sql',
    'select ',
    'insert into',
    'update ',
    'delete from',
  ];

  const hasTechnicalKeyword = technicalKeywords.some((keyword) => combined.includes(keyword));

  if (hasTechnicalKeyword) {
    return fallbackMessage;
  }

  // If the message is already clean, short and customer-friendly (e.g. "Please write a message with at least 5 characters")
  if (rawMessage.length > 0 && rawMessage.length < 120 && !hasTechnicalKeyword) {
    return rawMessage;
  }

  return fallbackMessage;
}
