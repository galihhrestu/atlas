import { ShieldCheck, UserCheck, UserCog, UsersRound } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { KpiCard } from '../components/ui/KpiCard'
import { PageHeader } from '../components/ui/PageHeader'
import { SectionCard } from '../components/ui/SectionCard'
import { useAppData } from '../context/AppDataContext'
import { formatDateTime, labelize } from '../services/format'
import type { AppUser, UserRole } from '../types'

export function AdminUsersPage() {
  const { users, updateUser } = useAppData()

  const changeRole = (user: AppUser, role: UserRole) => updateUser({ ...user, role })
  const toggleStatus = (user: AppUser) => updateUser({ ...user, status: user.status === 'active' ? 'inactive' : 'active' })

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="ACCESS GOVERNANCE"
        title="User Management"
        description="Manage the two SIGMA access levels: authorized users for monitoring and reporting, and SSL administrators for operational data management."
      />

      <div className="kpi-grid kpi-grid--four">
        <KpiCard label="Total Accounts" value={users.length} detail="Prototype access records" icon={UsersRound} accent="gold" />
        <KpiCard label="Authorized Users" value={users.filter((item) => item.role === 'user').length} detail="Read, monitor, filter, and export" icon={UserCheck} accent="cyan" />
        <KpiCard label="SSL Administrators" value={users.filter((item) => item.role === 'admin').length} detail="Data entry, validation, and management" icon={ShieldCheck} accent="orange" />
        <KpiCard label="Active Accounts" value={users.filter((item) => item.status === 'active').length} detail="Currently allowed to access SIGMA" icon={UserCog} accent="green" />
      </div>

      <SectionCard title="Account Directory" subtitle="Changes are stored in local browser data for this prototype.">
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>User</th><th>Department</th><th>Title</th><th>Access Role</th><th>Status</th><th>Last Access</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><div className="user-cell"><span>{user.name.split(' ').map((item) => item[0]).join('').slice(0, 2)}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div></td>
                  <td>{user.department}</td>
                  <td>{user.title}</td>
                  <td><select className="table-select" value={user.role} onChange={(event) => changeRole(user, event.target.value as UserRole)}><option value="user">Authorized User</option><option value="admin">SSL Administrator</option></select></td>
                  <td><Badge tone={user.status === 'active' ? 'success' : 'neutral'}>{labelize(user.status)}</Badge></td>
                  <td>{formatDateTime(user.lastAccess)}</td>
                  <td><button className="button button--small button--secondary" onClick={() => toggleStatus(user)}>{user.status === 'active' ? 'Deactivate' : 'Activate'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Role Boundary" subtitle="The access model is intentionally simple and clear.">
        <div className="role-boundary-grid">
          <article><span><UserCheck size={23} /></span><div><h3>Authorized User</h3><p>Management or appointed users can view, monitor, filter, review historical data, and create PDF or Excel reports. They cannot change official operational records.</p></div></article>
          <article><span><ShieldCheck size={23} /></span><div><h3>SSL Administrator</h3><p>SSL administrators can enter patrol data, register and update assets, record findings, validate field evidence, and govern the records that contribute to official KPI.</p></div></article>
        </div>
      </SectionCard>
    </div>
  )
}
