import { BadRequestException } from "@nestjs/common";
export interface ProviderSpecialization {
  id: string;
  title: string;
  categories: string[];
  enabled: boolean;
}
export function providerSpecializations(
  value: unknown,
): ProviderSpecialization[] {
  if (!Array.isArray(value) || value.length > 50)
    throw new BadRequestException("Invalid provider specializations");
  const ids = new Set<string>();
  return value.map((raw) => {
    if (!raw || typeof raw !== "object")
      throw new BadRequestException("Invalid provider specialization");
    const row = raw as Record<string, unknown>;
    if (
      typeof row.id !== "string" ||
      !/^[a-z][a-z0-9_-]{0,79}$/.test(row.id) ||
      ids.has(row.id) ||
      typeof row.title !== "string" ||
      !row.title.trim() ||
      row.title.length > 100 ||
      typeof row.enabled !== "boolean" ||
      !Array.isArray(row.categories) ||
      row.categories.length > 30 ||
      row.categories.some(
        (c) =>
          typeof c !== "string" || !/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(c),
      )
    )
      throw new BadRequestException("Invalid provider specialization");
    ids.add(row.id);
    return {
      id: row.id,
      title: row.title.trim(),
      categories: [...new Set(row.categories)] as string[],
      enabled: row.enabled,
    };
  });
}
export interface ProviderRegistrationField {
  id: string;
  label: string;
  required: boolean;
  enabled: boolean;
  type: "text" | "textarea" | "number";
  categories: string[];
}
export function providerRegistrationFields(
  value: unknown,
): ProviderRegistrationField[] {
  if (!Array.isArray(value) || value.length > 30)
    throw new BadRequestException("Invalid provider registration fields");
  const ids = new Set<string>();
  return value.map((raw) => {
    if (!raw || typeof raw !== "object")
      throw new BadRequestException("Invalid provider registration field");
    const row = raw as Record<string, unknown>;
    if (
      typeof row.id !== "string" ||
      !/^[a-z][a-z0-9_-]{0,79}$/.test(row.id) ||
      ["constructor", "prototype"].includes(row.id) ||
      ids.has(row.id) ||
      typeof row.label !== "string" ||
      !row.label.trim() ||
      row.label.length > 100 ||
      typeof row.enabled !== "boolean" ||
      typeof row.required !== "boolean" ||
      !["text", "textarea", "number"].includes(String(row.type)) ||
      !Array.isArray(row.categories) ||
      row.categories.length > 30 ||
      row.categories.some(
        (c) =>
          typeof c !== "string" || !/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(c),
      )
    )
      throw new BadRequestException("Invalid provider registration field");
    ids.add(row.id);
    return {
      id: row.id,
      label: row.label.trim(),
      type: row.type as ProviderRegistrationField["type"],
      enabled: row.enabled,
      required: row.required,
      categories: [...new Set(row.categories)] as string[],
    };
  });
}
