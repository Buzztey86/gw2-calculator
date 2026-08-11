/**
 * buildCode.js — eigenes, kompaktes Export-/Import-Format für Talent- und
 * Skill-Auswahl. Kein offizieller GW2-Chatlink (dessen Binärformat für
 * komplette Build-Templates ist nicht öffentlich dokumentiert) - das hier ist
 * ein eigener Code, nur innerhalb dieses Tools verwendbar, um eine Auswahl zu
 * speichern/teilen/wieder einzuspielen.
 */

const PREFIX = "GW2BT1-"; // Versions-Präfix, falls sich das Format später ändert

export function encodeBuildCode(build) {
  const payload = {
    p: build.professionId,
    e: build.eliteSpec,
    l: build.lines,
    m: build.selectedMajors,
    h: build.selectedHeal,
    u: build.selectedUtilities,
    el: build.selectedElite,
  };
  const json = JSON.stringify(payload);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return PREFIX + b64;
}

export function decodeBuildCode(code) {
  if (!code || !code.startsWith(PREFIX)) {
    throw new Error("Kein gültiger Build-Code (fehlendes Präfix).");
  }
  const b64 = code.slice(PREFIX.length);
  let json;
  try {
    json = decodeURIComponent(escape(atob(b64)));
  } catch {
    throw new Error("Build-Code konnte nicht gelesen werden (ungültige Kodierung).");
  }
  let payload;
  try {
    payload = JSON.parse(json);
  } catch {
    throw new Error("Build-Code konnte nicht gelesen werden (ungültiges Format).");
  }
  return {
    professionId: payload.p,
    eliteSpec: payload.e ?? null,
    lines: payload.l ?? [],
    selectedMajors: payload.m ?? {},
    selectedHeal: payload.h ?? null,
    selectedUtilities: payload.u ?? [],
    selectedElite: payload.el ?? null,
  };
}
