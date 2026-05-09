export type Permission = 'dashboard' | 'residents' | 'finance' | 'consumption' | 'reports' | 'settings'

export type RolePermissions = {
  [role: string]: Permission[]
}

export const rolePermissions: RolePermissions = {
  Admin: ['dashboard', 'residents', 'finance', 'consumption', 'reports', 'settings'],
  Tenant: ['dashboard', 'finance', 'consumption', 'settings'],
}

export const availableRoles = Object.keys(rolePermissions)
