import React, { useState, useRef } from "react";

const MOCK_INGESTS = [
  {
    id: "1",
    file: "transactions_q3.csv",
    rows: "1.2M",
    status: "Completed",
    time: "10 min ago"
  },
  {
    id: "2",
    file: "kyc_update_eu.json",
    rows: "45K",
    status: "Completed",
    time: "1 hr ago"
  },
  {
    id: "3",
    file: "historical_alerts.xlsx",
    rows: "12K",
    status: "Completed",
    time: "Yesterday"
  }
];

export default function UploadPage() {

  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const inputRef = useRef(null);


  const handleSimulate = (e) => {

    e.preventDefault();

    setDragOver(false);

    const file =
        e.target.files?.[0] ||
        e.dataTransfer?.files?.[0];

    if (file) {
        setSelectedFile(file.name);
    }

    setToast("Uploading dataset...");

    setTimeout(() => {
        setToast("Validating dataset...");
    }, 800);

    setTimeout(() => {
        setToast("Engineering features...");
    }, 1600);

    setTimeout(() => {
        setToast("Running rule detection...");
    }, 2400);

    setTimeout(() => {
        setToast("Running Isolation Forest...");
    }, 3200);

    setTimeout(() => {
        setToast("Calculating risk scores...");
    }, 4000);

    setTimeout(() => {
        setToast("✓ Analysis completed successfully.");
    }, 4800);

    setTimeout(() => {
        setToast("");
    }, 7000);
};

  return (

    <div className="page-body">

      <div className="upload-center">

        {/* HERO */}

        <div
          style={{
            background: "var(--accent-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid rgba(58,91,240,0.12)",
            padding: "32px 40px",
            marginBottom: 40,
            position: "relative",
            overflow: "hidden"
          }}
        >

          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, rgba(58,91,240,0.09) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
              pointerEvents: "none"
            }}
          />

          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: "var(--primary)",
              marginBottom: 8,
              position: "relative"
            }}
          >
            AML DATA INGESTION
          </div>

          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 36,
              marginBottom: 10,
              position: "relative"
            }}
          >
            AML Transaction Dataset Ingestion
          </div>

          <div
            style={{
              fontSize: 14,
              color: "var(--ink-secondary)",
              position: "relative"
            }}
          >
            Upload a transaction dataset to perform feature engineering,
            anomaly detection, rule evaluation and automated AML risk scoring.
          </div>

        </div>

        {/* Toast */}

        {toast && (

          <div
            style={{
              background: "var(--primary)",
              color: "#FFF",
              padding: "12px 18px",
              borderRadius: "var(--radius-sm)",
              marginBottom: 24,
              fontWeight: 500
            }}
          >
            {toast}
          </div>

        )}

        {/* Upload Box */}

        <div

          className="ed-card ed-dropzone"

          style={{
            borderColor: dragOver
              ? "var(--primary)"
              : "var(--hairline)",
            background: dragOver
              ? "var(--accent-surface)"
              : "transparent",
            cursor: "pointer"
          }}

          onClick={() => inputRef.current?.click()}

          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}

          onDragLeave={() => setDragOver(false)}

          onDrop={handleSimulate}

        >

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="upload-svg"
          >

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
            />

          </svg>

          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: 10
            }}
          >
            Drag & Drop AML Transaction Dataset
          </div>

          <div
            style={{
              fontSize: 14,
              color: "var(--ink-secondary)"
            }}
          >
            Supported formats: CSV • JSON • XLSX • Parquet
            <br />
            Maximum file size: 100 MB
          </div>

          {selectedFile && (

            <div
              style={{
                marginTop: 20,
                color: "var(--primary)",
                fontWeight: 600
              }}
            >
              ✓ Selected: {selectedFile}
            </div>

          )}

          <button

            className="btn-editorial-primary"

            style={{
              marginTop: 24
            }}

            onClick={(e) => {

              e.stopPropagation();

              inputRef.current?.click();

            }}

          >

            Browse Files

          </button>

          <input
            ref={inputRef}
            type="file"
            hidden
            onChange={handleSimulate}
          />

        </div>

        {/* AML Pipeline */}

        <div
          className="ed-card"
          style={{ marginTop: 32 }}
        >

          <div className="ed-card-title">

            AML Analysis Pipeline

          </div>

          <div
            style={{
              display: "grid",
              gap: 14,
              fontSize: 14
            }}
          >

            <div>✓ Validate dataset</div>

            <div>✓ Feature engineering</div>

            <div>✓ Rule detection engine</div>

            <div>✓ Isolation Forest anomaly detection</div>

            <div>✓ Risk score calculation</div>

            <div>✓ Investigation report generation</div>

          </div>

        </div>

        {/* Recent Uploads */}

        <div
          className="ed-card"
          style={{ marginTop: 32 }}
        >

          <div className="ed-card-title">

            Recent Uploads

          </div>

          <table className="ed-table">

            <thead>

              <tr>

                <th>Filename</th>

                <th>Rows</th>

                <th>Status</th>

                <th>Time</th>

              </tr>

            </thead>

            <tbody>

              {MOCK_INGESTS.map(file => (

                <tr key={file.id}>

                  <td>{file.file}</td>

                  <td>{file.rows}</td>

                  <td>

                    <span
                      style={{
                        background: "#EAF7EF",
                        color: "#22863A",
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontWeight: 600,
                        fontSize: 12
                      }}
                    >

                      {file.status}

                    </span>

                  </td>

                  <td
                    style={{
                      color: "var(--ink-muted)"
                    }}
                  >

                    {file.time}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

}