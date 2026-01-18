export type AccessLevel = 'admin' | 'member' | 'guest';

const ACCESS_RANKS: Record<AccessLevel, number> = {
  guest: 0,
  member: 1,
  admin: 2,
};

function accessRank(level: AccessLevel | null | undefined): number {
  if (!level) return ACCESS_RANKS.guest;
  return ACCESS_RANKS[level] ?? ACCESS_RANKS.guest;
}

export function hasElevatedAccess(
  userAccessLevel: AccessLevel | null | undefined,
  elevatedAccessLevel: AccessLevel | null | undefined
): boolean {
  return accessRank(userAccessLevel) >= accessRank(elevatedAccessLevel);
}

export const PROTECTED_PATHS = ['/explorer', '/user-settings', '/manage-users'];
