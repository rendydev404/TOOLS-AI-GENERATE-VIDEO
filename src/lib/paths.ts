// Path helpers kept free of heavy imports so the landing page can use them
// without pulling the prompt director into its bundle.
export const APP_BASE = import.meta.env.BASE_URL || '/';
export const IS_MEMBER_EMBED = APP_BASE.startsWith('/member/');

export function resolveAssetUrl(assetPath: string): string {
  if (!assetPath || /^https?:\/\//i.test(assetPath) || assetPath.startsWith('data:') || assetPath.startsWith('blob:')) {
    return assetPath;
  }
  const cleanBase = APP_BASE.endsWith('/') ? APP_BASE : `${APP_BASE}/`;
  return `${cleanBase}${assetPath.replace(/^\/+/, '')}`;
}
