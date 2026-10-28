export function isNavActive(pathname: string, href: string, root: string) {
  if (href === "#") return false;
  if (href === root) return pathname === root;
  return pathname === href || pathname.startsWith(`${href}/`);
}
