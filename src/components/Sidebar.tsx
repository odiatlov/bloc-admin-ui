import React from 'react'

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <div className="brand">Bloc Admin</div>
      <nav>
        <ul>
          <li><a href="#">Dashboard</a></li>
          <li><a href="#">Users</a></li>
          <li><a href="#">Settings</a></li>
        </ul>
      </nav>
    </aside>
  )
}

export default Sidebar
