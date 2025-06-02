import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

const isHashed = (password) => {
  return password.startsWith('$2a$') || password.startsWith('$2b$');
};

const encryptAll = async () => {
  const { data: admins, error } = await supabase.from('admins').select('id, password');

  if (error) {
    console.error('❌ Failed to fetch admins:', error);
    return;
  }

  for (const admin of admins) {
    if (!admin.password || isHashed(admin.password)) {
      console.log(`✅ Already hashed or empty for admin ${admin.id}`);
      continue;
    }

    const hashed = await bcrypt.hash(admin.password, 10);
    const { error: updateError } = await supabase
      .from('admins')
      .update({ password: hashed })
      .eq('id', admin.id);

    if (updateError) {
      console.error(`❌ Failed to update admin ${admin.id}:`, updateError);
    } else {
      console.log(`🔐 Hashed password for admin ${admin.id}`);
    }
  }
};

encryptAll();
