import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createIncidentRequest } from "../../services/incidentService";
import { addIncident } from "../../services/incidentStorage";

const ESTATES = ["MO", "Terunen", "Sepaku", "Senoni"];

const LOCATION_TYPES = [
  { value: "BLOCK_COMPARTMENT", label: "Block / Compartment Area" },
  { value: "HAULING_ROAD", label: "Hauling Road" },
  { value: "COMPARTMENT_ROAD", label: "Compartment Road" }
];

const BLOCK_OPTIONS = Array.from({ length: 26 }, (_, index) =>
  String.fromCharCode(65 + index)
);

const ROOT_CAUSE_GROUPS = [
  {
    label: "Human Factor",
    options: [
      "Lalai terhadap safety",
      "Tidak menggunakan APD",
      "Kurang awareness terhadap bahaya",
      "Tergesa-gesa / mengambil shortcut",
      "Kelelahan / fatigue"
    ]
  },
  {
    label: "Procedure / SOP",
    options: [
      "SOP tidak dipatuhi",
      "SOP tidak tersedia / tidak memadai",
      "Instruksi kerja tidak jelas"
    ]
  },
  {
    label: "Competency",
    options: [
      "Kurang pelatihan",
      "Kurang pengalaman / kompetensi"
    ]
  },
  {
    label: "Supervision / Management",
    options: [
      "Pengawasan kurang",
      "Perencanaan kerja kurang",
      "Komunikasi / koordinasi kurang"
    ]
  },
  {
    label: "Equipment / Tools",
    options: [
      "Kerusakan alat",
      "Alat tidak sesuai",
      "Perawatan alat kurang"
    ]
  },
  {
    label: "Environment / Worksite",
    options: [
      "Kondisi jalan",
      "Geografis / kondisi medan",
      "Cuaca",
      "Pencahayaan kurang",
      "Housekeeping buruk"
    ]
  },
  {
    label: "Other",
    options: ["Lainnya / belum terklasifikasi"]
  }
];

const defaultMaster = {
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
  severity: ["Low", "Medium", "High", "Critical"],
  unsafeAction: ["Not Using PPE", "SOP Violation"],
  unsafeCondition: ["Poor Housekeeping", "Equipment Damage"]
};

function getMasterData() {
  try {
    const saved = JSON.parse(localStorage.getItem("masterData"));

    if (!saved) {
      return defaultMaster;
    }

    return {
      department: saved.department || defaultMaster.department,
      incidentType: saved.incidentType || defaultMaster.incidentType,
      severity: saved.severity || defaultMaster.severity,
      unsafeAction: saved.unsafeAction || defaultMaster.unsafeAction,
      unsafeCondition:
        saved.unsafeCondition || defaultMaster.unsafeCondition
    };
  } catch (error) {
    console.warn("Master data browser tidak dapat dibaca:", error);
    return defaultMaster;
  }
}

const initialForm = {
  date: "",
  time: "",
  estate: "",
  locationType: "",
  block: "",
  compartment: "",
  haulingRoad: "",
  compartmentRoad: "",
  locationDetail: "",
  department: "",
  type: "",
  severity: "Low",
  object: "",
  description: "",
  unsafeAction: "",
  sop: "",
  unsafeCondition: "",
  factor: "",
  rootCauseCategory: "",
  rootCause: "",
  actionPlan: "",
  pic: "",
  target: "",
  file: ""
};

function toOptionalText(value) {
  const cleaned = String(value || "").trim();
  return cleaned || null;
}

function toSopViolation(value) {
  if (value === "Yes") {
    return true;
  }

  if (value === "No") {
    return false;
  }

  return null;
}

function buildIncidentDate(date, time) {
  const localDate = new Date(`${date}T${time || "00:00"}:00`);

  if (Number.isNaN(localDate.getTime())) {
    throw new Error("Tanggal atau waktu incident tidak valid.");
  }

  return localDate.toISOString();
}

