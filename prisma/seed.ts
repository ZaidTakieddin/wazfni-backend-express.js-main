import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Define the categories you want to seed with icons
const categoriesToSeed: { name: string; icon: string }[] = [
  { name: 'تطوير البرمجيات', icon: 'mdi:code-braces' },
  { name: 'تطوير الويب', icon: 'mdi:web' },
  { name: 'تطوير تطبيقات الجوال', icon: 'mdi:cellphone' },
  { name: 'علم البيانات', icon: 'mdi:database-search' },
  { name: 'تعلم الآلة', icon: 'mdi:brain' },
  { name: 'عمليات التطوير', icon: 'mdi:server-network' },
  { name: 'الحوسبة السحابية', icon: 'mdi:cloud' },
  { name: 'الأمن السيبراني', icon: 'mdi:shield-lock' },
  { name: 'تصميم واجهة وتجربة المستخدم', icon: 'mdi:palette' },
  { name: 'إدارة المنتجات', icon: 'mdi:package-variant' },
  { name: 'إدارة المشاريع', icon: 'mdi:clipboard-list-outline' },
  { name: 'التسويق', icon: 'mdi:bullhorn-outline' },
  { name: 'المبيعات', icon: 'mdi:point-of-sale' },
  { name: 'دعم العملاء', icon: 'mdi:face-agent' },
  { name: 'الموارد البشرية', icon: 'mdi:account-group-outline' },
  { name: 'المالية', icon: 'mdi:finance' },
  { name: 'المحاسبة', icon: 'mdi:calculator-variant' },
  { name: 'الشؤون القانونية', icon: 'mdi:gavel' },
  { name: 'الإدارة', icon: 'mdi:folder-cog-outline' },
  { name: 'العمليات', icon: 'mdi:cog-outline' },
];

// Define admin user details
const adminEmail = 'admin@wazfni.com';
const adminPassword = 'password'; // Use a strong password in production!
const adminFirstName = 'Admin';
const adminLastName = 'Admin';
const adminPhoneNumber = '';
const companyName = 'Wazfni';

async function main() {
  console.log(`Start seeding ...`);

  // 1. Seed Categories
  console.log(`Seeding categories...`);
  for (const categoryData of categoriesToSeed) {
    const category = await prisma.category.upsert({
      where: { name: categoryData.name },
      update: { icon: categoryData.icon },
      create: { name: categoryData.name, icon: categoryData.icon },
    });
    console.log(
      `Created or updated category: ${category.name} (ID: ${category.id}) with icon: ${category.icon}`,
    );
  }
  console.log(`Categories seeded.`);

  // 2. Seed Admin User
  console.log(`Seeding admin user...`);
  const saltRounds = 10; // Or use a value from your config
  const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: Role.ADMIN,
      firstName: adminFirstName,
      lastName: adminLastName,
      phoneNumber: adminPhoneNumber,
    },
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      role: Role.ADMIN,
      firstName: adminFirstName,
      lastName: adminLastName,
      phoneNumber: adminPhoneNumber,
      isVerified: true,
    },
  });
  console.log(`Created or found admin user with id: ${adminUser.id}`);

  const adminProfile = await prisma.userProfile.upsert({
    where: { userId: adminUser.id },
    update: {
      firstName: adminFirstName,
      lastName: adminLastName,
      phone: adminPhoneNumber,
    },
    create: {
      userId: adminUser.id,
      firstName: adminFirstName,
      lastName: adminLastName,
      phone: adminPhoneNumber,
    },
  });
  console.log(`Created or found admin profile with id: ${adminProfile.id}`);

  // 3. Seed Company for Admin User
  console.log(`Seeding company for admin user...`);
  const company = await prisma.company.upsert({
    where: { userId: adminUser.id },
    update: {
      name: companyName,
    },
    create: {
      userId: adminUser.id,
      name: companyName,
    },
  });
  console.log(
    `Created or found company with id: ${company.id} for user ${adminUser.id}`,
  );

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
