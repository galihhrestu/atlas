function Approval({
  incident,
  note,
  onNoteChange,
  onReturn,
  onClose
}) {
  const review = incident.managementReview || {};
  const canReview = incident.status === "Management Review";

  return (
    <div className="investigation-card management-approval-card">
      <h2 className="investigation-title">Management Review</h2>

      <div className="review-summary-grid">
        <div>
          <span>Review Status</span>
          <strong>{review.status || "Waiting Review"}</strong>
        </div>

        <div>
          <span>Reviewed By</span>
          <strong>{review.reviewedBy || "-"}</strong>
        </div>

        <div>
          <span>Reviewed At</span>
          <strong>
            {review.reviewedAt
              ? new Date(review.reviewedAt).toLocaleString("id-ID")
              : "-"}
          </strong>
        </div>
      </div>

      {review.note && (
        <div className="management-note-box">
          <strong>Management Note</strong>
          <p>{review.note}</p>
        </div>
      )}

      {canReview && (
        <>
          <label className="management-note-label">
            Management Review Note
          </label>
          <textarea
            className="management-note-input"
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Tuliskan catatan review, alasan revisi, atau catatan penutupan"
          />

          <div className="management-review-actions">
            <button
              type="button"
              className="return-revision-button"
              onClick={onReturn}
            >
              Return for Revision
            </button>

            <button
              type="button"
              className="close-incident-button"
              onClick={onClose}
            >
              Approve & Close Incident
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Approval;
