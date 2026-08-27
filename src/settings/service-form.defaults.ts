/**
 * Dynamic service-form definitions (admin-editable form builder).
 *
 * Single source of truth for the 10 customer-facing service forms:
 * 6 normal services (postPurchase, construction, marketing, leasing, visit, other)
 * and 4 legal sub-services (legal_disputes, legal_contracts, legal_documentation, legal_other).
 *
 * Defaults are seeded into the settings store under `service_form_<category>`
 * on startup (only when the key does not exist — admin edits are never overwritten).
 *
 * Transcription notes (parity with the previous hardcoded forms):
 * - `target` is a fixed DTO column (clientName|phone|city|district|quantity|serviceType|description|termsAccepted)
 *   or a dotted path into jsonb columns (metadata.x, firstParty.x, secondParty.x, firstParty.agent.x).
 *   An empty string target means the value is not persisted on its own (visual fields, uploads,
 *   or values that only feed a template). Uploads were non-functional before, so `file` fields
 *   render the placeholder UI and store nothing (parity).
 * - Templates interpolate `{fieldId}` from the submitted field values. A template may be a plain
 *   string or an ordered array of { when?, template } rules — the first rule whose `when` matches
 *   (rule without `when` always matches) is applied; if none match the raw value is kept.
 *   `{serviceType}` inside a descriptionTemplate refers to the composed serviceType.
 * - `serviceTypeFallback` (marketing) reproduces `service || "Photography Session"`.
 * - `visibleWhen.equals` / `notEquals` accept a string or a string array (equals = any, notEquals = none).
 *   A field whose visibleWhen evaluates false is hidden, not submitted and not server-validated.
 * - `divider` / `file` / `terms` fields are never part of server-side required validation.
 * - The renderer must always send `quantity` (default 1) even when the def has no quantity field
 *   (marketing today always submits quantity = 1).
 */
export type FieldType =
    | 'text' | 'textarea' | 'number' | 'select' | 'radio'
    | 'date' | 'time' | 'checkbox' | 'file' | 'terms' | 'divider';

export const FIELD_TYPES: FieldType[] = [
    'text', 'textarea', 'number', 'select', 'radio',
    'date', 'time', 'checkbox', 'file', 'terms', 'divider',
];

export interface FieldOption {
    value: string;
    label: string;
}

export interface VisibleWhen {
    field: string;
    equals?: string | string[];
    notEquals?: string | string[];
}

export interface FieldDef {
    id: string;
    type: FieldType;
    label: string;                    // Arabic (current UI is hardcoded Arabic)
    placeholder?: string;
    required?: boolean;
    options?: FieldOption[];          // select/radio
    target: string;                   // fixed DTO column, dotted jsonb path, or '' (not persisted)
    section?: string;                 // visual group label
    visibleWhen?: VisibleWhen;
    half?: boolean;
    dir?: 'rtl' | 'ltr';
    defaultValue?: string;
}

export interface TemplateRule {
    when?: VisibleWhen;
    template: string;
}

export interface ServiceFormDef {
    version: 1;
    descriptionTemplate?: string | TemplateRule[];
    serviceTypeTemplate?: string | TemplateRule[];
    serviceTypeFallback?: string;     // used when the serviceType-targeting field is empty
    fields: FieldDef[];
}

export const SERVICE_FORM_KEY_PREFIX = 'service_form_';

/**
 * Validates a ServiceFormDef. Returns an error message, or null when valid.
 */
