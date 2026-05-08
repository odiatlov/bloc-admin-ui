import React from 'react'

export type Role = 'Admin' | 'Tenant'

type RoleContextType = {
  role: Role
  setRole: (r: Role) => void
}

export const RoleContext = React.createContext<RoleContextType>({
  role: 'Admin',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setRole: () => {},
})

export const RoleProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [role, setRole] = React.useState<Role>('Admin')

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
}

export default RoleProvider
