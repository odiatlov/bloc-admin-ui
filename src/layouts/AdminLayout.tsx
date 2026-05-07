import React from 'react'
import Sidebar from '../components/Sidebar.tsx'
import Topbar from '../components/Topbar.tsx'

type Props = {
  children?: React.ReactNode
}

const AdminLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="admin-layout">
      <Topbar />
      <div className="admin-body">
        <Sidebar />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
