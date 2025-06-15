import { PrismaClient, Role, ApprovalStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Define comprehensive categories with subcategories for a job platform
const categoriesToSeed: {
  name: string;
  icon: string;
  subCategories: string[];
}[] = [
  {
    name: 'التكنولوجيا وتقنية المعلومات',
    icon: 'mdi:laptop',
    subCategories: [
      'تطوير البرمجيات',
      'تطوير الويب',
      'تطوير تطبيقات الجوال',
      'تطوير الواجهات الأمامية',
      'تطوير الواجهات الخلفية',
      'تطوير المكدس الكامل',
      'هندسة العمليات',
      'الحوسبة السحابية',
      'الأمن السيبراني',
      'علم البيانات',
      'تعلم الآلة',
      'الذكاء الاصطناعي',
      'إدارة قواعد البيانات',
      'إدارة الأنظمة',
      'هندسة الشبكات',
      'الدعم التقني',
      'ضمان الجودة',
      'الكتابة التقنية',
      'إدارة المنتجات التقنية',
      'تصميم واجهة وتجربة المستخدم',
    ],
  },
  {
    name: 'التصميم والإبداع',
    icon: 'mdi:palette',
    subCategories: [
      'التصميم الجرافيكي',
      'تصميم واجهة وتجربة المستخدم',
      'تصميم الويب',
      'تصميم المنتجات',
      'التصميم الداخلي',
      'تصميم الأزياء',
      'الرسوم المتحركة',
      'تحرير الفيديو',
      'التصوير الفوتوغرافي',
      'إنشاء المحتوى',
      'تصميم التسويق الرقمي',
      'تصميم العلامة التجارية',
      'الرسم التوضيحي',
      'التصميم ثلاثي الأبعاد',
      'الرسوم المتحركة والحركة',
    ],
  },
  {
    name: 'المبيعات والتسويق',
    icon: 'mdi:chart-line',
    subCategories: [
      'التسويق الرقمي',
      'تسويق وسائل التواصل الاجتماعي',
      'تسويق المحتوى',
      'التسويق عبر البريد الإلكتروني',
      'تحسين محركات البحث',
      'مندوب مبيعات',
      'تطوير الأعمال',
      'إدارة الحسابات',
      'مدير التسويق',
      'مدير العلامة التجارية',
      'العلاقات العامة',
      'الإعلان',
      'أبحاث السوق',
      'توليد العملاء المحتملين',
      'نجاح العملاء',
    ],
  },
  {
    name: 'المالية والمحاسبة',
    icon: 'mdi:calculator',
    subCategories: [
      'المحاسبة',
      'محلل مالي',
      'الخدمات المصرفية الاستثمارية',
      'التخطيط المالي',
      'المراجعة',
      'أخصائي ضرائب',
      'مسك الدفاتر',
      'الخزانة',
      'إدارة المخاطر',
      'المالية المؤسسية',
      'محلل الميزانية',
      'محلل الائتمان',
      'التأمين',
      'الخدمات المصرفية',
      'الاستشارات المالية',
    ],
  },
  {
    name: 'الموارد البشرية',
    icon: 'mdi:account-group',
    subCategories: [
      'التوظيف',
      'أخصائي موارد بشرية',
      'مدير الموارد البشرية',
      'استقطاب المواهب',
      'التعويضات والمزايا',
      'التدريب والتطوير',
      'علاقات الموظفين',
      'شريك أعمال الموارد البشرية',
      'التطوير التنظيمي',
      'إدارة الأداء',
      'أخصائي أنظمة الموارد البشرية',
      'أخصائي كشوف المرتبات',
    ],
  },
  {
    name: 'خدمة العملاء',
    icon: 'mdi:headset',
    subCategories: [
      'دعم العملاء',
      'الدعم التقني',
      'مركز الاتصال',
      'نجاح العملاء',
      'علاقات العملاء',
      'مكتب المساعدة',
      'تجربة العملاء',
      'دعم الحسابات',
      'دعم الدردشة المباشرة',
      'خدمة ميدانية',
    ],
  },
  {
    name: 'الرعاية الصحية والطب',
    icon: 'mdi:medical-bag',
    subCategories: [
      'التمريض',
      'طبيب',
      'الصيدلة',
      'التكنولوجيا الطبية',
      'إدارة الرعاية الصحية',
      'العلاج الطبيعي',
      'الصحة النفسية',
      'طب الأسنان',
      'البحث الطبي',
      'تقنية المعلومات الصحية',
      'المبيعات الطبية',
      'البحث السريري',
      'الأشعة',
      'المختبر',
      'خدمات الطوارئ الطبية',
    ],
  },
  {
    name: 'التعليم والتدريب',
    icon: 'mdi:school',
    subCategories: [
      'التدريس',
      'التدريب والتطوير',
      'تطوير المناهج',
      'الإدارة التعليمية',
      'التدريس الخصوصي',
      'التدريب المؤسسي',
      'التعلم الإلكتروني',
      'البحث الأكاديمي',
      'خدمات الطلاب',
      'تكنولوجيا التعليم',
      'خدمات المكتبة',
      'التعليم الخاص',
      'تعليم الكبار',
    ],
  },
  {
    name: 'الهندسة',
    icon: 'mdi:engineering',
    subCategories: [
      'هندسة البرمجيات',
      'الهندسة المدنية',
      'الهندسة الميكانيكية',
      'الهندسة الكهربائية',
      'الهندسة الكيميائية',
      'الهندسة الصناعية',
      'هندسة الطيران',
      'الهندسة البيئية',
      'الهندسة الطبية الحيوية',
      'هندسة النظم',
      'هندسة الجودة',
      'هندسة السلامة',
      'هندسة العمليات',
    ],
  },
  {
    name: 'العمليات واللوجستيات',
    icon: 'mdi:truck',
    subCategories: [
      'إدارة سلسلة التوريد',
      'منسق اللوجستيات',
      'مدير العمليات',
      'إدارة المستودعات',
      'النقل',
      'إدارة المخزون',
      'المشتريات',
      'إدارة الموردين',
      'التوزيع',
      'الشحن والاستلام',
      'محلل العمليات',
      'تحسين العمليات',
    ],
  },
  {
    name: 'القانون',
    icon: 'mdi:gavel',
    subCategories: [
      'القانون المؤسسي',
      'قانون العقود',
      'قانون العمل',
      'الملكية الفكرية',
      'التقاضي',
      'مساعد قانوني',
      'مساعد محامي',
      'الامتثال',
      'الشؤون التنظيمية',
      'البحث القانوني',
      'قانون الهجرة',
      'قانون العقارات',
    ],
  },
  {
    name: 'الإعلام والاتصالات',
    icon: 'mdi:microphone',
    subCategories: [
      'الصحافة',
      'العلاقات العامة',
      'الاتصالات',
      'البث',
      'الكتابة والتحرير',
      'إدارة وسائل التواصل الاجتماعي',
      'تخطيط الفعاليات',
      'اتصالات التسويق',
      'الاتصالات المؤسسية',
      'استراتيجية المحتوى',
      'إنتاج الوسائط',
      'البودكاست',
    ],
  },
  {
    name: 'البناء والحرف',
    icon: 'mdi:hard-hat',
    subCategories: [
      'إدارة البناء',
      'الهندسة المعمارية',
      'الأعمال الكهربائية',
      'السباكة',
      'التدفئة والتهوية وتكييف الهواء',
      'النجارة',
      'أعمال البناء',
      'إدارة المشاريع',
      'إشراف الموقع',
      'منسق السلامة',
      'هندسة البناء',
      'صيانة المباني',
    ],
  },
  {
    name: 'التجارة والمبيعات',
    icon: 'mdi:store',
    subCategories: [
      'مبيعات التجزئة',
      'إدارة المتاجر',
      'التسويق البصري',
      'أمين الصندوق',
      'إدارة المخزون',
      'التسويق البصري',
      'خدمة العملاء',
      'التجارة الإلكترونية',
      'مشتري التجزئة',
      'عمليات المتجر',
      'منع الخسائر',
    ],
  },
  {
    name: 'النقل',
    icon: 'mdi:car',
    subCategories: [
      'القيادة',
      'التوصيل',
      'اللوجستيات',
      'إدارة الأسطول',
      'تخطيط النقل',
      'عمليات المستودعات',
      'تنسيق الشحن',
      'تخطيط المسارات',
      'صيانة المركبات',
      'إدارة المرور',
    ],
  },
  {
    name: 'الضيافة والسياحة',
    icon: 'mdi:bed',
    subCategories: [
      'إدارة الفنادق',
      'خدمة المطاعم',
      'تخطيط الفعاليات',
      'تخطيط السفر',
      'دليل سياحي',
      'إدارة الضيافة',
      'الطعام والشراب',
      'استقبال',
      'التدبير المنزلي',
      'خدمات البواب',
      'تقديم الطعام',
    ],
  },
  {
    name: 'المنظمات غير الربحية والخدمات الاجتماعية',
    icon: 'mdi:heart',
    subCategories: [
      'العمل الاجتماعي',
      'التواصل المجتمعي',
      'إدارة المنظمات غير الربحية',
      'جمع التبرعات',
      'تنسيق البرامج',
      'كتابة المنح',
      'تنسيق المتطوعين',
      'الدعوة',
      'إدارة الحالات',
      'خدمات الشباب',
      'رعاية المسنين',
    ],
  },
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

  // 1. Seed Categories and SubCategories
  console.log(`Seeding categories and subcategories...`);
  for (const categoryData of categoriesToSeed) {
    // Create or update category
    const category = await prisma.category.upsert({
      where: { name: categoryData.name },
      update: { icon: categoryData.icon },
      create: { name: categoryData.name, icon: categoryData.icon },
    });
    console.log(
      `Created or updated category: ${category.name} (ID: ${category.id}) with icon: ${category.icon}`,
    );

    // Create subcategories for this category
    for (const subCategoryName of categoryData.subCategories) {
      const subCategory = await prisma.subCategory.upsert({
        where: {
          name_categoryId: {
            name: subCategoryName,
            categoryId: category.id,
          },
        },
        update: {},
        create: {
          name: subCategoryName,
          categoryId: category.id,
        },
      });
      console.log(
        `  Created or updated subcategory: ${subCategory.name} (ID: ${subCategory.id}) for category: ${category.name}`,
      );
    }
  }
  console.log(`Categories and subcategories seeded.`);

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
      approvalStatus: ApprovalStatus.APPROVED, // Admin company is pre-approved
    },
    create: {
      userId: adminUser.id,
      name: companyName,
      approvalStatus: ApprovalStatus.APPROVED, // Admin company is pre-approved
      approvedAt: new Date(),
      approvedBy: adminUser.id,
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
