"use client";

import { useState } from "react";
import PageLayout from "../components/PageLayout";

// Mesma estrutura usada no backend
const allowedTables: Record<string, string[]> = {
  shortages: [
    'id',
    'drugId',
    'dosageForm',
    'description',
    'minInitialPostingDate',
    'maxInitialPostingDate',
    'presentation',
  ],
  company: ['name', 'drugCount'],
  adverseReaction: ['name'],
  report: [
    'id',
    'occurCountry',
    'minTransmissionDate',
    'maxTransmissionDate',
    'minPatientAge',
    'maxPatientAge',
    'patientGender',
    'minPatientWeight',
    'maxPatientWeight',
  ],
  activeIngredient: ['name', 'strength'],
  product: [
    'id',
    'activeIngredientName',
    'activeIngredientStrength',
    'dosageForm',
    'route',
    'drugId',
  ],
  relAdverseReactionXDrug: ['id', 'drugName', 'adverseReaction'],
  relAdverseReactionXReport: ['id', 'reportId', 'adverseReaction'],
  relReportXDrug: ['id', 'reportId', 'drugId'],
  drug: ['id', 'companyName', 'drugName'],
};

const rangeFields: Record<string, string[]> = {
  shortages: ['minInitialPostingDate', 'maxInitialPostingDate'],
  report: [
    'minTransmissionDate',
    'maxTransmissionDate',
    'minPatientAge',
    'maxPatientAge',
    'minPatientWeight',
    'maxPatientWeight',
  ],
};




export default function DrugSearch() {
  const [item, setItem] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChangeFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const buildQueryString = () => {
    if (!item) return "";
    const params = new URLSearchParams();
    params.append("item", item);
    for (const key in filters) {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    }
    return params.toString();
  };

  const handleSearch = async () => {
    console.log("handleSearch chamado");

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
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  const exportToCSV = () => {
    if (results.length === 0) return;

    const columns = Object.keys(results[0]);
    const csvRows = [columns.join(",")];

    results.forEach((row) => {
      const rowData = columns.map((col) => {
        const value = row[col];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return `"${JSON.stringify(value)}"`;
        return `"${String(value).replace(/"/g, '""')}"`; // Escapa aspas duplas
      });
      csvRows.push(rowData.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `resultado-${item}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filterFields = item ? allowedTables[item] ?? [] : [];
  const rangeForItem = item ? rangeFields[item] ?? [] : [];

  const columns = results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <PageLayout title="Consulta Ad Hoc">
      <div className="text-gray-900">
        <div className="mb-6">
          <label className="block font-semibold mb-1">Tabela (item):</label>
          <select
            value={item}
            onChange={(e) => {
              setItem(e.target.value);
              setFilters({});
              setResults([]);
            }}
            className="border rounded p-2 w-full"
            disabled={loading}
          >
            <option value="">-- Selecione --</option>
            {Object.keys(allowedTables).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {item && (
          <div className="mb-6">
            <strong className="block mb-2">Filtros disponíveis:</strong>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filterFields.map((field) => (
                <input
                  key={field}
                  type={
                    field.toLowerCase().includes("date")
                      ? "date"
                      : field.toLowerCase().includes("age") ||
                        field.toLowerCase().includes("weight")
                        ? "number"
                        : "text"
                  }
                  value={filters[field] || ""}
                  onChange={(e) => handleChangeFilter(field, e.target.value)}
                  className="border p-2 rounded w-full"
                  placeholder={rangeForItem.includes(field) ? `${field} (intervalo)` : field}
                  disabled={loading}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-2 mb-4">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>

          <button
            onClick={exportToCSV}
            disabled={results.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            Exportar CSV
          </button>
        </div>


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
