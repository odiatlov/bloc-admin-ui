export type Permission = 'dashboard' | 'residents' | 'finance' | 'consumption' | 'reports' | 'settings'

export const rolePermissions: RolePermissions = {
  Admin: ['dashboard', 'residents', 'finance', 'consumption', 'reports', 'settings'],
  Resident: ['dashboard', 'finance', 'consumption', 'settings'],
}

export const availableRoles = Object.keys(rolePermissions)

type RolePermissions = {
  Admin: Permission[]
  Resident: Permission[]
}
