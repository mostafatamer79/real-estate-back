export const DEFAULT_INFO_TABS = [
  { key: 'terms', titleAr: 'الشروط والأحكام', titleEn: 'Terms & Conditions', sortOrder: 10 },
  { key: 'usage', titleAr: 'سياسة الاستخدام', titleEn: 'Usage Policy', sortOrder: 20 },
  { key: 'permits', titleAr: 'التراخيص والتصاريح', titleEn: 'Permits & Licenses', sortOrder: 30 },
  { key: 'contact', titleAr: 'اتصل بنا', titleEn: 'Contact Us', sortOrder: 40 },
];

export const DEFAULT_INFO_BLOCKS: Array<{
  tabKey: string;
  labelAr: string;
  labelEn: string;
  textAr: string;
  textEn: string;
  sortOrder: number;
}> = [
  // Terms
  {
    tabKey: 'terms',
    labelAr: 'قبول الشروط',
    labelEn: 'Acceptance',
    textAr: 'باستخدامك للمنصة، فإنك توافق على الالتزام بكافة الشروط والأحكام المذكورة.',
    textEn: 'By using the platform, you agree to comply with all stated terms and conditions.',
    sortOrder: 10,
  },
  {
    tabKey: 'terms',
    labelAr: 'الملكية الفكرية',
    labelEn: 'Intellectual Property',
    textAr: 'جميع المحتويات والعلامات التجارية والبيانات الموجودة على المنصة مملوكة لنا أو مرخصة للاستخدام.',
    textEn: 'All content, trademarks, and data on the platform are owned by us or licensed for use.',
    sortOrder: 20,
  },
  {
    tabKey: 'terms',
    labelAr: 'التزامات المستخدم',
    labelEn: 'User Obligations',
    textAr: 'يجب على المستخدم تقديم معلومات دقيقة وصحيحة عند التسجيل أو إضافة العقارات.',
    textEn: 'Users must provide accurate and correct information when registering or listing properties.',
    sortOrder: 30,
  },

  // Usage
  {
    tabKey: 'usage',
    labelAr: 'الغرض من الاستخدام',
    labelEn: 'Purpose',
    textAr: 'تم تصميم المنصة لتسهيل تداول العقارات والخدمات المرتبطة بها بشكل قانوني.',
    textEn: 'The platform is designed to facilitate lawful real estate transactions and related services.',
    sortOrder: 10,
  },
  {
    tabKey: 'usage',
    labelAr: 'السلوك الممنوع',
    labelEn: 'Prohibited Conduct',
    textAr: 'يُمنع استخدام المنصة لأي أغراض غير قانونية أو نشر محتوى مضلل.',
    textEn: 'Using the platform for illegal purposes or publishing misleading content is prohibited.',
    sortOrder: 20,
  },
  {
    tabKey: 'usage',
    labelAr: 'خصوصية البيانات',
    labelEn: 'Data Privacy',
    textAr: 'نحن ملتزمون بحماية بياناتك واستخدامها فقط للأغراض الموضحة في سياسات الخصوصية.',
    textEn: 'We are committed to protecting your data and using it only as described in our privacy policies.',
    sortOrder: 30,
  },

  // Permits
  {
    tabKey: 'permits',
    labelAr: 'ترخيص المنصة',
    labelEn: 'Platform Licensing',
    textAr: 'المنصة حاصلة على التراخيص اللازمة من الجهات المختصة.',
    textEn: 'The platform holds the required licenses from the relevant authorities.',
    sortOrder: 10,
  },
  {
    tabKey: 'permits',
    labelAr: 'تراخيص الوسطاء',
    labelEn: 'Broker Licensing',
    textAr: 'يتم التحقق من رخص الوسطاء والمكاتب العقارية المسوقة عبر المنصة.',
    textEn: 'We verify the licensing of brokers and real estate offices marketed through the platform.',
    sortOrder: 20,
  },
  {
    tabKey: 'permits',
    labelAr: 'الامتثال للأنظمة',
    labelEn: 'Compliance',
    textAr: 'نحن نتبع كافة الأنظمة واللوائح العقارية المعمول بها في المملكة العربية السعودية.',
    textEn: 'We follow applicable real estate regulations in the Kingdom of Saudi Arabia.',
    sortOrder: 30,
  },

  // Contact
  {
    tabKey: 'contact',
    labelAr: 'الدعم الفني',
    labelEn: 'Support',
    textAr: 'فريق الدعم الفني متواجد لمساعدتك على مدار الساعة.',
    textEn: 'Our support team is available to assist you around the clock.',
    sortOrder: 10,
  },
  {
    tabKey: 'contact',
    labelAr: 'الهاتف',
    labelEn: 'Phone',
    textAr: '92000XXXX',
    textEn: '92000XXXX',
    sortOrder: 20,
  },
  {
    tabKey: 'contact',
    labelAr: 'البريد الإلكتروني',
    labelEn: 'Email',
    textAr: 'info@dealapp.sa',
    textEn: 'info@dealapp.sa',
    sortOrder: 30,
  },
  {
    tabKey: 'contact',
    labelAr: 'خدمة العملاء',
    labelEn: 'Customer Service',
    textAr: 'تواصل معنا مباشرة عبر قسم خدمة العملاء لتقديم الشكاوى أو الاقتراحات.',
    textEn: 'Contact us through Customer Service to submit complaints or suggestions.',
    sortOrder: 40,
  },
];

