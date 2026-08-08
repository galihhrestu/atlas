import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listIncidentsRequest } from "../../services/incidentService";

function UserDashboard() {
  const navigate = useNavigate();
  const { user, authFetch } = useAuth();

  const [showReport, setShowReport] = useState(false);
  const [myReports, setMyReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        const response = await listIncidentsRequest(authFetch, {
          limit: 100
        });

        if (active) {
          setMyReports(response.data || []);
        }
      } catch (error) {
        console.error("Gagal mengambil laporan:", error);
      } finally {
        if (active) {
          setLoadingReports(false);
        }
      }
    }

    if (user) {
      loadReports();
    }

    return () => {
      active = false;
    };
  }, [authFetch, user]);

  return (
    <div className="dashboard-page">

      <h1 className="dashboard-title">
        User Dashboard
      </h1>

      <p className="page-subtitle">
        Safety Reporting Portal
      </p>

      <div className="dashboard-grid">

        <div className="action-card report-card">
          <div className="card-icon danger">
            <span>!</span>
          </div>

          <div className="card-content">
            <h2>Report Incident</h2>

            <p>
              Report unsafe action, unsafe condition,
              near miss, or safety incident.
            </p>

            <button
              className="primary-action"
              onClick={() => navigate("/create-incident")}
            >
              Create Report
            </button>
          </div>
        </div>


        <div
          className="action-card"
          onClick={() => setShowReport(true)}
          style={{ cursor: "pointer" }}
        >

          <div className="card-icon blue">
            <span>▤</span>
          </div>

          <div className="card-content">
            <h2>My Report</h2>

            <div className="number">
              {loadingReports ? "..." : myReports.length}
            </div>

            <p>
              Submitted incident report
            </p>
          </div>

        </div>

      </div>


      {showReport && (
        <div className="modal-overlay">

          <div className="modal-box">

            <h2>
              My Incident Report
            </h2>

            {myReports.map((item) => (
              <div
                className="report-item"
                key={item.databaseId || item.id}
              >
                <h3>
                  {item.incidentCode || item.id}
                </h3>

                <p>
                  {item.description}
                </p>

                <p>
                  Status: {item.status}
                </p>
              </div>
            ))}

            <button
              className="primary-action"
              onClick={() => setShowReport(false)}
            >
              Close
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default UserDashboard;
