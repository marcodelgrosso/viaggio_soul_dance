export type UserRole = 'superadmin' | 'user';

export type UserPermission = 'travel_editor' | 'prices_editor' | 'view_statistics';

export interface UserRoleData {
  role: UserRole;
  permissions: UserPermission[];
}

