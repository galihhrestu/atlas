function createAction() {
  return {
    id: `action-${Date.now()}-${Math.random()}`,
    action: "",
    pic: "",
    targetDate: "",
    status: "Open",
    progress: 0,
    evidence: "",
    note: ""
  };
}

function ActionPlan({ actions = [], onChange, readOnly = false }) {
  const updateAction = (id, field, value) => {
    const updated = actions.map((item) => {
      if (item.id !== id) {
        return item;
      }

      const changes = {
        ...item,
        [field]: value
      };

      if (field === "status" && value === "Completed") {
        changes.progress = 100;
      }

      if (field === "progress") {
        const numericProgress = Number(value);
        changes.progress = numericProgress;

        if (numericProgress === 100) {
          changes.status = "Completed";
        } else if (numericProgress > 0 && item.status === "Open") {
          changes.status = "In Progress";
        }
      }

      return changes;
    });

    onChange(updated);
  };

  const addAction = () => {
    onChange([...actions, createAction()]);
  };

  const removeAction = (id) => {
    onChange(actions.filter((item) => item.id !== id));
  };

  return (
    <div className="investigation-card">
      <div className="section-heading-row">
        <div>
          <h2 className="investigation-title">Corrective Action Plan</h2>
          <p className="section-helper">
            Catat tindakan, PIC, target, progres, dan bukti penyelesaian.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            className="secondary-action-button"
            onClick={addAction}
          >
            + Add Action
          </button>
        )}
      </div>

      {actions.length === 0 ? (
        <div className="empty-investigation-state">
          Belum ada corrective action.
        </div>
      ) : (
        <div className="action-plan-list">
          {actions.map((item, index) => (
            <div className="action-plan-item" key={item.id}>
              <div className="action-plan-header">
                <h3>Action {index + 1}</h3>

                {!readOnly && (
                  <button
                    type="button"
                    className="remove-action-button"
                    onClick={() => removeAction(item.id)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="investigation-form-grid">
                <div className="field-span-2">
                  <label>Corrective Action *</label>
                  <textarea
                    value={item.action}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateAction(item.id, "action", event.target.value)
                    }
                    placeholder="Tindakan yang harus dilaksanakan"
                  />
                </div>

                <div>
                  <label>PIC *</label>
                  <input
                    value={item.pic}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateAction(item.id, "pic", event.target.value)
                    }
                    placeholder="Nama penanggung jawab"
                  />
                </div>

                <div>
                  <label>Target Completion *</label>
                  <input
                    type="date"
                    value={item.targetDate}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateAction(item.id, "targetDate", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label>Status</label>
                  <select
                    value={item.status}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateAction(item.id, "status", event.target.value)
                    }
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label>Progress: {item.progress || 0}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={item.progress || 0}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateAction(item.id, "progress", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label>Evidence</label>
                  <input
                    value={item.evidence}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateAction(item.id, "evidence", event.target.value)
                    }
                    placeholder="Nama file, link, atau keterangan bukti"
                  />
                </div>

                <div>
                  <label>Progress Note</label>
                  <input
                    value={item.note}
                    disabled={readOnly}
                    onChange={(event) =>
                      updateAction(item.id, "note", event.target.value)
                    }
                    placeholder="Catatan perkembangan"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActionPlan;
