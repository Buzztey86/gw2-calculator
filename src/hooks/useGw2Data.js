import { useEffect, useState } from "react";

const cache = new Map();

async function fetchJson(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Konnte ${url} nicht laden (${res.status})`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

export function useProfessionData(professionId) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!professionId) return;
    setLoading(true);
    setError(null);
    fetchJson(`/data/${professionId}.json`)
      .then((d) => setData(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [professionId]);

  return { data, error, loading };
}

export function useStaticData(name) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetchJson(`/data/${name}.json`).then(setData).catch(console.error);
  }, [name]);
  return data;
}

export const PROFESSION_LIST = [
  { id: "guardian", name: "Guardian" },
  { id: "warrior", name: "Warrior" },
  { id: "revenant", name: "Revenant" },
  { id: "ranger", name: "Ranger" },
  { id: "thief", name: "Thief" },
  { id: "engineer", name: "Engineer" },
  { id: "elementalist", name: "Elementalist" },
  { id: "mesmer", name: "Mesmer" },
  { id: "necromancer", name: "Necromancer" },
];
