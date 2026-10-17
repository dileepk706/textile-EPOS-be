export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  STAFF = 'STAFF',
}

export type RoleType = UserRole | 'ADMIN' | 'OWNER' | 'MANAGER' | 'CASHIER' | 'STAFF' | string;

export const ADMIN_ROLES = [UserRole.ADMIN, UserRole.OWNER];
export const MANAGEMENT_ROLES = [UserRole.ADMIN, UserRole.OWNER, UserRole.MANAGER];
export const ALL_STAFF_ROLES = [
  UserRole.ADMIN,
  UserRole.OWNER,
  UserRole.MANAGER,
  UserRole.CASHIER,
  UserRole.STAFF,
];
