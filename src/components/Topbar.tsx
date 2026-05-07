import React from 'react'

const Topbar: React.FC = () => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" aria-label="Toggle menu">☰</button>
        <h1 className="app-title">Admin</h1>
      </div>
      <div className="topbar-right">
        <input aria-label="Search" placeholder="Search..." />
        <button>Profile</button>
      </div>
    </header>
  )
}

export default Topbar
