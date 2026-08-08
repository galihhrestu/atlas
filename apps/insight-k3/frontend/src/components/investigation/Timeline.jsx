function Timeline({ incident }) {
  const timeline = incident?.timeline || [];

  return (
    <div className="investigation-card">
      <h2 className="investigation-title">Incident Timeline</h2>

      <div className="investigation-timeline">
        <div className="investigation-timeline-item complete">
          <div className="timeline-marker">✓</div>
          <div>
            <h4>Report Submitted</h4>
            <p>
              {incident?.createdAt
                ? new Date(incident.createdAt).toLocaleString("id-ID")
                : incident?.date || "-"}
            </p>
          </div>
        </div>

        {timeline.map((item, index) => (
          <div
            className="investigation-timeline-item complete"
            key={`${item.step}-${item.createdAt || index}`}
          >
            <div className="timeline-marker">✓</div>
            <div>
              <h4>{item.step}</h4>
              <p>
                {item.date || ""} {item.time || ""}
                {item.by ? ` · ${item.by}` : ""}
              </p>
            </div>
          </div>
        ))}

        <div className="investigation-timeline-item current">
          <div className="timeline-marker">•</div>
          <div>
            <h4>Current Status</h4>
            <p>{incident?.status || "-"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timeline;
