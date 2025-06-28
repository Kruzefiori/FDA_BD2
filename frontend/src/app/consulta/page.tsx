"use client";

import { useState } from "react";
import PageLayout from "../components/PageLayout";

const allowedItems = [
  "shortages",
  "company",
  "adverseReaction",
  "report",
  "activeIngredient",
  "product",
  "relAdverseReactionXDrug",
  "relAdverseReactionXReport",
  "relReportXDrug",
  "drug",
];

export default function DrugSearch() {
  const [item, setItem] = useState("");
  const [filters, setFilters] = useState<{ key: string; value: string }[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addFilter = () => {
    if (!newKey || !newValue) return;
    setFilters([...filters, { key: newKey, value: newValue }]);
    setNewKey("");
    setNewValue("");
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const buildQueryString = () => {
    if (!item) return "";
    const params = new URLSearchParams();
    params.append("item", item);
    filters.forEach(({ key, value }) => {
      params.append(key, value);
    });
    return params.toString();
  };

  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    setResults([]);

    if (!item) {
      setError("Selecione uma tabela (item) para buscar.");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    console.log("Token usado na requisição:", token);

    if (!token) {
      setError("Usuário não autenticado");
      setLoading(false);
      return;
    }

    const queryString = buildQueryString();
    const url = `http://192.168.1.39:3000/drug/search?${queryString}`;
    console.log("URL completa da requisição:", url);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Status:", res.status);
      console.log("Headers:", Array.from(res.headers.entries()));

      const text = await res.text();
      console.log("Resposta bruta da API:", text);


      if (!res.ok) {
        throw new Error(`Erro: ${res.status} - ${text}`);
      }

      const data = JSON.parse(text);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  const columns = results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <PageLayout title="Consulta Ad Hoc">
      <div className="text-gray-900">
        <div className="mb-4">
          <label className="block font-semibold mb-1">Tabela (item):</label>
          <select
            value={item}
            onChange={(e) => setItem(e.target.value)}
            className="border rounded p-2 w-full text-gray-900 placeholder-gray-400"
            disabled={loading}
          >
            <option value="">-- Selecione --</option>
            {allowedItems.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Campo"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="border rounded p-2 flex-grow text-gray-900 placeholder-gray-400"
            disabled={loading}
          />
          <input
            type="text"
            placeholder="Valor"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="border rounded p-2 flex-grow text-gray-900 placeholder-gray-400"
            disabled={loading}
          />
          <button
            onClick={addFilter}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded disabled:opacity-50"
            type="button"
            disabled={loading}
          >
            Adicionar filtro
          </button>
        </div>

        <div className="mb-4">
          <strong>Filtros:</strong>
          <ul>
            {filters.map(({ key, value }, i) => (
              <li
                key={i}
                className="flex justify-between items-center border p-2 rounded my-1 text-gray-900"
              >
                <span>
                  <code>{key}</code> = <code>{value}</code>
                </span>
                <button
                  onClick={() => removeFilter(i)}
                  className="text-red-600 font-bold"
                  type="button"
                  disabled={loading}
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>

        {error && (
          <p className="mt-4 text-red-600 font-semibold">{error}</p>
        )}

        {results.length > 0 && (
          <div className="overflow-auto mt-6">
            <table className="w-full border-collapse border border-gray-300 text-gray-900">
              <thead>
                <tr className="bg-gray-200">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="border border-gray-300 p-2 text-left"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {columns.map((col) => (
                      <td key={col} className="border border-gray-300 p-2">
                        {typeof row[col] === "object"
                          ? JSON.stringify(row[col])
                          : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {results.length === 0 && !loading && (
          <p className="mt-4 text-gray-600">Nenhum resultado para exibir.</p>
        )}
      </div>
    </PageLayout>
  );
}
