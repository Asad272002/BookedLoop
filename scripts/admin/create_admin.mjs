import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

const username = process.env.BL_BOOTSTRAP_USERNAME || 'Asad';
const fullName = process.env.BL_BOOTSTRAP_FULL_NAME || 'Asad';
const email = process.env.BL_BOOTSTRAP_EMAIL || `${username.toLowerCase()}@bookedloop.internal`;
const password = process.env.BL_BOOTSTRAP_PASSWORD;
const role = process.env.BL_BOOTSTRAP_ROLE || 'admin';

if (!password) {
  console.error('Set BL_BOOTSTRAP_PASSWORD in environment');
  process.exit(1);
}

async function findAuthUserIdByEmail(targetEmail) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return { authUserId: null, error };
    const found = data?.users?.find((u) => (u.email || '').toLowerCase() === targetEmail.toLowerCase());
    if (found?.id) return { authUserId: found.id, error: null };
    if (!data?.users?.length) break;
  }
  return { authUserId: null, error: null };
}

let authUserId = null;
const { data: created, error: createErr } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { username, full_name: fullName },
  app_metadata: { role },
});

if (createErr || !created?.user) {
  const { authUserId: existingId, error: lookupErr } = await findAuthUserIdByEmail(email);
  if (lookupErr) {
    console.error('Failed to create user, and failed to look up existing user', { createErr, lookupErr });
    process.exit(1);
  }
  if (!existingId) {
    console.error('Failed to create user', createErr);
    process.exit(1);
  }

  authUserId = existingId;
  const { error: updateErr } = await supabase.auth.admin.updateUserById(authUserId, {
    password,
    user_metadata: { username, full_name: fullName },
    app_metadata: { role },
  });
  if (updateErr) {
    console.error('User exists but failed to update password/metadata', updateErr);
    process.exit(1);
  }
} else {
  authUserId = created.user.id;
}

await supabase
  .from('users')
  .upsert(
    {
      auth_user_id: authUserId,
      username,
      full_name: fullName,
      email,
      role,
      is_active: true,
    },
    { onConflict: 'auth_user_id' }
  );

console.log('Admin created:', { authUserId, username, email, role });