function buildLocationLabel(form) {
  const detail = form.locationDetail.trim();

  if (form.estate === "MO") {
    return detail ? `MO - ${detail}` : "MO";
  }

  if (form.locationType === "BLOCK_COMPARTMENT") {
    const base = `${form.estate} - ${form.block}${form.compartment}`;
    return detail ? `${base} - ${detail}` : base;
  }

  if (form.locationType === "HAULING_ROAD") {
    const base = `${form.estate} - Hauling Road ${form.haulingRoad.trim()}`;
    return detail ? `${base} - ${detail}` : base;
  }

  if (form.locationType === "COMPARTMENT_ROAD") {
    const base = `${form.estate} - ${form.block}${form.compartment} - Compartment Road ${form.compartmentRoad.trim()}`;
    return detail ? `${base} - ${detail}` : base;
  }

  return form.estate;
}

function validateLocation(form) {
  if (!form.estate) {
    return "Please select an estate.";
  }

  if (form.estate === "MO") {
    return "";
  }

  if (!form.locationType) {
    return "Please select the incident area type.";
  }

  if (form.locationType === "HAULING_ROAD") {
    if (!form.haulingRoad.trim()) {
      return "Please enter the hauling road name or code.";
    }

    return "";
  }

  if (!form.block || !form.compartment) {
    return "Please complete block and compartment information.";
  }

  if (
    form.locationType === "COMPARTMENT_ROAD" &&
    !form.compartmentRoad.trim()
  ) {
    return "Please enter the compartment road number or code.";
  }

  return "";
}

