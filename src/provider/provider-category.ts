import { metadataRecord } from './provider-metadata';

const rules = [
  { category: 'legal_documentation', pattern: /توثيق|إفراغ|افراغ|notary|notarization/, metadata: 'deedInfo' },
  { category: 'legal_disputes', pattern: /منازع|نزاع|dispute/, metadata: 'disputeType' },
  { category: 'legal_contracts', pattern: /عقد|عقود|contracts/, metadata: 'contractDetails' },
];

export function providerRequestCategory(request: { category: string | null; serviceType: string; metadata?: unknown }) {
  if (request.category !== 'legal') return request.category || 'other';
  const metadata = metadataRecord(request.metadata);
  return rules.find(rule => rule.pattern.test(request.serviceType || '') || metadata[rule.metadata])?.category || 'legal_other';
}

// The same classification must run before pagination so counts and branch grants agree.
export const providerCategoryExpression = `CASE
  WHEN request.category IS DISTINCT FROM 'legal' THEN COALESCE(NULLIF(request.category::text, ''), 'other')
  ${rules.map(rule => `WHEN (COALESCE(request.serviceType, '') ~ '${rule.pattern.source}' OR
    COALESCE(request.metadata -> '${rule.metadata}', 'null'::jsonb) NOT IN ('null'::jsonb, 'false'::jsonb, '0'::jsonb, '\"\"'::jsonb)) THEN '${rule.category}'`).join('\n  ')}
  ELSE 'legal_other' END`;
