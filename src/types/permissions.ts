export type UserRole = 'platform_superadmin' | 'platform_user';

export type UserPermission =
  | 'perm_manage_travel'
  | 'perm_manage_budget'
  | 'perm_view_statistics'
  | 'perm_create_adventures';

export interface UserRoleData {
  role: UserRole;
  permissions: UserPermission[];
}

