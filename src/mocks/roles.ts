export type Permission = 'dashboard' | 'tenants' | 'settings'

export type RolePermissions = {
	[role: string]: Permission[]
}

export const rolePermissions: RolePermissions = {
	Admin: ['dashboard', 'tenants', 'settings'],
	Tenant: ['dashboard'],
}

export const availableRoles = Object.keys(rolePermissions)
