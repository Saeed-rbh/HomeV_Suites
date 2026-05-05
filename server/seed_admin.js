require('dotenv').config();
const prisma = require('./db');

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@homevsuites.com' },
    update: { role: 'ADMIN', isHost: true },
    create: {
      email: 'admin@homevsuites.com',
      phone: '+11111111111',
      password: 'legacy_not_used',
      role: 'ADMIN',
      displayName: 'HomEV Admin',
      isHost: true
    }
  });

  console.log('✅ Admin user ready:', admin.email, '| role:', admin.role, '| id:', admin.id);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
