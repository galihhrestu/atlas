import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Sidebar({ open, close }) {
  const { user } = useAuth();
  const role = user?.role;

  return (
    <aside className={open ? "sidebar active" : "sidebar"}>
      <div className="sidebar-menu">
        {/* USER MENU */}
        {role === "user" && (
          <>
            <h4>REPORTING</h4>

            <NavLink to="/user-dashboard" onClick={close}>
              Dashboard
            </NavLink>

            <NavLink to="/report" onClick={close}>
              Create Report
            </NavLink>
          </>
        )}

        {/* OPERATOR MENU */}
        {role === "operator" && (
          <>
            <h4>OPERATION</h4>

            <NavLink to="/operator-dashboard" onClick={close}>
              Dashboard
            </NavLink>

            <NavLink to="/incident" onClick={close}>
              Incident Registry
            </NavLink>

            <NavLink to="/investigation-monitoring" onClick={close}>
              Investigation Monitoring
            </NavLink>

            <NavLink to="/master-data" onClick={close}>
              Master Data
            </NavLink>
          </>
        )}

        {/* MANAGEMENT MENU */}
        {role === "management" && (
          <>
            <h4>MANAGEMENT</h4>

            <NavLink to="/management-dashboard" onClick={close}>
              Dashboard
            </NavLink>

            <NavLink to="/incident" onClick={close}>
              Incident Investigation
            </NavLink>

            <NavLink to="/analytics" onClick={close}>
              Analytics
            </NavLink>

            <NavLink to="/audit-trail" onClick={close}>
              Audit Trail
            </NavLink>
          </>
        )}

        {/* ADMIN MENU */}
        {role === "admin" && (
          <>
            <h4>ADMINISTRATION</h4>

            <NavLink to="/management-dashboard" onClick={close}>
              Dashboard
            </NavLink>

            <NavLink to="/incident" onClick={close}>
              Incident Investigation
            </NavLink>

            <NavLink to="/investigation-monitoring" onClick={close}>
              Investigation Monitoring
            </NavLink>

            <NavLink to="/analytics" onClick={close}>
              Analytics
            </NavLink>

            <NavLink to="/master-data" onClick={close}>
              Master Data
            </NavLink>

            <NavLink to="/users" onClick={close}>
              User Management
            </NavLink>

            <NavLink to="/audit-trail" onClick={close}>
              Audit Trail
            </NavLink>

            <NavLink to="/settings" onClick={close}>
              Settings
            </NavLink>
          </>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
