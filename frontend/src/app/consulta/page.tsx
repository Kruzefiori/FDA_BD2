"use client";

import { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout";

// Mesma estrutura usada no backend
const allowedTables: Record<string, string[]> = {
  shortages: [
    "id",
    "drugId",
    "dosageForm",
    "description",
    "minInitialPostingDate",
    "maxInitialPostingDate",
    "presentation",
  ],
  company: ["name", "drugCount"],
  adverseReaction: ["name"],
  report: [
    "id",
    "occurCountry",
    "minTransmissionDate",
    "maxTransmissionDate",
    "minPatientAge",
    "maxPatientAge",
    "patientGender",
    "minPatientWeight",
    "maxPatientWeight",
  ],
  activeIngredient: ["name", "strength"],
  product: [
    "id",
    "activeIngredientName",
    "activeIngredientStrength",
    "dosageForm",
    "route",
    "drugId",
  ],
  relAdverseReactionXDrug: ["id", "drugName", "adverseReaction"],
  relAdverseReactionXReport: ["id", "reportId", "adverseReaction"],
  relReportXDrug: ["id", "reportId", "drugId"],
  drug: ["id", "companyName", "drugName"],
};

const allowedJoinsPerTable: Record<string, string[]> = {
  shortages: ["Drug"],
  company: ["Drugs"],
  drug: [
    "Company",
    "Shortages",
    "RelActiveIngredientXDrug",
    "RelAdverseReactionXDrug",
    "RelReportXDrug",
  ],
  report: ["drugs", "adverseReactions"],
  product: ["ActiveIngredient", "Drug"],
  activeIngredient: ["Product"],
  adverseReaction: ["drugs", "reportDrugs"],
  relAdverseReactionXDrug: ["Drug", "AdverseReaction"],
  relAdverseReactionXReport: ["Report", "AdverseReaction"],
  relReportXDrug: ["Report", "Drug"],
};

const joinFieldsMap: Record<string, string[]> = {
  Drug: ["id", "companyName", "drugName"],
  Drugs: ["id", "companyName", "drugName"],
  Company: ["name", "drugCount"],
  Shortages: [
    "id",
    "drugId",
    "dosageForm",
    "description",
    "initialPostingDate",
    "presentation",
  ],
  RelActiveIngredientXDrug: [
    "id",
    "drugName",
    "adverseReaction",
  ],
  RelAdverseReactionXDrug: [
    "id",
    "drugName",
    "adverseReaction",
  ],
  RelReportXDrug: ["id", "reportId", "drugId"],
  drugs: ["id", "companyName", "drugName"],
  adverseReactions: ["name"],
  reportDrugs: ["id", "reportId", "adverseReaction"],
  Report: [
    "id",
    "occurCountry",
    "transmissionDate",
    "patientAge",
    "patientGender",
    "patientWeight",
  ],
  ActiveIngredient: ["name", "strength"],
  Product: [
    "id",
    "activeIngredientName",
    "activeIngredientStrength",
    "dosageForm",
    "route",
    "drugId",
  ],
  AdverseReaction: ["name"],
  relAdverseReactionXReport: ["id", "reportId", "adverseReaction"],
};

export default function DrugSearch() {
  const [item, setItem] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [joins, setJoins] = useState<string[]>([]);
  const [fieldsToShow, setFieldsToShow] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Atualiza os campos disponíveis para mostrar quando muda a tabela ou joins
  useEffect(() => {
    if (!item) {
      setFieldsToShow({});
      return;
    }

    // Campos da tabela principal
    const mainFields = allowedTables[item] || [];

    // Campos dos joins selecionados
    const joinFields = joins.flatMap((join) => joinFieldsMap[join] || []);

    // Todos os campos juntos, evitando repetidos
    const allFields = Array.from(new Set([...mainFields, ...joinFields]));

    // Seleciona todos por padrão
    const newFieldsState: Record<string, boolean> = {};
    allFields.forEach((field) => {
      newFieldsState[field] = true;
    });

    setFieldsToShow(newFieldsState);
  }, [item, joins]);

  const handleChangeFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleJoin = (joinName: string) => {
    setJoins((prev) => {
      if (prev.includes(joinName)) {
        return prev.filter((j) => j !== joinName);
      } else {
        return [...prev, joinName];
      }
    });
  };

  const handleToggleField = (field: string) => {
    setFieldsToShow((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const buildQueryString = () => {
    if (!item) return "";
    const params = new URLSearchParams();
    params.append("item", item);

    // Adiciona filtros
    for (const key in filters) {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    }

    // Adiciona joins
    joins.forEach((join) => params.append("join", join));

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
    if (!token) {
      setError("Usuário não autenticado");
      setLoading(false);
      return;
    }

    const queryString = buildQueryString();
    const url = `http://192.168.1.39:3000/drug/search?${queryString}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
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

    // Pega os campos marcados para mostrar
    const columns = Object.entries(fieldsToShow)
      .filter(([_, checked]) => checked)
      .map(([field]) => field);

    if (columns.length === 0) return;

    const csvRows = [columns.join(",")];

    results.forEach((row) => {
      const rowData = columns.map((col) => {
        const value = row[col];
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return `"${JSON.stringify(value)}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
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

  // Campos para filtros (baseados em tabela + joins)
  const filterFields = [
    ...(allowedTables[item] || []),
    ...joins.flatMap((j) => joinFieldsMap[j] || []),
  ].filter((v, i, a) => a.indexOf(v) === i); // Uniq

  return (
    <PageLayout title="Consulta Ad Hoc">
      <div className="text-gray-900 space-y-6">
        {/* Seleção da tabela */}
        <div>
          <label className="block font-semibold mb-1">Tabela (item):</label>
          <select
            value={item}
            onChange={(e) => {
              setItem(e.target.value);
              setFilters({});
              setJoins([]);
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

        {/* Seleção dos joins permitidos */}
        {item && (
          <div>
            <strong className="block mb-2">Joins disponíveis:</strong>
            <div className="flex flex-wrap gap-4">
              {(allowedJoinsPerTable[item] || []).map((join) => (
                <label key={join} className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={joins.includes(join)}
                    onChange={() => handleToggleJoin(join)}
                    disabled={loading}
                  />
                  <span>{join}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Filtros */}
        {item && (
          <div>
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
                  placeholder={field}
                  disabled={loading}
                />
              ))}
            </div>
          </div>
        )}

        {/* Campos para mostrar */}
        {item && (
          <div>
            <strong className="block mb-2">Campos para exibir no relatório:</strong>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-48 overflow-auto border rounded p-3">
              {Object.entries(fieldsToShow).map(([field, checked]) => (
                <label key={field} className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggleField(field)}
                    disabled={loading}
                  />
                  <span>{field}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Botões */}
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

        {/* Erro */}
        {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}

        {/* Resultados */}
        {results.length > 0 && (
          <div className="overflow-auto mt-6">
            <table className="w-full border-collapse border border-gray-300 text-gray-900">
              <thead>
                <tr className="bg-gray-200">
                  {Object.entries(fieldsToShow)
                    .filter(([_, checked]) => checked)
                    .map(([col]) => (
                      <th key={col} className="border border-gray-300 p-2 text-left">
                        {col}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {Object.entries(fieldsToShow)
                      .filter(([_, checked]) => checked)
                      .map(([col]) => {
                        let value = row[col];
                        // Caso o campo não exista diretamente (ex: join), procura em objetos aninhados
                        if (value === undefined) {
                          // busca em joins (assumindo que o nome do campo pode estar na propriedade do join)
                          for (const join of joins) {
                            if (row[join] && typeof row[join] === "object") {
                              if (row[join][col] !== undefined) {
                                value = row[join][col];
                                break;
                              }
                            }
                          }
                        }

                        if (value === null || value === undefined) return <td key={col}></td>;
                        if (typeof value === "object") return <td key={col}>{JSON.stringify(value)}</td>;
                        return <td key={col}>{String(value)}</td>;
                      })}
                  </tr>
                ))}
              </tbody>
            </table>

            <footer className="mt-12 text-center text-sm text-gray-500 border-t pt-4">
              <p>
                <strong>
                  Do not rely on openFDA to make decisions regarding medical care. Consult a Doctor
                </strong>
                <br />
                <em>
                  Não confie no openFDA para tomar decisões relacionadas a cuidados médicos. Consulte
                  um médico
                </em>
              </p>
            </footer>
          </div>
        )}

        {results.length === 0 && !loading && (
          <p className="mt-4 text-gray-600">Nenhum resultado para exibir.</p>
        )}
      </div>
    </PageLayout>
  );
}
