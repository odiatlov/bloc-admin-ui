import React from 'react'

export type Role = 'Admin' | 'Resident' | 'Censor'

type RoleContextType = {
  role: Role
  setRole: (r: Role) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const RoleContext = React.createContext<RoleContextType>({
  role: 'Admin',
  setRole: () => undefined,
})

export const RoleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [role, setRole] = React.useState<Role>('Admin')

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
}

export default RoleProvider
