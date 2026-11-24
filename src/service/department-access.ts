import { Role, User } from "../user/user-entity";
export function departmentAccess(
  user: User,
  department: string,
  write = false,
): boolean {
  if (user.role === Role.ADMIN) return true;
  const permission = user.departmentPermissions?.[department];
  if (permission === false || permission === "none") return false;
  if (permission === "view") return !write;
  if (permission === true || permission === "manage") return true;
  const roleDepartments: Partial<Record<Role, string>> = {
    [Role.LEGAL]: "legal",
    [Role.LEGAL_ADMIN]: "legal",
    [Role.MARKETING]: "marketing",
    [Role.MARKETING_ADMIN]: "marketing",
    [Role.FINANCE]: "finance",
    [Role.FINANCE_ADMIN]: "finance",
  };
  return (
    (user.departments || []).includes(department as never) ||
    roleDepartments[user.role] === department
  );
}