function CreateIncident() {
  const navigate = useNavigate();
  const { authFetch, user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const master = getMasterData();

  const locationLabel = useMemo(() => buildLocationLabel(form), [form]);

  function handleChange(event) {
    const { name, value, files } = event.target;

    setForm((current) => {
      const next = {
        ...current,
        [name]: files ? files[0]?.name || "" : value
      };

      if (name === "estate") {
        next.locationType = value === "MO" ? "MO" : "";
        next.block = "";
        next.compartment = "";
        next.haulingRoad = "";
        next.compartmentRoad = "";
        next.locationDetail = "";
      }

      if (name === "locationType") {
        next.block = "";
        next.compartment = "";
        next.haulingRoad = "";
        next.compartmentRoad = "";
      }

      if (name === "block") {
        next.block = value.toUpperCase();
      }

      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError("");

    const locationError = validateLocation(form);

    if (locationError) {
      setSubmitError(locationError);
      return;
    }

    if (
      !form.date ||
      !form.department ||
      !form.type ||
      !form.description.trim()
    ) {
      setSubmitError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      const normalizedLocation = buildLocationLabel(form);
      const payload = {
        incidentDate: buildIncidentDate(form.date, form.time),
        location: normalizedLocation,
        estate: form.estate,
        locationType: form.estate === "MO" ? "MO" : form.locationType,
        block: toOptionalText(form.block),
        compartment: toOptionalText(form.compartment),
        haulingRoad: toOptionalText(form.haulingRoad),
        compartmentRoad: toOptionalText(form.compartmentRoad),
        locationDetail: toOptionalText(form.locationDetail),
        department: form.department,
        type: form.type,
        severity: form.severity.toUpperCase(),
        objectInvolved: toOptionalText(form.object),
        description: form.description.trim(),
        unsafeAction: toOptionalText(form.unsafeAction),
        sopViolation: toSopViolation(form.sop),
        unsafeCondition: toOptionalText(form.unsafeCondition),
        contributingFactor: toOptionalText(form.factor),
        rootCauseCategory: toOptionalText(form.rootCauseCategory),
        initialRootCause: toOptionalText(form.rootCause),
        initialActionPlan: toOptionalText(form.actionPlan),
        initialPic: toOptionalText(form.pic),
        initialTargetDate: form.target || null
      };

      const response = await createIncidentRequest(authFetch, payload);
      const savedIncident = response.data.incident;

      const legacyIncident = {
        id: savedIncident.incidentCode,
        databaseId: savedIncident.id,
        reporter: savedIncident.reporter?.username || user?.username || "Unknown",
        date: form.date,
        time: form.time,
        location: savedIncident.location || normalizedLocation,
        estate: savedIncident.estate || form.estate,
        locationType:
          savedIncident.locationType ||
          (form.estate === "MO" ? "MO" : form.locationType),
        block: savedIncident.block || form.block,
        compartment: savedIncident.compartment || form.compartment,
        haulingRoad: savedIncident.haulingRoad || form.haulingRoad,
        compartmentRoad:
          savedIncident.compartmentRoad || form.compartmentRoad,
        locationDetail: savedIncident.locationDetail || form.locationDetail,
        department: form.department,
        type: form.type,
        severity: form.severity,
        object: form.object,
        description: form.description.trim(),
        unsafeAction: form.unsafeAction,
        sop: form.sop,
        unsafeCondition: form.unsafeCondition,
        factor: form.factor,
        rootCauseCategory: form.rootCauseCategory,
        rootCause: form.rootCause,
        actionPlan: form.actionPlan,
        pic: form.pic,
        target: form.target,
        file: form.file,
        status: "Pending",
        approvalBy: "",
        investigationNote: "",
        correctiveStatus: "",
        createdAt: savedIncident.createdAt
      };

      try {
        addIncident(legacyIncident, {
          action: "CREATE",
          module: "Incident",
          description: `Incident ${savedIncident.incidentCode} submitted by ${legacyIncident.reporter}.`,
          metadata: {
            source: "PostgreSQL",
            databaseId: savedIncident.id,
            severity: legacyIncident.severity,
            type: legacyIncident.type,
            estate: legacyIncident.estate,
            locationType: legacyIncident.locationType,
            location: legacyIncident.location,
            department: legacyIncident.department,
            rootCauseCategory: legacyIncident.rootCauseCategory
          }
        });
      } catch (storageError) {
        console.warn(
          "Incident sudah tersimpan di PostgreSQL, tetapi salinan browser gagal dibuat:",
          storageError
        );
      }

      window.alert(
        `Incident report submitted successfully.\nIncident Code: ${savedIncident.incidentCode}`
      );
      navigate("/user-dashboard");
    } catch (error) {
      setSubmitError(error.message || "Incident report could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  const showBlockFields =
    form.estate !== "MO" &&
    ["BLOCK_COMPARTMENT", "COMPARTMENT_ROAD"].includes(form.locationType);
  const showHaulingRoad =
    form.estate !== "MO" && form.locationType === "HAULING_ROAD";
  const showCompartmentRoad =
    form.estate !== "MO" && form.locationType === "COMPARTMENT_ROAD";

  return (
    <div className="incident-form-page">
      <div className="form-header">
        <h1>🔴 Digital K3 Incident Reporting</h1>
        <p>Submit workplace safety incident report</p>
      </div>

      <form className="incident-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h2>👤 1. General Information</h2>

          <div className="form-grid">
            <div>
              <label>Date of Incident *</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label>Time of Incident</label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>Estate *</label>
              <select
                name="estate"
                value={form.estate}
                onChange={handleChange}
                required
              >
                <option value="">Select Estate</option>
                {ESTATES.map((estate) => (
                  <option key={estate} value={estate}>
                    {estate}
                  </option>
                ))}
              </select>
            </div>

            {form.estate && form.estate !== "MO" ? (
              <div>
                <label>Incident Area Type *</label>
                <select
                  name="locationType"
                  value={form.locationType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Area Type</option>
                  {LOCATION_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {showBlockFields ? (
              <>
                <div>
                  <label>Block *</label>
                  <select
                    name="block"
                    value={form.block}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Block</option>
                    {BLOCK_OPTIONS.map((block) => (
                      <option key={block} value={block}>
                        {block}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Compartment *</label>
                  <input
                    type="number"
                    name="compartment"
                    min="1"
                    max="999"
                    step="1"
                    value={form.compartment}
                    placeholder="Example: 10"
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            ) : null}

            {showHaulingRoad ? (
              <div>
                <label>Hauling Road *</label>
                <input
                  name="haulingRoad"
                  value={form.haulingRoad}
                  maxLength={80}
                  placeholder="Road name / code"
                  onChange={handleChange}
                  required
                />
              </div>
            ) : null}

            {showCompartmentRoad ? (
              <div>
                <label>Compartment Road No. *</label>
                <input
                  name="compartmentRoad"
                  value={form.compartmentRoad}
                  maxLength={50}
                  placeholder="Example: 2"
                  onChange={handleChange}
                  required
                />
              </div>
            ) : null}

            {form.estate ? (
              <div>
                <label>
                  {form.estate === "MO"
                    ? "MO Location Detail"
                    : "Additional Location Detail"}
                </label>
                <input
                  name="locationDetail"
                  value={form.locationDetail}
                  maxLength={80}
                  placeholder={
                    form.estate === "MO"
                      ? "Example: Main office parking area"
                      : "Optional landmark / field detail"
                  }
                  onChange={handleChange}
                />
              </div>
            ) : null}

            <div>
              <label>Department / Unit *</label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                required
              >
                <option value="">Select Department</option>
                {master.department.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.estate ? (
            <div className="location-summary-card">
              <span>Location saved as</span>
              <strong>{locationLabel || "Complete the location fields"}</strong>
              <small>
                Estate, block, compartment, and road information are also stored
                separately so they can be filtered and analyzed later.
              </small>
            </div>
          ) : null}
        </section>

        <section className="form-section">
          <h2>⚠️ 2. Incident Information</h2>

          <div className="form-grid">
            <div>
              <label>Incident Type *</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                required
              >
                <option value="">Select Type</option>
                {master.incidentType.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Severity</label>
              <select
                name="severity"
                value={form.severity}
                onChange={handleChange}
              >
                {master.severity.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Object Involved</label>
              <input
                name="object"
                value={form.object}
                placeholder="Equipment/Object"
                onChange={handleChange}
              />
            </div>
          </div>

          <label>Incident Description *</label>
          <textarea
            name="description"
            value={form.description}
            placeholder="Describe what happened"
            onChange={handleChange}
            required
          />
        </section>

        <section className="form-section">
          <h2>🔎 3. Initial Analysis / Root Cause</h2>

          <div className="form-grid">
            <div>
              <label>Unsafe Action</label>
              <select
                name="unsafeAction"
                value={form.unsafeAction}
                onChange={handleChange}
              >
                <option value="">Select</option>
                {master.unsafeAction.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>SOP Violation</label>
              <select name="sop" value={form.sop} onChange={handleChange}>
                <option value="">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div>
              <label>Unsafe Condition</label>
              <select
                name="unsafeCondition"
                value={form.unsafeCondition}
                onChange={handleChange}
              >
                <option value="">Select</option>
                {master.unsafeCondition.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Contributing Factor</label>
              <input
                name="factor"
                value={form.factor}
                onChange={handleChange}
              />
            </div>

            <div className="form-field-wide">
              <label>Primary Root Cause Category</label>
              <select
                name="rootCauseCategory"
                value={form.rootCauseCategory}
                onChange={handleChange}
              >
                <option value="">Select standardized category</option>
                {ROOT_CAUSE_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <small className="field-hint">
                This standardized category is used for Pareto, filtering, and
                management analytics. The description below remains free text.
              </small>
            </div>
          </div>

          <label>Root Cause Description</label>
          <textarea
            name="rootCause"
            value={form.rootCause}
            placeholder="Describe the specific context and why the root cause occurred"
            onChange={handleChange}
          />
        </section>

        <section className="form-section">
          <h2>🛡️ 4. Corrective Action</h2>

          <div className="form-grid">
            <div>
              <label>Action Plan</label>
              <textarea
                name="actionPlan"
                value={form.actionPlan}
                onChange={handleChange}
              />
            </div>

            <div>
              <label>PIC</label>
              <input name="pic" value={form.pic} onChange={handleChange} />
            </div>

            <div>
              <label>Target Completion</label>
              <input
                type="date"
                name="target"
                value={form.target}
                onChange={handleChange}
              />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h2>📎 5. Documentation</h2>
          <input type="file" name="file" onChange={handleChange} />
          <small>
            File upload will be connected to server storage in a later step.
          </small>
        </section>

        {submitError ? (
          <p role="alert" style={{ color: "#b91c1c", fontWeight: 600 }}>
            {submitError}
          </p>
        ) : null}

        <button className="submit-report" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}

export default CreateIncident;
