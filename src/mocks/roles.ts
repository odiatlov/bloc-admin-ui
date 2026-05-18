export type Permission = 'dashboard' | 'blocks' | 'residents' | 'finance' | 'consumption' | 'reports' | 'settings'

export const rolePermissions: RolePermissions = {
  SuperAdmin: ['dashboard', 'blocks', 'residents', 'finance', 'consumption', 'reports', 'settings'],
  Admin: ['dashboard', 'blocks', 'residents', 'finance', 'consumption', 'reports', 'settings'],
  Resident: ['dashboard', 'finance', 'consumption', 'settings'],
  Censor: ['dashboard', 'finance', 'consumption', 'reports'],
}

export const availableRoles = Object.keys(rolePermissions)

type RolePermissions = {
  SuperAdmin: Permission[]
  Admin: Permission[]
  Resident: Permission[]
  Censor: Permission[]
}
