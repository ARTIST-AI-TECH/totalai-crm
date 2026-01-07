import { hashPassword } from '../lib/auth/session';

async function main() {
  const hash = await hashPassword('admin123');
  console.log('Password hash for admin123:');
  console.log(hash);
}

main();
