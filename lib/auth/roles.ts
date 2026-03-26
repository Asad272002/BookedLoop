export type Role = "admin" | "manager" | "caller";

export function canAccess(pathname: string, role: Role) {
  if (role === "admin") return true;
  if (role === "manager") {
    if (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/settings")) return false;
    return true;
  }
  if (role === "caller") {
    if (pathname.startsWith("/admin/calls")) return true;
    if (pathname.startsWith("/admin/leads")) return true;
    if (pathname === "/admin") return true;
    return false;
  }
  return false;
}
