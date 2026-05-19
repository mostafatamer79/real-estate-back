export const DEFAULT_CUSTOMER_SERVICE_FAQ_CATEGORIES = [
  { key: 'general',    nameAr: 'أسئلة عامة',          nameEn: 'General Questions',  sortOrder: 10 },
  { key: 'search',     nameAr: 'أسئلة البحث والعرض',  nameEn: 'Search & Listings',  sortOrder: 20 },
  { key: 'buying',     nameAr: 'أسئلة الشراء',        nameEn: 'Buying',             sortOrder: 30 },
  { key: 'renting',    nameAr: 'أسئلة الإيجار',       nameEn: 'Renting',            sortOrder: 40 },
  { key: 'selling',    nameAr: 'أسئلة البيع',         nameEn: 'Selling',            sortOrder: 50 },
  { key: 'payments',   nameAr: 'أسئلة الدفع',         nameEn: 'Payments',           sortOrder: 60 },
  { key: 'support',    nameAr: 'أسئلة الدعم',         nameEn: 'Support',            sortOrder: 70 },
];

export const DEFAULT_CUSTOMER_SERVICE_FAQS = [
  {
    categoryKey: 'general',
    questionAr: 'ماهي الخدمات اللي يقدمها الموقع؟',
    answerAr:
      'يقدم الموقع خدمات عقارية شاملة تشمل العرض والطلب والتسويق للعقارات، وإتمام عمليات البيع والشراء والإيجار، بالإضافة إلى خدمات الدعم القانوني وخدمات أخرى بعد إتمام الصفقة.',
    questionEn: 'What services does the platform offer?',
    answerEn:
      'We provide end-to-end real estate services including listings and discovery, marketing, buying/selling, renting, as well as legal support and additional post-deal services.',
    sortOrder: 10,
  },
  {
    categoryKey: 'general',
    questionAr: 'هل الموقع وسيط ولا منصة عرض فقط؟',
    answerAr:
      'الموقع منصة تقنية متكاملة تتيح العرض والطلب وتقديم الخدمات، ويعمل أيضاً كوسيط منظم بين الأطراف لضمان حقوق الجميع وتنفيذ العملية بشكل صحيح.',
    questionEn: 'Is the platform only for listings, or also a broker?',
    answerEn:
      'The platform supports listings and services, and can also act as an organized broker between parties to help ensure a correct and safe transaction.',
    sortOrder: 20,
  },
  {
    categoryKey: 'general',
    questionAr: 'هل أقدر أتعامل بدون وسيط؟',
    answerAr: 'يمكن للمستخدمين التفاعل والتواصل مباشرة بين البائع والمشتري عبر أدوات المنصة.',
    questionEn: 'Can I deal directly without a broker?',
    answerEn: 'Yes. Users can communicate directly between buyer and seller using the platform tools.',
    sortOrder: 30,
  },
  {
    categoryKey: 'general',
    questionAr: 'هل الموقع معتمد وموثوق؟',
    answerAr:
      'نعم، الموقع ملتزم بالأنظمة واللوائح المعمول بها في المملكة العربية السعودية، بما في ذلك متطلبات الجهات التنظيمية ذات العلاقة.',
    questionEn: 'Is the platform trusted and compliant?',
    answerEn:
      'Yes. We are committed to applicable regulations and compliance requirements in Saudi Arabia.',
    sortOrder: 40,
  },

  // Search & listings
  {
    categoryKey: 'search',
    questionAr: 'كيف أبحث عن عقار مناسب لي؟',
    answerAr:
      'استخدم البحث المتقدم والفلاتر حسب الموقع ونوع العقار والمواصفات، ويمكنك أيضاً استعراض العروض السابقة والمقارنة بينها.',
    questionEn: 'How do I search for a suitable property?',
    answerEn:
      'Use the advanced search and filters (location, property type, specifications), and browse previous listings to compare options.',
    sortOrder: 10,
  },
  {
    categoryKey: 'search',
    questionAr: 'هل أقدر أحدد السعر / الحي / نوع العقار؟',
    answerAr:
      'نعم. الفلاتر تتيح تحديد السعر والحي ونوع العقار بدقة بالإضافة إلى عوامل أخرى.',
    questionEn: 'Can I filter by price / district / property type?',
    answerEn:
      'Yes. Filters allow precise selection of price range, district, property type, and more.',
    sortOrder: 20,
  },
  {
    categoryKey: 'search',
    questionAr: 'هل الصور حقيقية ومحدثة؟',
    answerAr: 'نلزم المعلنين بتقديم صور ومقاطع حديثة قدر الإمكان لضمان المصداقية.',
    questionEn: 'Are the photos real and up to date?',
    answerEn: 'We require advertisers to provide recent and realistic photos/videos to maintain credibility.',
    sortOrder: 30,
  },

  // Buying
  {
    categoryKey: 'buying',
    questionAr: 'كيف تتم عملية الشراء؟',
    answerAr:
      'تتم العملية عبر خطوات واضحة: تقديم طلب شراء، إصدار فاتورة ورسوم الخدمات، تجهيز المستندات اللازمة، ثم استكمال إجراءات نقل الملكية عبر القنوات الرسمية.',
    questionEn: 'How does the buying process work?',
    answerEn:
      'The process follows clear steps: submit a purchase request, review fees/invoice, prepare required documents, then complete ownership transfer through official channels.',
    sortOrder: 10,
  },
  {
    categoryKey: 'buying',
    questionAr: 'هل الموقع يتأكد من سلامة الصك؟',
    answerAr:
      'نعم، من خلال الخدمات القانونية يمكن إجراء فحص للوثائق (مثل الصك ورخص البناء) قبل المضي في الإجراءات الرسمية لتقليل المخاطر.',
    questionEn: 'Do you verify the deed/documents?',
    answerEn:
      'Yes. Through our legal services we can review key documents (deed, permits, etc.) before proceeding to reduce risk.',
    sortOrder: 20,
  },
  {
    categoryKey: 'buying',
    questionAr: 'هل فيه رسوم أو عمولة؟',
    answerAr:
      'قد يتم تطبيق عمولة ورسوم خدمات حسب نوع الطلب، ويتم توضيحها قبل البدء في الإجراءات.',
    questionEn: 'Are there fees or commission?',
    answerEn:
      'Fees/commission may apply depending on the request type and will be shown clearly before you proceed.',
    sortOrder: 30,
  },
  {
    categoryKey: 'buying',
    questionAr: 'كم تستغرق عملية نقل الملكية؟',
    answerAr:
      'تختلف المدة حسب اكتمال المستندات والمتطلبات، وغالباً من يوم إلى عدة أيام عمل بعد إتمام جميع الإجراءات.',
    questionEn: 'How long does ownership transfer take?',
    answerEn:
      'It depends on document readiness and requirements, typically from one day to a few business days after all steps are completed.',
    sortOrder: 40,
  },
  {
    categoryKey: 'buying',
    questionAr: 'هل أقدر أشتري إلكترونيًا بالكامل؟',
    answerAr:
      'يمكن تنفيذ أجزاء كبيرة إلكترونياً (بحث، تواصل، عقود أولية)، أما الإفراغ النهائي فيتم عبر القنوات الحكومية المعتمدة.',
    questionEn: 'Can I complete the purchase fully online?',
    answerEn:
      'Many steps can be done online (search, communication, preliminary agreements), while the final transfer is completed via official government channels.',
    sortOrder: 50,
  },

  // Renting
  {
    categoryKey: 'renting',
    questionAr: 'كيف أستأجر عن طريق الموقع؟',
    answerAr:
      'تصفح العروض وتواصل مع الطرف الآخر ثم اتفق على الشروط. بعد ذلك يمكن إرشادك لإصدار عقد إيجار موحد عبر شبكة إيجار.',
    questionEn: 'How do I rent through the platform?',
    answerEn:
      'Browse listings, contact the other party, agree on terms, then we can guide you to issue a unified rental contract through Ejar.',
    sortOrder: 10,
  },
  {
    categoryKey: 'renting',
    questionAr: 'هل العقود موثقة؟',
    answerAr:
      'نعم، يتم توثيق عقود الإيجار عبر شبكة إيجار الوطنية لضمان الحقوق وفق الأنظمة.',
    questionEn: 'Are rental contracts authenticated?',
    answerEn:
      'Yes. Rental contracts can be documented via the national Ejar network to protect both parties.',
    sortOrder: 20,
  },
  {
    categoryKey: 'renting',
    questionAr: 'هل فيه دعم في حال حصل نزاع؟',
    answerAr: 'نعم، نقدم إرشاداً ومشورة ضمن الخدمات القانونية للتعامل مع النزاعات.',
    questionEn: 'Do you support disputes if they happen?',
    answerEn: 'Yes. We provide guidance and legal consultation for handling disputes.',
    sortOrder: 30,
  },

  // Selling
  {
    categoryKey: 'selling',
    questionAr: 'كيف أعرض عقاري؟',
    answerAr:
      'أنشئ حساباً ثم أكمل نموذج الإدراج وقدّم المعلومات والوثائق المطلوبة وفق الأنظمة.',
    questionEn: 'How do I list my property?',
    answerEn:
      'Create an account, complete the listing form, and provide the required details/documents as per regulations.',
    sortOrder: 10,
  },
  {
    categoryKey: 'selling',
    questionAr: 'هل أحتاج وسيط؟',
    answerAr: 'يمكنك الإعلان كمالك مباشرة، أو الاستعانة بوسيط عقاري.',
    questionEn: 'Do I need a broker?',
    answerEn: 'You can list as an owner directly, or work with a real estate broker.',
    sortOrder: 20,
  },
  {
    categoryKey: 'selling',
    questionAr: 'هل فيه رسوم على الإعلان؟',
    answerAr:
      'قد تكون بعض الخدمات مجانية وقد تُطبق رسوم على خدمات إضافية. يتم الإفصاح عن الرسوم قبل النشر/الطلب.',
    questionEn: 'Are there fees for listing?',
    answerEn:
      'Some features may be free and some services may have fees. All fees are disclosed before publishing/ordering.',
    sortOrder: 30,
  },

  // Payments
  {
    categoryKey: 'payments',
    questionAr: 'ما طرق الدفع المتاحة؟',
    answerAr: 'نوفر خيارات دفع متعددة تشمل البطاقات وخدمات الدفع الإلكتروني.',
    questionEn: 'What payment methods are available?',
    answerEn: 'We support multiple payment methods including cards and online payment options.',
    sortOrder: 10,
  },
  {
    categoryKey: 'payments',
    questionAr: 'هل الدفع آمن؟',
    answerAr:
      'نعم، نستخدم معايير أمان عالية وتشفير لحماية المعاملات بالتعاون مع مزودي دفع معتمدين.',
    questionEn: 'Is payment secure?',
    answerEn:
      'Yes. We use strong security standards and encryption in cooperation with authorized payment providers.',
    sortOrder: 20,
  },
  {
    categoryKey: 'payments',
    questionAr: 'هل أسترجع المبلغ لو ألغيت؟',
    answerAr: 'سياسة الاسترداد تعتمد على شروط الخدمة والبنود المعلنة.',
    questionEn: 'Can I get a refund if I cancel?',
    answerEn: 'Refund policy depends on the service terms and the stated policy.',
    sortOrder: 30,
  },

  // Support
  {
    categoryKey: 'support',
    questionAr: 'كيف أتواصل مع الدعم؟',
    answerAr:
      'يمكنك التواصل عبر الرقم الموحد أو البريد الإلكتروني أو قنوات التواصل المتاحة داخل المنصة.',
    questionEn: 'How can I contact support?',
    answerEn:
      'You can reach us via the unified phone number, email, or the support channels available inside the platform.',
    sortOrder: 10,
  },
];
