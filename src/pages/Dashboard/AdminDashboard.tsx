import React from 'react'

const AdminDashboard: React.FC = () => {
  return (
    <section className="dashboard">
      <h2>Admin Dashboard</h2>
      <div className="cards">
        <div className="card">Users: 124</div>
        <div className="card">Active: 87</div>
        <div className="card">Errors: 3</div>
      </div>
    </section>
  )
}

export default AdminDashboard