export function validateServiceFormDef(def: unknown): string | null {
    if (!def || typeof def !== 'object' || Array.isArray(def)) {
        return 'Form definition must be an object';
    }
    const d = def as any;
    if (d.version !== 1) {
        return 'Form definition version must be 1';
    }
    if (!Array.isArray(d.fields) || d.fields.length === 0) {
        return 'Form definition must contain a non-empty fields array';
    }
    for (const field of d.fields) {
        if (!field || typeof field !== 'object' || Array.isArray(field)) {
            return 'Each field must be an object';
        }
        if (typeof field.id !== 'string' || !field.id.trim()) {
            return 'Each field must have a non-empty string id';
        }
        if (typeof field.type !== 'string' || !FIELD_TYPES.includes(field.type as FieldType)) {
            return `Field "${field.id}" has an unknown type "${field.type}"`;
        }
        if (typeof field.label !== 'string' || !field.label.trim()) {
            return `Field "${field.id}" must have a non-empty string label`;
        }
        if (typeof field.target !== 'string') {
            return `Field "${field.id}" must have a string target`;
        }
        if ((field.type === 'select' || field.type === 'radio') && !Array.isArray(field.options)) {
            return `Field "${field.id}" (${field.type}) must have an options array`;
        }
    }
    return null;
}

// ─── Shared building blocks (normal services) ────────────────────────────────

const personalInfoFields = (): FieldDef[] => [
    { id: 'section_personal', type: 'divider', label: 'البيانات الشخصية', target: '' },
    { id: 'name', type: 'text', label: 'الاسم بالكامل', placeholder: 'الاسم الثلاثي أو الرباعي', dir: 'rtl', required: true, half: true, target: 'clientName' },
    { id: 'phone', type: 'text', label: 'رقم الجوال', placeholder: '05xxxxxxxx', dir: 'ltr', required: true, half: true, target: 'phone' },
    { id: 'city', type: 'text', label: 'المدينة', placeholder: 'اسم المدينة', dir: 'rtl', required: true, half: true, target: 'city' },
    { id: 'district', type: 'text', label: 'الحي', placeholder: 'اسم الحي السكني', dir: 'rtl', required: true, half: true, target: 'district' },
];

const serviceSectionDivider = (): FieldDef => ({
    id: 'section_service', type: 'divider', label: 'تفاصيل الخدمة', target: '',
});

const termsField = (): FieldDef => ({
    id: 'termsAccepted',
    type: 'terms',
    label: 'أوافق على سياسة الاستخدام والشروط والأحكام ومعالجة البيانات المدخلة.',
    required: true,
    target: 'termsAccepted',
});

const notesField = (): FieldDef => ({
    id: 'description',
    type: 'textarea',
    label: 'تفاصيل وملاحظات',
    placeholder: 'اشرح لنا حاجتك بالتفصيل...',
    target: 'description',
});

const options = (values: string[]): FieldOption[] => values.map((v) => ({ value: v, label: v }));

/** Standard "service details" block shared by postPurchase/construction/leasing/visit/other. */
const standardServiceFields = (serviceOptions: string[]): FieldDef[] => [
    {
        id: 'service',
        type: 'select',
        label: 'نوع الخدمة المطلوبة',
        placeholder: 'اختر من القائمة...',
        required: true,
        half: true,
        target: 'serviceType',
        options: options(serviceOptions),
    },
    {
        id: 'quantity',
        type: 'number',
        label: 'الكمية / العدد',
        required: true,
        half: true,
        target: 'quantity',
        defaultValue: '1',
    },
    {
        id: 'otherService',
        type: 'text',
        label: 'اكتب نوع الخدمة المطلوبة',
        placeholder: 'ما هي الخدمة التي تحتاجها؟',
        target: 'serviceType',
        visibleWhen: { field: 'service', equals: 'أخرى' },
    },
];

// ─── Default form definitions ────────────────────────────────────────────────

