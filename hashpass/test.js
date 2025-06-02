import bcrypt from 'bcryptjs';

const password = '123321yaman';

bcrypt.hash(password, 10).then(hash => {
  console.log('🔐 Hashed:', hash);
});