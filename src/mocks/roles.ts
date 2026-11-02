export type Permission = 'dashboard' | 'blocks' | 'persons' | 'finance' | 'consumption' | 'reports' | 'settings' | 'superAdmin'

export const rolePermissions: RolePermissions = {
  None: ['dashboard'],
  SuperAdmin: ['dashboard', 'superAdmin'],
  Admin: ['dashboard', 'blocks', 'persons', 'finance', 'consumption', 'reports', 'settings'],
  Resident: ['dashboard', 'finance', 'consumption', 'settings'],
  Censor: ['dashboard', 'finance', 'consumption', 'reports'],
}

export const availableRoles = Object.keys(rolePermissions)

type RolePermissions = {
  None: Permission[]
  SuperAdmin: Permission[]
  Admin: Permission[]
  Resident: Permission[]
  Censor: Permission[]
}
