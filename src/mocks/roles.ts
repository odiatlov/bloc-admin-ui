export type Permission = 'dashboard' | 'users' | 'settings'

export type RolePermissions = {
	[role: string]: Permission[]
}

export const rolePermissions: RolePermissions = {
	Admin: ['dashboard', 'users', 'settings'],
	Tenant: ['dashboard'],
}

export const availableRoles = Object.keys(rolePermissions)
