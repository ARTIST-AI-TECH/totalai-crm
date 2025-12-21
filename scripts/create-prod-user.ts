import { db } from '../lib/db/drizzle';
import { users, teams, teamMembers } from '../lib/db/schema';
import { hashPassword } from '../lib/auth/session';

async function createProductionUser() {
  const email = 'selva@totalai.com.au';
  const password = '@Totalai123';

  console.log('🔐 Creating production user...');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('\n⚠️  SAVE THESE CREDENTIALS - Share with client!\n');

  // Check if user exists
  const existing = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.email, email),
  });

  if (existing) {
    console.log('✅ User already exists:', existing.email);
    return;
  }

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword(password),
      name: 'FlowControl Admin',
      role: 'owner',
    })
    .returning();

  console.log('✅ User created:', user.email);

  // Find or create team
  let team = await db.query.teams.findFirst({
    where: (teams, { eq }) => eq(teams.name, 'Platinum Plumbing & Gas Solutions'),
  });

  if (!team) {
    [team] = await db
      .insert(teams)
      .values({
        name: 'Platinum Plumbing & Gas Solutions',
      })
      .returning();
    console.log('✅ Team created:', team.name);
  }

  // Add user to team
  await db.insert(teamMembers).values({
    userId: user.id,
    teamId: team.id,
    role: 'owner',
  });

  console.log('✅ User added to team');
  console.log('\n📋 PRODUCTION CREDENTIALS:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('\n🎯 Ready for Netlify deployment!');

  process.exit(0);
}

createProductionUser().catch(console.error);
