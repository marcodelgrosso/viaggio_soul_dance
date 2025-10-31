export type UserRole = 'superadmin' | 'user';

export type UserPermission = 'travel_editor' | 'prices_editor' | 'view_statistics' | 'is_creator';

export interface UserRoleData {
  role: UserRole;
  permissions: UserPermission[];
}

