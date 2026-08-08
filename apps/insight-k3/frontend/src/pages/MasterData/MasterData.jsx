import { useState } from "react";
import { logAudit } from "../../services/auditTrail";

function MasterData() {
  const defaultData = {
    department: [
      "Plantation",
      "Nursery",
      "Wood Supply",
      "Planning",
      "HR & L&D",
      "Procurement",
      "IT",
      "FATC",
      "Sustainability",
      "GMO",
      "BCID"
    ],
    incidentType: [
      "Near Miss",
      "Unsafe Action",
      "Unsafe Condition",
      "First Aid Case",
      "Medical Treatment",
      "Lost Time Injury"
    ],
    severity: [
      "Low",
      "Medium",
      "High",
      "Critical"
    ],
    location: [
      "MO",
      "Plant Area",
      "Workshop",
      "Warehouse",
      "Office"
    ],
    unsafeAction: [
      "Not Using PPE",
      "Violation SOP",
      "Unsafe Driving",
      "Improper Handling"
    ],
    unsafeCondition: [
      "Poor Housekeeping",
      "Equipment Damage",
      "Lack of Warning Sign",
      "Unsafe Environment"
    ]
  };

  const getMasterData = () => {
    const old = JSON.parse(
      localStorage.getItem("masterData")
    );

    if (!old) {
      return defaultData;
    }

    return {
      department:
        old.department ||
        old.Department ||
        defaultData.department,
      incidentType:
        old.incidentType ||
        old["Incident Type"] ||
        defaultData.incidentType,
      severity:
        old.severity ||
        old["Severity Level"] ||
        defaultData.severity,
      location:
        old.location ||
        old["Location / Area"] ||
        defaultData.location,
      unsafeAction:
        old.unsafeAction ||
        old["Unsafe Action Category"] ||
        defaultData.unsafeAction,
      unsafeCondition:
        old.unsafeCondition ||
        old["Unsafe Condition Category"] ||
        defaultData.unsafeCondition
    };
  };

  const [masterData, setMasterData] = useState(
    getMasterData()
  );
  const [activeCategory, setActiveCategory] = useState(
    "department"
  );
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [inputValue, setInputValue] = useState("");

  const categoryName = {
    department: "Department",
    incidentType: "Incident Type",
    severity: "Severity Level",
    location: "Location / Area",
    unsafeAction: "Unsafe Action Category",
    unsafeCondition: "Unsafe Condition Category"
  };

  function saveMaster(data) {
    setMasterData(data);

    localStorage.setItem(
      "masterData",
      JSON.stringify(data)
    );
  }

  function openAdd() {
    setEditIndex(null);
    setInputValue("");
    setShowModal(true);
  }

  function openEdit(index) {
    setEditIndex(index);
    setInputValue(masterData[activeCategory][index]);
    setShowModal(true);
  }

  function saveItem() {
    const normalizedValue = inputValue.trim();

    if (!normalizedValue) {
      return;
    }

    const previousList = [
      ...masterData[activeCategory]
    ];

    const updatedList =
      editIndex === null
        ? [...previousList, normalizedValue]
        : previousList.map((item, index) =>
            index === editIndex
              ? normalizedValue
              : item
          );

    const updated = {
      ...masterData,
      [activeCategory]: updatedList
    };

    saveMaster(updated);

    if (editIndex === null) {
      logAudit({
        module: "Master Data",
        action: "CREATE",
        recordId: activeCategory,
        description: `${normalizedValue} added to ${categoryName[activeCategory]}.`,
        previousValue: previousList,
        newValue: updatedList,
        metadata: {
          category: activeCategory,
          categoryLabel: categoryName[activeCategory]
        }
      });
    } else {
      logAudit({
        module: "Master Data",
        action: "UPDATE",
        recordId: activeCategory,
        description: `${categoryName[activeCategory]} item updated.`,
        previousValue: {
          index: editIndex,
          value: previousList[editIndex]
        },
        newValue: {
          index: editIndex,
          value: normalizedValue
        },
        metadata: {
          category: activeCategory,
          categoryLabel: categoryName[activeCategory]
        }
      });
    }

    setShowModal(false);
  }

  function deleteItem(index) {
    if (!window.confirm("Delete this master data?")) {
      return;
    }

    const deletedValue =
      masterData[activeCategory][index];

    const updatedList = masterData[
      activeCategory
    ].filter((_, itemIndex) => itemIndex !== index);

    const updated = {
      ...masterData,
      [activeCategory]: updatedList
    };

    saveMaster(updated);

    logAudit({
      module: "Master Data",
      action: "DELETE",
      recordId: activeCategory,
      description: `${deletedValue} deleted from ${categoryName[activeCategory]}.`,
      previousValue: {
        index,
        value: deletedValue
      },
      newValue: null,
      metadata: {
        category: activeCategory,
        categoryLabel: categoryName[activeCategory]
      }
    });
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Master Data Management</h1>
        <p>
          Manage reference data for Digital K3 Incident
          Reporting System
        </p>
      </div>

      <div className="master-container">
        <div className="master-sidebar">
          <h3>Data Category</h3>

          {Object.keys(masterData).map((item) => (
            <button
              type="button"
              key={item}
              className={
                activeCategory === item
                  ? "active-category"
                  : ""
              }
              onClick={() => setActiveCategory(item)}
            >
              {categoryName[item]}
            </button>
          ))}
        </div>

        <div className="master-content">
          <div className="master-title">
            <h2>{categoryName[activeCategory]}</h2>

            <button
              type="button"
              className="add-button"
              onClick={openAdd}
            >
              + Add Data
            </button>
          </div>

          <div className="responsive-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Master Data</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {masterData[activeCategory].map(
                  (item, index) => (
                    <tr key={`${item}-${index}`}>
                      <td>{index + 1}</td>
                      <td>{item}</td>
                      <td>
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => openEdit(index)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() => deleteItem(index)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="master-modal">
            <h2>
              {editIndex === null
                ? "Add New Data"
                : "Edit Data"}
            </h2>

            <label>Data Name</label>

            <input
              value={inputValue}
              onChange={(event) =>
                setInputValue(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  saveItem();
                }
              }}
            />

            <div className="modal-action">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-button"
                onClick={saveItem}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterData;
