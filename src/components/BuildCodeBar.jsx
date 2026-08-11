import { useState } from "react";
import { encodeBuildCode } from "../lib/buildCode";

export default function BuildCodeBar({ build, professionData, paletteMap, onImport, importStatus }) {
  const [importValue, setImportValue] = useState("");
  const [exportValue, setExportValue] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [importError, setImportError] = useState("");

  function handleExport() {
    try {
      setExportValue(encodeBuildCode(build, professionData, paletteMap));
      setCopyStatus("");
    } catch (err) {
      setExportValue("");
      setCopyStatus(err.message);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(exportValue);
      setCopyStatus("Copied!");
    } catch {
      setCopyStatus("Copy failed — please select manually.");
    }
  }

  function handleImport() {
    setImportError("");
    try {
      onImport(importValue.trim());
      setImportValue("");
    } catch (err) {
      setImportError(err.message);
    }
  }

  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="label" style={{ color: "var(--accent)", marginBottom: 4 }}>
        Build Code (real GW2 chat link format, type 0x0D)
      </div>
      <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginBottom: 10 }}>
        Compatible with the game/gw2skills.net for profession, traits, and heal/utility/elite skills. Ranger pets,
        Revenant legends, and weapon selection are not (yet) part of this tool and are not encoded.
      </div>
      {importStatus && (
        <div
          style={{
            fontSize: 11.5,
            marginBottom: 12,
            padding: "6px 10px",
            borderRadius: "var(--radius-sm)",
            background: importStatus.ok ? "var(--positive-bg)" : "var(--negative-bg)",
            border: `1px solid ${importStatus.ok ? "var(--positive)" : "var(--negative)"}`,
            color: importStatus.ok ? "var(--positive)" : "var(--negative)",
          }}
        >
          {importStatus.ok ? "✓ " : "⚠ "}
          {importStatus.message}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6 }}>Export</div>
          <button className="weapon-tab" onClick={handleExport} style={{ marginBottom: 6 }}>
            Generate Code
          </button>
          {exportValue && (
            <>
              <textarea
                readOnly
                value={exportValue}
                onClick={(e) => e.target.select()}
                rows={2}
                style={{
                  width: "100%",
                  fontFamily: "monospace",
                  fontSize: 10.5,
                  background: "var(--bg)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  padding: 6,
                  resize: "none",
                }}
              />
              <button
                onClick={handleCopy}
                style={{ marginTop: 6, background: "none", border: "none", color: "var(--accent)", fontSize: 11, cursor: "pointer", padding: 0 }}
              >
                Copy to clipboard
              </button>
            </>
          )}
          {copyStatus && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{copyStatus}</span>}
        </div>

        <div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6 }}>Import</div>
          <textarea
            value={importValue}
            onChange={(e) => setImportValue(e.target.value)}
            placeholder="[&DQ…] paste here"
            rows={2}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: 10.5,
              background: "var(--bg)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: 6,
              resize: "none",
              marginBottom: 6,
            }}
          />
          <button className="weapon-tab" onClick={handleImport} disabled={!importValue.trim()}>
            Apply
          </button>
          {importError && <div style={{ fontSize: 11, color: "var(--negative)", marginTop: 6 }}>{importError}</div>}
        </div>
      </div>
    </div>
  );
}
