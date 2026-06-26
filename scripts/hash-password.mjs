// Generate a bcrypt hash for APP_USER_PASSWORD_HASH.
// Usage: npm run hash -- "yourPassword"
import bcrypt from "bcryptjs";

const pwd = process.argv[2];
if (!pwd) {
  console.error('Usage: npm run hash -- "yourPassword"');
  process.exit(1);
}
const hash = bcrypt.hashSync(pwd, 10);
console.log("\nAdd this to your .env.local:\n");
console.log(`APP_USER_PASSWORD_HASH="${hash}"\n`);
