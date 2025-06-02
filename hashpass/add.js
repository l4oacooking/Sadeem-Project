import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rrmrownqurlhnngqeoqm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJybXJvd25xdXJsaG5uZ3Flb3FtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzU0OTEwNSwiZXhwIjoyMDU5MTI1MTA1fQ.AxNKWAf3K2ob5z6W_adiHJqijYe2q0wTg8btyYfr7GA' // ضروري يكون الـ service role
);

async function migrateOldAdmin() {
  const email = 'cuzy@gmail.com';        // الإيميل الموجود مسبقًا في جدول admins
  const password = '123321yaman';  // اختر باسورد جديد للمستخدم

  const store_id = '1934724512'; // حسب جدولك
  const role = 'Admin';             // أو owner

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { store_id, role }
  });

  if (error) {
    console.error('❌ Failed to create auth user:', error.message);
  } else {
    console.log('✅ Auth user created:', data.user.id);
  }
}

migrateOldAdmin();
