export const DEFAULT_INFO_TABS = [
  { key: 'terms_short', titleAr: 'ملخص الشروط والأحكام', titleEn: 'Terms Summary', sortOrder: 10 },
  { key: 'usage', titleAr: 'ملخص سياسة الاستخدام', titleEn: 'Usage Summary', sortOrder: 20 },
  { key: 'terms', titleAr: 'الشروط والأحكام (المفصلة)', titleEn: 'Detailed Terms', sortOrder: 30 },
  { key: 'privacy', titleAr: 'سياسة الخصوصية (المفصلة)', titleEn: 'Detailed Privacy Policy', sortOrder: 40 },
  { key: 'permits', titleAr: 'التراخيص والتصاريح', titleEn: 'Licenses & Permits', sortOrder: 50 },
  { key: 'contact', titleAr: 'اتصل بنا', titleEn: 'Contact Us', sortOrder: 60 },
];

export const DEFAULT_INFO_BLOCKS = [
  // --- TERMS SHORT ---
  {
    tabKey: 'terms_short',
    labelAr: 'قبول الشروط',
    labelEn: 'Acceptance of Terms',
    textAr: 'باستخدامك للمنصة، فإنك توافق على الالتزام بكافة الشروط والأحكام المذكورة.',
    textEn: 'By using the platform, you agree to abide by all the terms and conditions mentioned.',
    sortOrder: 10
  },
  {
    tabKey: 'terms_short',
    labelAr: 'الملكية الفكرية',
    labelEn: 'Intellectual Property',
    textAr: 'جميع المحتويات والعلامات التجارية والبيانات الموجودة على المنصة مملوكة لنا أو مرخصة للاستخدام.',
    textEn: 'All content, trademarks, and data on the platform are owned by us or licensed for use.',
    sortOrder: 20
  },
  {
    tabKey: 'terms_short',
    labelAr: 'التزامات المستخدم',
    labelEn: 'User Obligations',
    textAr: 'يجب على المستخدم تقديم معلومات دقيقة وصحيحة عند التسجيل أو إضافة العقارات.',
    textEn: 'The user must provide accurate and correct information when registering or adding properties.',
    sortOrder: 30
  },

  // --- USAGE ---
  {
    tabKey: 'usage',
    labelAr: 'الغرض من الاستخدام',
    labelEn: 'Purpose of Use',
    textAr: 'تم تصميم المنصة لتسهيل تداول العقارات والخدمات المرتبطة بها بشكل قانوني.',
    textEn: 'The platform is designed to legally facilitate real estate trading and associated services.',
    sortOrder: 10
  },
  {
    tabKey: 'usage',
    labelAr: 'السلوك الممنوع',
    labelEn: 'Prohibited Conduct',
    textAr: 'يُمنع استخدام المنصة لأي أغراض غير قانونية أو نشر محتوى مضلل.',
    textEn: 'It is prohibited to use the platform for any illegal purposes or to publish misleading content.',
    sortOrder: 20
  },
  {
    tabKey: 'usage',
    labelAr: 'خصوصية البيانات',
    labelEn: 'Data Privacy',
    textAr: 'نحن ملتزمون بحماية بياناتك واستخدامها فقط للأغراض الموضحة في سياسات الخصوصية.',
    textEn: 'We are committed to protecting your data and using it only for the purposes outlined in our privacy policies.',
    sortOrder: 30
  },

  // --- PRIVACY (LONG) ---
  {
    tabKey: 'privacy',
    labelAr: 'مقدمة',
    labelEn: 'Introduction',
    textAr: 'نلتزم بالمحافظة على سرية وخصوصية بيانات المستخدمين.\nحرصاً من منصة الوساطة الرقمية على بيانات المستخدمين ومعلوماتهم فإنها تلتزم بالمحافظة على سرية وخصوصية هذه البيانات واستخدامها للوصول إلى المستوى المأمول في تقديم الخدمة اللازمة، وذلك بما يتوافق مع الأنظمة واللوائح المعمول بها في المملكة العربية السعودية، ويعد استخدام منصة الوساطة الرقمية والمنصات التابعة لها موافقةً ضمنيةً من المستخدم على سياسة الخصوصية.',
    textEn: 'We are committed to maintaining the confidentiality and privacy of user data.',
    sortOrder: 10
  },
  {
    tabKey: 'privacy',
    labelAr: 'من يقوم بجمع بيانات المستخدمين؟',
    labelEn: 'Who collects user data?',
    textAr: 'للحفاظ على بياناتك الشخصية، يتم تأمين التخزين الإلكتروني والبيانات الشخصية المرسلة باستخدام التقنيات الأمنية المناسبة. إنك مسئول بمفردك عن تمام وصحة وصدق البيانات التي ترسلها من خلال هذه المنصة.\n\nمنصة الوساطة الرقمية غير مسئولة تحت أي ظرف من الظروف عن أي أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية أو خاصة أو استثنائية تنشأ من استخدام أو عدم القدرة على استخدام المنصة.',
    textEn: 'To protect your personal data, electronic storage and transmitted personal data are secured using appropriate security technologies.',
    sortOrder: 20
  },
  {
    tabKey: 'privacy',
    labelAr: 'ما هي البيانات الشخصية التي نجمعها؟',
    labelEn: 'What personal data do we collect?',
    textAr: 'تقوم منصة الوساطة الرقمية بجمع البيانات الشخصية من خلال المصادر التالية:\n\n- 1. بيانات التحقق والامتثال (إلزامية للتسجيل): لضمان موثوقية التعاملات العقارية، نقوم بجمع بيانات التحقق الرسمية: التحقق الحكومي، بيانات التراخيص.\n- 2. بيانات الهوية والاتصال (إلزامية للتسجيل): المعلومات الأساسية اللازمة لإنشاء حسابك والتواصل معك (الاسم، الهوية، رقم الجوال، الخ).\n- 3. بيانات التواصل والدردشة (إلزامية لمراقبة جودة الخدمة): المراسلات والدعم الفني.\n- 4. البيانات التقنية والسلوكية (تجمع تلقائياً): لتحسين تجربة المستخدم وتأمين الحساب (بيانات الجهاز، البيانات السلوكية).\n- 5. بيانات الدفع (إلزامية للخدمات المدفوعة): نجمع تفاصيل الدفع ومعلومات البطاقة بشكل جزئي فقط.\n- 6. بيانات الموقع الجغرافي (اختيارية): في حال تفعيل خاصية تحديد الموقع من جهازك، سنقوم بجمع موقعك التقريبي.',
    textEn: 'Digital Brokerage platform collects personal data through various sources.',
    sortOrder: 30
  },
  {
    tabKey: 'privacy',
    labelAr: 'مصادر وطرق جمع البيانات الشخصية',
    labelEn: 'Sources and methods of collecting personal data',
    textAr: '- الجمع المباشر: عبر النماذج الإلكترونية داخل المنصة.\n- الجمع عبر الربط الحكومي: من خلال منصة نفاذ وهيئة العقار.\n- الجمع غير المباشر (التقني): عبر ملفات تعريف الارتباط والتقنيات المشابهة.\n- النيابة النظامية: جمع البيانات للوكلاء الشرعيين.',
    textEn: 'Direct collection, government linkage, indirect collection, and legal representation.',
    sortOrder: 40
  },
  {
    tabKey: 'privacy',
    labelAr: 'كيفية استخدام البيانات الشخصية والأساس النظامي لمعالجتها',
    labelEn: 'How personal data is used and the legal basis for processing it',
    textAr: 'تلتزم المنصة بعدم استخدام بياناتكم الشخصية إلا للأغراض التي جُمعت من أجلها، ولا يتم معالجتها لأغراض أخرى إلا إذا كانت متوافقة مع الغرض الأصلي...',
    textEn: 'The platform is committed to not using your personal data except for the purposes for which it was collected.',
    sortOrder: 50
  },
  {
    tabKey: 'privacy',
    labelAr: 'الإفصاح عن البيانات الشخصية ونطاق مشاركتها',
    labelEn: 'Disclosure of personal data and scope of sharing',
    textAr: 'نلتزم في المنصة بحماية خصوصيتكم، ونؤكد بأننا لن نقوم ببيع بياناتكم الشخصية أو الإفصاح عنها لأي طرف ثالث لأغراض التسويق المباشر. ومع ذلك، قد يتم مشاركة بياناتكم مع جهات محددة لأغراض تشغيلية ونظامية.',
    textEn: 'We are committed to protecting your privacy and confirm that we will not sell or disclose your personal data.',
    sortOrder: 60
  },
  {
    tabKey: 'privacy',
    labelAr: 'خامساً: الالتزام بالسرية',
    labelEn: 'Fifth: Commitment to confidentiality',
    textAr: 'نضمن بأن جميع الأطراف الثالثة التي يتم مشاركة البيانات معها ملزمة تعاقدياً باحترام خصوصية بياناتكم، ومعالجتها فقط وفقاً لتعليماتنا المحددة، وعدم استخدامها لأي أغراض خاصة بها.',
    textEn: 'We guarantee that all third parties with whom data is shared are contractually obligated to respect your privacy.',
    sortOrder: 70
  },
  {
    tabKey: 'privacy',
    labelAr: 'سادساً: المسوغات النظامية لمعالجة بياناتكم الشخصية',
    labelEn: 'Sixth: Legal justifications for processing your personal data',
    textAr: '- الموافقة الصريحة: تمنحوننا موافقتكم على معالجة بياناتكم وفق الأغراض المحددة.\n- الالتزام التعاقدي: لتقديم الخدمات العقارية ومطابقة الطلبات.\n- الالتزام النظامي: لامتثالنا للأنظمة الصادرة عن الجهات الحكومية.\n- المصالح المشروعة: لتحقيق أهداف المنصة في تحسين جودة الخدمات وتطوير تجربة المستخدم.',
    textEn: 'Explicit consent, contractual obligation, regulatory compliance, and legitimate interests.',
    sortOrder: 80
  },
  {
    tabKey: 'privacy',
    labelAr: 'سابعاً: كيف نحافظ على أمن بياناتكم الشخصية؟',
    labelEn: 'Seventh: How do we maintain the security of your personal data?',
    textAr: '- حماية الأنظمة: نستخدم تقنيات تشفير متطورة وبروتوكولات أمان عالمية.\n- حصر صلاحيات الوصول: يتم تقييد الوصول إلى البيانات الشخصية وحصره فقط على الموظفين.\n- التعامل مع الحوادث: وضعنا إجراءات عمل دقيقة للتعامل مع أي اشتباه بخرق للبيانات.',
    textEn: 'System protection, restricting access rights, and handling incidents.',
    sortOrder: 90
  },
  {
    tabKey: 'privacy',
    labelAr: 'ثامناً: حقوقكم كأصحاب بيانات',
    labelEn: 'Eighth: Your rights as data subjects',
    textAr: 'بموجب الأنظمة، يحق لكم طلب (الوصول، التصحيح، التحديث، أو الإتلاف) لبياناتكم الشخصية.',
    textEn: 'Under the regulations, you have the right to request access, correction, update, or destruction of your personal data.',
    sortOrder: 100
  },
  {
    tabKey: 'privacy',
    labelAr: 'تاسعاً: تخزين البيانات الشخصية وفترات الاحتفاظ بها',
    labelEn: 'Ninth: Storage of personal data and retention periods',
    textAr: '- مكان التخزين: داخل المملكة العربية السعودية.\n- الاحتفاظ ببيانات الحساب لمدة (5) سنوات والتعاملات (2) سنتين والجهاز (1) سنة.\n- آلية الإتلاف الآمن: الحذف الآلي النهائي والتشفير الدائم.',
    textEn: 'Storage location, retention periods, and secure destruction mechanism.',
    sortOrder: 110
  },
  {
    tabKey: 'privacy',
    labelAr: 'عاشراً: التدابير الأمنية وإجراءات خرق البيانات',
    labelEn: 'Tenth: Security measures and data breach procedures',
    textAr: 'نطبق تدابير أمنية متقدمة لحماية بياناتكم من الوصول غير المصرح به (التشفير، الرقابة، الإخطار عن الاختراقات خلال 72 ساعة).',
    textEn: 'We implement advanced security measures to protect your data from unauthorized access.',
    sortOrder: 120
  },
  {
    tabKey: 'privacy',
    labelAr: 'أحد عشر: حقوقكم فيما يتعلق ببياناتكم الشخصية',
    labelEn: 'Eleven: Your rights regarding your personal data',
    textAr: '- حق الوصول.\n- حق التصحيح.\n- حق الإتلاف (المسح).\n- حق الاعتراض.\n- حق نقل البيانات.\n- حق سحب الموافقة.',
    textEn: 'Right to access, rectify, erase, object, data portability, and withdraw consent.',
    sortOrder: 130
  },
  {
    tabKey: 'privacy',
    labelAr: 'اثنا عشر: سياسة التعامل مع القاصرين',
    labelEn: 'Twelve: Policy for dealing with minors',
    textAr: 'المنصة غير مخصصة لاستخدام القاصرين (من هم دون سن 18 عاماً حسب التقويم الهجري).',
    textEn: 'The platform is not intended for use by minors.',
    sortOrder: 140
  },
  {
    tabKey: 'privacy',
    labelAr: 'ثلاثة عشر: الروابط والمنصات التابعة لأطراف خارجية',
    labelEn: 'Thirteen: Links and third-party platforms',
    textAr: 'لا تملك المنصة أي سلطة أو رقابة على ممارسات الخصوصية الخاصة بتلك الأطراف (مثل بوابات الدفع الخارجية).',
    textEn: 'The platform has no authority or control over the privacy practices of those parties.',
    sortOrder: 150
  },
  {
    tabKey: 'privacy',
    labelAr: 'أربعة عشر: التعديلات على سياسة الخصوصية',
    labelEn: 'Fourteen: Amendments to the Privacy Policy',
    textAr: 'نحتفظ بالحق في تحديث أو تعديل سياسة الخصوصية هذه في أي وقت.',
    textEn: 'We reserve the right to update or modify this privacy policy at any time.',
    sortOrder: 160
  },
  {
    tabKey: 'privacy',
    labelAr: 'خمسة عشر: التواصل معنا',
    labelEn: 'Fifteen: Contact us',
    textAr: 'في حال وجود أي استفسارات حول هذه السياسة، يمكنكم التواصل مع مسؤول حماية البيانات عبر البريد الإلكتروني.',
    textEn: 'If you have any questions about this policy, you can contact the Data Protection Officer.',
    sortOrder: 170
  },

  // --- PERMITS ---
  {
    tabKey: 'permits',
    labelAr: 'التراخيص المعتمدة',
    labelEn: 'Approved Licenses',
    textAr: 'المنصة مرخصة ومعتمدة من قبل الجهات الحكومية المختصة في المملكة العربية السعودية.',
    textEn: 'The platform is licensed and approved by the competent government authorities in Saudi Arabia.',
    sortOrder: 10
  },
  {
    tabKey: 'permits',
    labelAr: 'رقم الترخيص',
    labelEn: 'License Number',
    textAr: 'تعمل المنصة بموجب ترخيص رسمي يضمن حقوق جميع الأطراف المتبايعة.',
    textEn: 'The platform operates under an official license that guarantees the rights of all trading parties.',
    sortOrder: 20
  },

  // --- CONTACT ---
  {
    tabKey: 'contact',
    labelAr: 'فريق الدعم المباشر',
    labelEn: 'Direct Support Team',
    textAr: 'يمكنكم التواصل مع فريق الدعم الفني وخدمة العملاء في أي وقت لحل المشاكل أو استقبال الاقتراحات.',
    textEn: 'You can contact our technical support and customer service team at any time to solve problems or receive suggestions.',
    sortOrder: 10
  },

  // --- TERMS (LONG) ---
  {
    tabKey: 'terms',
    labelAr: 'تمهيد',
    labelEn: 'Introduction',
    textAr: 'الرجاء قراءة هذه الشروط والأحكام بعناية قبل استخدام المنصة الإلكترونية.\n\nيخضع استخدامك للمنصة إلى شروط الاستخدام لذا يرجى قراءتها بعناية قبل البدء في الدخول و استخدام خدمات المنصة. يتضمن هذا المستند شروط استخدام المنصة الالكترونية ("شروط الاستخدام") التي بناء عليها يمكنك دخول و استخدام خدمات المنصة سواء بصفتك زائرا أو مستخدما مسجلا، دون أي تعديل أو قيود أو تبديل على هذه الشروط والاحكام، كما يتضمن استخدام المنصة عددًا من البنود والشروط التي تخضع لتحديثات وتغييرات مستمرة حسب الحاجة. ويصبح أي تعديل أو تحديث لأي من هذه البنود والشروط نافذًا فور نشره على المنصة ما لم يُبين خلاف ذلك، كما يتطلب منك مراجعة مستمرة لشروط الاستخدام لمعرفة أية تحديثات تتم عليها.\n\nإن دخولك واستخدامك للمنصة يعد بمثابة تأكيد على أهليتك القانونية و قبولك لشروط الاستخدام و موافقتك على الالتزام بها وعلى ماتضمنته من أحكام. ويعني استمرارك في استخدام هذه المنصة أنك قد اطلعت ووافقت تمامًا على أي تعديل تم على بنود وشروط استخدامها. علماً بأن إدارة المنصة ليست ملزمة بالإعلان عن أي تحديثات أو تغييرات تطرأ على البنود والشروط. وفي حال عدم موافقتك على شروط الاستخدام فيجب عليك الامتناع عن استخدام المنصة.',
    textEn: 'Please read these terms and conditions carefully before using the electronic platform.',
    sortOrder: 10
  },
  {
    tabKey: 'terms',
    labelAr: 'البند الأول: التعريف بالمنصة ونطاق الخدمة',
    labelEn: 'First Item: Platform Definition and Service Scope',
    textAr: 'تُعد منصة "الوساطة الرقمية" وجهة رقمية متكاملة تدار تحت إشراف تقني وقانوني مباشر، وتهدف بصفة أساسية إلى تمكين ملاك العقارات والوسطاء والشركات العقارية من عرض وبيع وتأجير العقارات، بالإضافة إلى تيسير إجراءات الطلب والشراء والاستئجار لكافة المستفيدين في مختلف مناطق المملكة العربية السعودية. كما تمتد خدمات المنصة لتشمل تمكين مقدمي الخدمات المساندة من طرح خدماتهم التي تخدم القطاع العقاري والمستفيد النهائي تحت مظلة وإشراف المنصة. وتعمل المنصة كمنظم وضامن إجرائي يسعى لحفظ حقوق كافة الأطراف المعنية من بائعين ومسوقين ومشترين ومزودي خدمات، وذلك عبر توفير بيئة تعاقدية وإدارة قانونية تضبط التزامات الأطراف وتضمن سير العمليات العقارية وفق الأطر النظامية والاتفاقات الموثقة عبر المنصة.',
    textEn: 'Digital Brokerage platform is an integrated digital destination managed under direct technical and legal supervision.',
    sortOrder: 20
  },
  {
    tabKey: 'terms',
    labelAr: 'البند الثاني: الدخول على المنصة',
    labelEn: 'Second Item: Accessing the Platform',
    textAr: 'لا تضمن المنصة بقاء النظام او اي من محتوياته متاحا دائما من غير انقطاع، كما أن الدخول للمنصة متاح بشكل دائم، ويجوز للمنصة سحب او ايقاف او تغيير كامل المنصة أو أي جزء منه دون إشعار مسبق، كما لا تتحمل المنصة أية مسؤولية تجاهك في حال عدم توفر المنصة لأي سبب من الأسباب في أي وقت ولاية فترة.\n\nالمنصة موجه للسعوديين و للأفراد المقيمين في المملكة العربية السعودية وفق النظام، وبناء على ذلك فإن المنصة غير متاحه للأشخاص المقيمين خارج المملكة.',
    textEn: 'The platform does not guarantee that the system or any of its contents will always be available without interruption.',
    sortOrder: 30
  },
  {
    tabKey: 'terms',
    labelAr: 'البند الثالث: حسابك وكلمة المرور الخاصة بك',
    labelEn: 'Third Item: Your Account and Password',
    textAr: 'في حال تزويدك أو اختيارك لاسم المستخدم أو كلمة المرور أو أية معلومة أخرى كجزء من الإجراءات الأمنية الخاصة بالمنصة، فيجب عليك التعامل مع هذه المعلومات على انها معلومات سرية، بناء على ذلك يجب الامتناع عن الإفصاح عنها إلى أي شخص. يجوز للمنصة بحسب ما يراه مناسبا تعطيل اسم المستخدم أو كلمة المرور في اي وقت، سواء كانت من اختيارك او مخصصة لك ، وذلك في حال عدم الالتزام بأي من أحكام شروط الاستخدام.',
    textEn: 'If you are provided with or choose a username, password, or any other piece of information as part of our security procedures.',
    sortOrder: 40
  },
  {
    tabKey: 'terms',
    labelAr: 'البند الرابع: حدود المسئولية',
    labelEn: 'Fourth Item: Limitation of Liability',
    textAr: 'لا تتحمل المنصة أية مسؤولية تجاه أي مستخدم عن اية خسارة أو ضرر، حتى لو كانت تلك الأضرار أو الخسائر متوقعة أو ناشئة من إحدى الاسباب التالية:\n\n- عدم القدرة على استخدام المنصة.\n- الحصول على المعلومات من المنصة وما يتبعه من مفاوضات وإتمامها خارج المنصة.\n- الاتفاق والتعاقد خارج المنصة تحت اسم وضمانات المنصة أو باستخدام سمعته كضامن.\n\nتخلي المنصة مسؤوليتها المطلقة عن أي التزامات تعاقدية أو أضرار تنشأ عن هذه التعاملات الخارجية، ولا يمثل طرفًا ضامنًا لها على الإطلاق، كما تقع المسؤولية كاملة على الأطراف المتعاقدة.\n\nولا تتحمل المنصة أية مسؤولية عن أي خسارة أو ضرر ناجم عن فيروس او هجوم منع الخدمة أو غيرها من المواد الضارة من الناحية التقنية والتي قد تصيب اجهزة الكمبيوتر وبرامج الكمبيوتر أو بيانات أو مواد الملكية الاخرى نتيجة استخدام المنصة او نتيجة تحميل أي محتوى من المنصة أو من أي موقع آخر مرتبط بالمنصة.\n\nيتم توفير روابط الاتصال بالبوابات و/أو مواقع الويب الأخرى بغرض التسهيل لك، وتُخلي المنصة مسؤوليتها عن محتويات أو مصداقية البوابات و/أو المواقع التي ترتبط بها، ولا تُصادق على محتوياتها. وأن استخدام الروابط للوصول إلى تلك المواقع أو البوابات يتم على مسؤوليتك الخاصة تماماً.كما لا تتحمل المنصة اية مسؤولية عن أي خسارة أو ضرر قد ينشأ من استخدام اي روابط ليست لها صلة بالمنصة.',
    textEn: 'The platform shall not be liable to any user for any loss or damage, whether in contract, tort, breach of statutory duty, or otherwise.',
    sortOrder: 50
  },
  {
    tabKey: 'terms',
    labelAr: 'البند الخامس: تحميل محتوى على المنصة',
    labelEn: 'Fifth Item: Uploading Content to the Platform',
    textAr: 'في حالة استخدام إحدى الخصائص التي تتيح تحميل محتوى على المنصة أو التواصل مع مستخدمي المنصة الآخرين،فإنه يجب الالتزام بعدم تحميل أي مواد تحتوي على مايخالف أي أنظمة أو تعليمات مطبقة و الامتناع كذلك عن تحميل أي مواد قد تضر بالمنصة أو محتواها، أو معلومات أخرى ليست مملوكة لك أو لا تملك ترخيصاً بشأنها.\n\nلن يكون المحتوى الذي تقوم بتحميله على المنصة ذا طبيعة سرية أو ملكية خاصة، وسيكون لنا الحق الكامل في استخدامة بالطريقة التي نراها بما في ذلك منح المستخدمين الآخرين حق الاطلاع عليه واستخدامه. ويحق للمنصة كذلك حذف أي محتوى يتم نشره على المنصة إذا كان المحتوى المنشور لا يتوافق مع شروط الاستخدام.',
    textEn: 'Whenever you make use of a feature that allows you to upload content to the platform, or to make contact with other users.',
    sortOrder: 60
  },
  {
    tabKey: 'terms',
    labelAr: 'البند السادس: معايير المحتوى',
    labelEn: 'Sixth Item: Content Standards',
    textAr: 'تنطبق معايير المحتوى على جميع المواد التي يشارك بها مستخدمي المنصة واية خدمات تفاعلية مرتبطة بها. وعليه عند قيامك بالمشاركة في المنصة من خلال تحميل او رفع الملفات أو الكتابة أو غير ذلك، فيجب عليك التأكد من أن مشاركتك تستوفي الشروط التالية:\n\n- أن تكون دقيقة وتعكس المنصة.\n- الا تعارض الانظمة واللوائح والتعليمات المعمول بها في المملكة العربية السعودية.\n- ألا تنطوي على خداع أي شخص.\n- ألا تنطوي على الإخلال بأي التزام تجاه طرف ثالث.\n- ألا تشجع على أي نشاط غير قانوني.',
    textEn: 'These content standards apply to any and all material which you contribute to the platform.',
    sortOrder: 70
  },
  {
    tabKey: 'terms',
    labelAr: 'البند السابع: التعليق والإنهاء',
    labelEn: 'Seventh Item: Suspension and Termination',
    textAr: 'في حال ثبوت أي إخلال فستتخذ الإجراءات التي يرى أنها مناسبة، وقد يؤدي عدم الالتزام بشروط الاستخدام إلى القيام باتخاذ كافة أو أي من الاجراءات التالية:\n\n- السحب الفوري أو المؤقت أو الدائم لحقك في استخدام المنصة.\n- توجيه تحذير لك.\n\nكما أن الإجراءات المتبعة في حالات الإخلال الموضحة اعلاه ليست مقتصرة على ماتم ذكره حيث يمكن اتخاذ أي إجراء آخر مناسبا.',
    textEn: 'We will determine, in our discretion, whether there has been a breach of these terms of use through your use of the platform.',
    sortOrder: 80
  },
  {
    tabKey: 'terms',
    labelAr: 'البند الثامن: المعاملات المالية',
    labelEn: 'Eighth Item: Financial Transactions',
    textAr: 'تستقطع المنصة عمولة إدارية بنسبة (1%) من القيمة الإجمالية لكل عملية أو معاملة يتم تنفيذها بنجاح عبر المنصة. تسري هذه النسبة على كل من (المستخدم) ومزودي الخدمات في الأقسام التالية: (الإدارة القانونية، ادارة التسويق، والخدمات الإدارية). ويوافق الأطراف على استقطاع هذه النسبة آلياً عند إتمام عملية الدفع، يتحمل المستخدم هذه النسبة بشكل منفصل وغير متضامن. هذه النسبة تمثل رسوم العمولة ولا تشمل أي رسوم أو تكاليف إضافية أخرى مفروضة من قبل المنصة.\n\nيخضع مقدمو الخدمات في إدارات (العروض، الطلبات، المالية، والموظفين) لنظام الاشتراك الثابت؛ حيث يلتزم مقدم الخدمة بدفع مبلغ مقطوع ومحدد مسبقاً مقابل حق الوصول إلى ميزات المنصة والاستفادة من أدواتها التقنية. ويتم تجديد هذا الاشتراك بشكل دوري (شهري/سنوي) وفقاً لباقة الاشتراك المختارة، ولا يعتبر مقدم الخدمة مؤهلاً لممارسة نشاطه عبر المنصة دون سداد الرسوم المقررة. هذا المبلغ لا يشمل أي رسوم أو تكاليف إضافية أخرى مفروضة من قبل المنصة.\n\nيجب على المستخدمين الدفع فقط باستخدام طرق الدفع المتاحة ضمن المنصة. يمكن لمقدم الخدمة تقديم طلب تحويل المبلغ المستحق له بطلب رسمي عبر المنصة، وتُستكمل إجراءات التحويل وتُنفذ خلال مدة زمنية أقصاها ثلاثة (3) أيام عمل، و يُستثنى من احتساب هذه المدة أيام الإجازات والعطلات الرسمية التي تتوقف فيها أعمال البنوك.',
    textEn: 'The platform deducts an administrative commission of (1%) from the total value of each process or transaction.',
    sortOrder: 90
  },
  {
    tabKey: 'terms',
    labelAr: 'البند التاسع: استعادة المدفوعات',
    labelEn: 'Ninth Item: Refund of Payments',
    textAr: '- إذا أراد المستخدم استعادة الرصيد إلى حسابه البنكي، يجب عليه التواصل مع مركز المساعدة الخاص بالمنصة، يجب أن يتم ذلك بعد اتفاق الأطراف المعنية (المستخدم ومقدم الخدمة، أو حسب سياسة المنصة).\n- يجب أن يتم طلب استعادة الرصيد خلال فترة لا تتجاوز 60 يوماً من تاريخ العملية، وبعد انقضاء هذه المدة (أكثر من 60 يوماً)، غير ممكن لاستعادة الرصيد.\n- يتم استعادة المبلغ فقط إلى البطاقة أو الحساب الذي تم الدفع منه في الأصل، و لا يمكن الاستعادة إلى حساب بنكي أو بطاقة أخرى.\n- لا يتم استرداد رسوم المنصة البالغة 1% ولا رسوم بوابات الدفع الإلكترونية، أي أن المستخدم يسترد المبلغ الأصلي للدفع مطروحاً منه هذه النسبة.',
    textEn: 'If the user wishes to restore the balance to their bank account, they must contact the platform\'s help center.',
    sortOrder: 100
  },
  {
    tabKey: 'terms',
    labelAr: 'البند العاشر: القانون المعمول به',
    labelEn: 'Tenth Item: Applicable Law',
    textAr: 'تخضع هذه الشروط والأحكام للأنظمة والتشريعات السارية في المملكة العربية السعودية. في حال نشوء أي نزاع أو خلاف يتم حله عبر المحكمة المختصة في مدينة [الرياض] بالمملكة العربية السعودية. لا يضمن الموقع ما ينبغي أن يُفسر على أنه يمنح ضمنًا.',
    textEn: 'These terms and conditions are subject to the laws and regulations in force in the Kingdom of Saudi Arabia.',
    sortOrder: 110
  }
];
