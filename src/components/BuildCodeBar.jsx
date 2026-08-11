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
      setCopyStatus("Kopiert!");
    } catch {
      setCopyStatus("Kopieren fehlgeschlagen — bitte manuell markieren.");
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
        Build-Code (echtes GW2-Chat-Link-Format, Typ 0x0D)
      </div>
      <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginBottom: 10 }}>
        Kompatibel mit dem Spiel/gw2skills.net für Klasse, Talente und Heal-/Utility-/Elite-Skills. Ranger-Pets,
        Revenant-Legenden und Waffenauswahl sind (noch) nicht Teil dieses Tools und werden nicht kodiert.
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
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6 }}>Exportieren</div>
          <button className="weapon-tab" onClick={handleExport} style={{ marginBottom: 6 }}>
            Code erzeugen
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
                In Zwischenablage kopieren
              </button>
            </>
          )}
          {copyStatus && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>{copyStatus}</span>}
        </div>

        <div>
          <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6 }}>Importieren</div>
          <textarea
            value={importValue}
            onChange={(e) => setImportValue(e.target.value)}
            placeholder="[&DQ…] hier einfügen"
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
            Übernehmen
          </button>
          {importError && <div style={{ fontSize: 11, color: "var(--negative)", marginTop: 6 }}>{importError}</div>}
        </div>
      </div>
    </div>
  );
}