export const DEFAULT_SERVICE_FORMS: Record<string, ServiceFormDef> = {
    postPurchase: {
        version: 1,
        fields: [
            ...personalInfoFields(),
            serviceSectionDivider(),
            ...standardServiceFields([
                'الغاز', 'نقل وتركيب الأثاث', 'التأمين على المنزل', 'الصيانة (سباكة / كهرباء)',
                'خدمة التنظيف', 'تنسيق حدائق', 'أنظمة أمنية', 'أخرى',
            ]),
            notesField(),
            termsField(),
        ],
    },

    construction: {
        version: 1,
        fields: [
            ...personalInfoFields(),
            serviceSectionDivider(),
            ...standardServiceFields([
                'مقاول عظم', 'تصميم هندسي', 'تشطيبات', 'كهرباء', 'سباكة', 'نجارة',
                'دهانات', 'ألمنيوم', 'إشراف هندسي', 'تصميم داخلي', 'أخرى',
            ]),
            notesField(),
            termsField(),
        ],
    },

    marketing: {
        version: 1,
        serviceTypeFallback: 'Photography Session',
        descriptionTemplate:
            '[Photography Schedule]\nProperty ID: {propertyId}\nDate: {appointmentDate}\nTime: {appointmentTime}\n---\nNotes: {description}',
        fields: [
            ...personalInfoFields(),
            serviceSectionDivider(),
            {
                id: 'service',
                type: 'select',
                label: 'نوع الخدمة التسويقية',
                target: 'serviceType',
                options: options([
                    'تصوير فوتوغرافي للعقار', 'حملة إعلانية (وسائل التواصل الاجتماعي)',
                    'حملة إعلانية (إعلانات طرق/تقليدية)', 'أخرى',
                ]),
            },
            {
                id: 'propertyId',
                type: 'text',
                label: 'كود الوحدة (PRP)',
                placeholder: 'PRP-X',
                dir: 'ltr',
                required: true,
                half: true,
                target: 'metadata.propertyId',
            },
            {
                id: 'appointmentDate',
                type: 'date',
                label: 'تاريخ الجلسة',
                dir: 'ltr',
                required: true,
                half: true,
                target: 'metadata.appointmentDate',
            },
            {
                id: 'appointmentTime',
                type: 'time',
                label: 'وقت الجلسة',
                dir: 'ltr',
                required: true,
                half: true,
                target: 'metadata.appointmentTime',
            },
            notesField(),
            termsField(),
        ],
    },

    leasing: {
        version: 1,
        fields: [
            ...personalInfoFields(),
            serviceSectionDivider(),
            ...standardServiceFields(['تأجير العقار', 'إدارة عقود الإيجار', 'تحصيل الإيجارات', 'أخرى']),
            notesField(),
            termsField(),
        ],
    },

    visit: {
        version: 1,
        descriptionTemplate: [
            {
                when: { field: 'service', equals: 'تصوير العقار' },
                template: '[Photography Type: {visitPhotographyType}]\n---\n{description}',
            },
        ],
        fields: [
            ...personalInfoFields(),
            serviceSectionDivider(),
            ...standardServiceFields([
                'زيارة شخصية', 'زيارة بالنيابة', 'تصوير العقار', 'تقرير مفصل', 'جولة مع الوكيل', 'أخرى',
            ]),
            {
                id: 'visitPhotographyType',
                type: 'radio',
                label: 'نوع التصوير',
                required: true,
                target: 'metadata.visitPhotographyType',
                options: [
                    { value: 'Video', label: 'فيديو' },
                    { value: 'Live', label: 'لايف' },
                ],
                visibleWhen: { field: 'service', equals: 'تصوير العقار' },
            },
            notesField(),
            termsField(),
        ],
    },

    other: {
        version: 1,
        fields: [
            ...personalInfoFields(),
            serviceSectionDivider(),
            ...standardServiceFields(['التقييم العقاري', 'المسح الهندسي', 'تمويل عقاري', 'أخرى']),
            notesField(),
            termsField(),
        ],
    },

    // ─── Legal services ──────────────────────────────────────────────────────
    // NOTE: today's legal flow enforces no required fields client-side, so no legal
    // field is marked required here (parity). Admins may mark fields required later;
    // staff tools (admin panel / building management) bypass server-side enforcement.

    legal_disputes: {
        version: 1,
        serviceTypeTemplate: 'منازعة عقارية',
        descriptionTemplate: [
            {
                when: { field: 'disputeType', equals: 'اخرى' },
                template: '[{otherDisputeType}]\n{disputeDescription}',
            },
            {
                template: '[{disputeType}]\n{disputeDescription}',
            },
        ],
        fields: [
            { id: 'section_party1', type: 'divider', label: 'الطرف الأول', target: '' },
            { id: 'party1_name', type: 'text', label: 'الاسم الكامل', placeholder: 'اسم البائع / المشتري / الوسيط', half: true, target: 'firstParty.name' },
            { id: 'party1_idNumber', type: 'text', label: 'رقم الهوية', placeholder: 'أدخل رقم الهوية', half: true, target: 'firstParty.idNumber' },
            { id: 'party1_nationality', type: 'text', label: 'الجنسية', placeholder: 'الجنسية', half: true, target: 'firstParty.nationality' },
            { id: 'party1_city', type: 'text', label: 'المدينة', placeholder: 'المدينة', half: true, target: 'firstParty.city' },
            {
                id: 'party1_side', type: 'select', label: 'الصفة', half: true, target: 'firstParty.side', defaultValue: 'seller',
                options: [
                    { value: 'seller', label: 'بائع' },
                    { value: 'buyer', label: 'مشتري' },
                    { value: 'broker', label: 'وسيط' },
                    { value: 'other', label: 'أخرى' },
                ],
            },
            { id: 'party1_phone', type: 'text', label: 'رقم الجوال', placeholder: '05xxxxxxxx', dir: 'ltr', half: true, target: 'firstParty.phone' },

            { id: 'section_party2', type: 'divider', label: 'الطرف الثاني', target: '' },
            { id: 'party2_name', type: 'text', label: 'الاسم الكامل', placeholder: 'اسم البائع / المشتري / الوسيط', half: true, target: 'secondParty.name' },
            { id: 'party2_idNumber', type: 'text', label: 'رقم الهوية', placeholder: 'أدخل رقم الهوية', half: true, target: 'secondParty.idNumber' },
            { id: 'party2_nationality', type: 'text', label: 'الجنسية', placeholder: 'الجنسية', half: true, target: 'secondParty.nationality' },
            { id: 'party2_city', type: 'text', label: 'المدينة', placeholder: 'المدينة', half: true, target: 'secondParty.city' },
            {
                id: 'party2_side', type: 'select', label: 'الصفة', half: true, target: 'secondParty.side', defaultValue: 'buyer',
                options: [
                    { value: 'seller', label: 'بائع' },
                    { value: 'buyer', label: 'مشتري' },
                    { value: 'broker', label: 'وسيط' },
                    { value: 'other', label: 'أخرى' },
                ],
            },
            { id: 'party2_phone', type: 'text', label: 'رقم الجوال', placeholder: '05xxxxxxxx', dir: 'ltr', half: true, target: 'secondParty.phone' },

            { id: 'section_disputeType', type: 'divider', label: 'نوع النزاع (اختياري)', target: '' },
            {
                id: 'disputeType', type: 'select', label: 'اختر نوع النزاع', placeholder: 'اختر...', half: true, target: 'metadata.disputeType',
                options: options([
                    'نزاعات الملكية', 'عقود البيع والإيجار', 'قضايا الرهن العقاري',
                    'مخالفات البناء', 'نزع الملكية للمصلحة العامة', 'مشاكل في مشاريع التطوير',
                    'قضايا التركات العقارية', 'اخرى',
                ]),
            },
            {
                id: 'otherDisputeType', type: 'text', label: 'اكتب نوع النزاع', placeholder: 'نوع النزاع...', half: true,
                target: 'metadata.otherDisputeType',
                visibleWhen: { field: 'disputeType', equals: 'اخرى' },
            },

            { id: 'section_description', type: 'divider', label: 'وصف النزاع', target: '' },
            {
                id: 'disputeDescription', type: 'textarea', label: 'وصف النزاع',
                placeholder: 'اكتب وصفاً تفصيلياً للنزاع...', target: 'metadata.disputeDescription',
            },
            {
                id: 'documents', type: 'file', label: 'المستندات (Word, PDF, صور)',
                placeholder: 'رفع المستندات والملفات — الحد الأقصى لكل ملف: 10MB', target: '',
            },
        ],
    },

    legal_contracts: (() => {
        const notReview: VisibleWhen = { field: 'type', notEquals: 'مراجعة العقود' };
        const contractTypes = options([
            'عقد بيع', 'عقد إيجار', 'عقد الانتفاع العقاري', 'عقد الهبة العقاري',
            'عقد الرهن العقاري', 'عقد الاستثمار العقاري', 'مراجعة العقود', 'أخرى',
        ]);
        const idTypeOptions: FieldOption[] = [
            { value: 'national_id', label: 'رقم الهوية' },
            { value: 'residency', label: 'رقم الإقامة' },
            { value: 'commercial_register', label: 'السجل التجاري' },
        ];
        const partyFields = (party: 'firstParty' | 'secondParty', prefix: string, sectionLabel: string): FieldDef[] => [
            { id: `section_${prefix}`, type: 'divider', label: sectionLabel, target: '', visibleWhen: notReview },
            { id: `${prefix}_name`, type: 'text', label: 'الاسم (اسم العميل / اسم الشركة) *', placeholder: 'أدخل الاسم الكامل', target: `${party}.name`, visibleWhen: notReview },
            { id: `${prefix}_idType`, type: 'select', label: 'نوع الهوية', half: true, target: `${party}.idType`, defaultValue: 'national_id', options: idTypeOptions, visibleWhen: notReview },
            { id: `${prefix}_idNumber`, type: 'text', label: 'الهوية / الإقامة / السجل التجاري *', placeholder: 'أدخل الأرقام', half: true, target: `${party}.idNumber`, visibleWhen: notReview },
            { id: `${prefix}_nationality`, type: 'text', label: 'الجنسية', placeholder: 'الجنسية', half: true, target: `${party}.nationality`, visibleWhen: notReview },
            { id: `${prefix}_city`, type: 'text', label: 'المدينة', placeholder: 'المدينة', half: true, target: `${party}.city`, visibleWhen: notReview },
            { id: `${prefix}_phone`, type: 'text', label: 'رقم الجوال', placeholder: '05xxxxxxxx', dir: 'ltr', half: true, target: `${party}.phone`, visibleWhen: notReview },
            { id: `${prefix}_email`, type: 'text', label: 'البريد الإلكتروني', placeholder: 'example@email.com', dir: 'ltr', half: true, target: `${party}.email`, visibleWhen: notReview },
            { id: `${prefix}_nationalAddressFile`, type: 'file', label: 'العنوان الوطني', placeholder: 'رفق صورة أو PDF', target: '', visibleWhen: notReview },
            { id: `section_${prefix}_agent`, type: 'divider', label: 'بيانات الوكيل', target: '', visibleWhen: notReview },
            { id: `${prefix}_agentName`, type: 'text', label: 'اسم الوكيل', placeholder: 'اسم الوكيل بالكامل', half: true, target: `${party}.agent.name`, visibleWhen: notReview },
            { id: `${prefix}_agentAgencyNumber`, type: 'text', label: 'رقم الوكالة', placeholder: 'رقم الوكالة', half: true, target: `${party}.agent.agencyNumber`, visibleWhen: notReview },
            { id: `${prefix}_agentAgencyFile`, type: 'file', label: 'مرفق الوكالة', placeholder: 'ارفاق الوكالة (صورة أو PDF)', target: '', visibleWhen: notReview },
        ];
        return {
            version: 1,
            serviceTypeTemplate: [
                { when: { field: 'type', equals: 'مراجعة العقود' }, template: 'مراجعة عقد' },
                { when: { field: 'type', equals: 'أخرى' }, template: 'عقد - {otherType}' },
                { template: 'عقد - {type}' },
            ],
            descriptionTemplate: [
                { when: { field: 'type', equals: 'مراجعة العقود' }, template: 'طلب مراجعة عقد' },
                { template: '[{serviceType}]\n{services}' },
            ],
            fields: [
                {
                    id: 'type', type: 'select', label: 'نوع العقد', half: true,
                    target: 'metadata.type', defaultValue: 'عقد بيع', options: contractTypes,
                },
                {
                    id: 'otherType', type: 'text', label: 'اكتب نوع العقد', placeholder: 'مثلاً: عقد إدارة أملاك', half: true,
                    target: 'metadata.otherType',
                    visibleWhen: { field: 'type', equals: 'أخرى' },
                },
                { id: 'section_review', type: 'divider', label: 'باقة مراجعة العقود', target: '', visibleWhen: { field: 'type', equals: 'مراجعة العقود' } },
                {
                    id: 'contractFile', type: 'file', label: 'ارفق العقد للمراجعة',
                    placeholder: 'PDF, Word, أو صور — الحد الأقصى 20MB', target: '',
                    visibleWhen: { field: 'type', equals: 'مراجعة العقود' },
                },

                ...partyFields('firstParty', 'party1', 'بيانات الطرف الأول'),
                ...partyFields('secondParty', 'party2', 'بيانات الطرف الثاني'),

                { id: 'section_details', type: 'divider', label: 'تفاصيل العقد', target: '', visibleWhen: notReview },
                {
                    id: 'services', type: 'textarea', label: 'وصف الخدمات',
                    placeholder: 'ما هي الخدمات التي سيتم تقديمها، وما هي طبيعة الالتزامات.',
                    target: 'metadata.contractDetails.services', visibleWhen: notReview,
                },
                { id: 'duration', type: 'text', label: 'المدة الزمنية', placeholder: 'مدة العقد', half: true, target: 'metadata.contractDetails.duration', visibleWhen: notReview },
                { id: 'paymentAmount', type: 'text', label: 'تفاصيل الدفع', placeholder: 'مبلغ الدفع، طريقة الدفع، وتواريخ الاستحقاق', half: true, target: 'metadata.contractDetails.paymentAmount', visibleWhen: notReview },
                { id: 'rights', type: 'textarea', label: 'الحقوق والمسؤوليات', placeholder: 'الحقوق والواجبات لكل طرف', half: true, target: 'metadata.contractDetails.rights', visibleWhen: notReview },
                { id: 'cancellation', type: 'textarea', label: 'شروط إلغاء العقد', placeholder: 'كيفية إلغاء العقد وفسخه', half: true, target: 'metadata.contractDetails.cancellation', visibleWhen: notReview },

                { id: 'section_applicantRole', type: 'divider', label: 'صفة مقدم الطلب', target: '' },
                {
                    id: 'applicantRole', type: 'radio', label: 'صفة مقدم الطلب',
                    target: 'metadata.applicantRole', defaultValue: 'party1',
                    options: [
                        { value: 'party1', label: 'الطرف الأول' },
                        { value: 'party2', label: 'الطرف الثاني' },
                        { value: 'agent', label: 'الوكيل' },
                    ],
                },
            ],
        };
    })(),

    legal_documentation: (() => {
        const partyFields = (party: 'firstParty' | 'secondParty', prefix: string, sectionLabel: string): FieldDef[] => [
            { id: `section_${prefix}`, type: 'divider', label: sectionLabel, target: '' },
            { id: `${prefix}_name`, type: 'text', label: 'الاسم بالكامل', placeholder: 'أدخل الاسم', half: true, target: `${party}.name` },
            { id: `${prefix}_idNumber`, type: 'text', label: 'رقم الهوية', placeholder: 'أدخل رقم الهوية', half: true, target: `${party}.idNumber` },
            { id: `${prefix}_idImage`, type: 'file', label: 'صورة الهوية', placeholder: 'ارفاق صورة الهوية (يقبل كذا صيغة)', target: '' },
        ];
        return {
            version: 1,
            serviceTypeTemplate: 'توثيق',
            descriptionTemplate: 'طلب توثيق عقاري',
            fields: [
                ...partyFields('firstParty', 'party1', 'الطرف الأول'),
                ...partyFields('secondParty', 'party2', 'الطرف الثاني'),
                { id: 'section_deed', type: 'divider', label: 'صك الملكية', target: '' },
                { id: 'deedFile', type: 'file', label: 'ارفاق صك الملكية', placeholder: 'PDF أو صورة واضحة (يقبل كذا صيغة)', target: '' },
                { id: 'saleAmount', type: 'text', label: 'مبلغ البيع', placeholder: '0.00', dir: 'ltr', half: true, target: 'metadata.saleAmount' },
                { id: 'section_otherDocs', type: 'divider', label: 'مستندات أخرى', target: '' },
                { id: 'otherDocs', type: 'file', label: 'رفع مستندات إضافية', placeholder: '(يقبل كذا صيغة)', target: '' },
            ],
        };
    })(),

    legal_other: {
        version: 1,
        serviceTypeTemplate: [
            { when: { field: 'type', equals: 'أخرى' }, template: 'خدمة قانونية - {customType}' },
            { template: 'خدمة قانونية - {type}' },
        ],
        descriptionTemplate: [
            { when: { field: 'type', equals: 'استشارات قانونية' }, template: '[استشارة] {topic}' },
            { when: { field: 'type', equals: 'تقارير قانونية' }, template: '[تقرير] {name} - {propertyType}' },
            { template: '[طلب مخصص] {customType}\n{details}' },
        ],
        fields: [
            {
                id: 'type', type: 'radio', label: 'نوع الخدمة',
                target: 'metadata.type', defaultValue: 'استشارة قانونية',
                options: options(['استشارات قانونية', 'تقارير قانونية', 'أخرى']),
            },
            {
                id: 'customType', type: 'text', label: 'نوع الخدمة المخصص',
                placeholder: 'ما هي الخدمة القانونية التي تحتاجها؟',
                target: 'metadata.otherData.customType',
                visibleWhen: { field: 'type', equals: 'أخرى' },
            },
            // name/phone are not persisted today (LegalRequestFlow never maps them into the payload)
            { id: 'name', type: 'text', label: 'الاسم بالكامل', placeholder: 'أدخل اسمك', half: true, target: '' },
            {
                id: 'phone', type: 'text', label: 'رقم الجوال', placeholder: '05xxxxxxxx', dir: 'ltr', half: true, target: '',
                visibleWhen: { field: 'type', equals: 'استشارات قانونية' },
            },
            {
                id: 'topic', type: 'textarea', label: 'موضوع الاستشارة',
                placeholder: 'اكتب موضوع استشارتك هنا...',
                target: 'metadata.topic',
                visibleWhen: { field: 'type', equals: 'استشارات قانونية' },
            },
            {
                id: 'role', type: 'text', label: 'الصفة', placeholder: 'صفتك (مالك، وكيل، إلخ)', half: true,
                target: 'metadata.otherData.role',
                visibleWhen: { field: 'type', equals: 'تقارير قانونية' },
            },
            {
                id: 'propertyType', type: 'text', label: 'نوع العقار', placeholder: 'فيلا، شقة، أرض...', half: true,
                target: 'metadata.otherData.propertyType',
                visibleWhen: { field: 'type', equals: 'تقارير قانونية' },
            },
            {
                id: 'listingNumber', type: 'text', label: 'رقم العرض', placeholder: 'رقم العرض إن وجد', half: true,
                target: 'metadata.otherData.listingNumber',
                visibleWhen: { field: 'type', equals: 'تقارير قانونية' },
            },
            {
                id: 'details', type: 'textarea', label: 'تفاصيل وطلبات إضافية',
                placeholder: 'اشرح لنا حاجتك بالتفصيل...',
                target: 'metadata.details',
                visibleWhen: { field: 'type', notEquals: ['استشارات قانونية', 'تقارير قانونية'] },
            },
            { id: 'attachment', type: 'file', label: 'المرفقات (جميع الصيغ)', placeholder: 'إرفاق ملفات داعمة — يقبل جميع الصيغ', target: '' },
        ],
    },
};

export const SERVICE_FORM_CATEGORIES = Object.keys(DEFAULT_SERVICE_FORMS);
