"use client";

import { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout";

const PAGE_SIZE = 200;

const allowedTables: Record<string, string[]> = {
  shortages: [
    "id",
    "drugId",
    "dosageForm",
    "description",
    "initialPostingDate",
    "presentation",
  ],
  company: ["name", "drugCount"],
  adverseReaction: ["name"],
  report: [
    "id",
    "occurCountry",
    "transmissionDate",
    "patientAge",
    "patientGender",
    "patientWeight",
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
    "dosageForm",
    "description",
    "initialPostingDate",
    "presentation",
  ],
  RelActiveIngredientXDrug: [
    "id",
    "activeIngredientName",
    "activeIngredientStrength",
    "dosageForm",
    "route",
    "drugId",
  ],
  RelAdverseReactionXDrug: ["id", "drugName", "adverseReaction"],
  RelReportXDrug: ["id", "reportId", "drugId"],
  drugs: ["id", "companyName", "drugName"],
  adverseReactions: ["name"],
  ActiveIngredient: ["name", "strength"],
  Product: [
    "id",
    "activeIngredientName",
    "activeIngredientStrength",
    "dosageForm",
    "route",
    "drugId",
  ],
  reportDrugs: ["id", "reportId", "drugId"],
  Report: [
    "id",
    "occurCountry",
    "transmissionDate",
    "patientAge",
    "patientGender",
    "patientWeight",
  ],
  AdverseReaction: ["name"],
};

const dateFields = new Set(["initialPostingDate", "transmissionDate"]);
const numberFields = new Set(["patientAge", "patientWeight", "drugCount"]);

export default function DrugSearch() {
  const [item, setItem] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [joins, setJoins] = useState<string[]>([]);
  const [fieldsToShow, setFieldsToShow] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [paginationEnabled, setPaginationEnabled] = useState(true);

  // Atualiza campos para mostrar com prefixo join quando necessário
  useEffect(() => {
    if (!item) {
      setFieldsToShow({});
      return;
    }

    const mainFields = allowedTables[item] || [];
    const joinFields = joins.flatMap((join) =>
      (joinFieldsMap[join] || []).map((field) => `${join}.${field}`)
    );
    const allFields = [...mainFields, ...joinFields];
    const newFieldsState: Record<string, boolean> = {};
    allFields.forEach((field) => {
      newFieldsState[field] = true;
    });

    setFieldsToShow(newFieldsState);
  }, [item, joins]);

  useEffect(() => {
    setPage(1);
  }, [item, joins, filters, paginationEnabled]);

  const handleChangeFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleJoin = (join: string) => {
    setJoins((prev) =>
      prev.includes(join) ? prev.filter((j) => j !== join) : [...prev, join]
    );
  };

  const handleToggleField = (field: string) => {
    setFieldsToShow((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleTogglePagination = () => {
    setPaginationEnabled((prev) => !prev);
  };

  const buildQueryString = () => {
    if (!item) return "";

    const params = new URLSearchParams();
    params.append("item", item);
    joins.forEach((j) => params.append("join", j));
    for (const key in filters) {
      if (filters[key]) {
        params.append(key, filters[key]);
      }
    }
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

    try {
      const queryString = buildQueryString();
      const url = `http://192.168.1.39:3000/drug/search?${queryString}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`Erro: ${res.status} - ${text}`);
      const data = JSON.parse(text);
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    }

    setLoading(false);
  };

  const exportToCSV = () => {
    if (results.length === 0) return;

    const selectedFields = Object.entries(fieldsToShow)
      .filter(([_, checked]) => checked)
      .map(([field]) => field);

    const csvRows = [selectedFields.join(",")];

    results.forEach((row) => {
      const rowData = selectedFields.map((col) => {
        const [joinMaybe, field] = col.includes(".")
          ? col.split(".")
          : [null, col];

        let value = joinMaybe ? row[joinMaybe]?.[field] : row[field];
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

  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const currentPageResults = paginationEnabled
    ? results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : results;

  // Função para ordenar com rel* no final
  function sortTables(tables: string[]) {
    const relTables = tables.filter((t) => t.toLowerCase().startsWith("rel"));
    const otherTables = tables.filter((t) => !t.toLowerCase().startsWith("rel"));
    otherTables.sort((a, b) => a.localeCompare(b));
    return [...otherTables, ...relTables];
  }

  return (
    <PageLayout title="Consulta Ad Hoc - FDA BD2">
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
              setPage(1);
            }}
            className="border rounded p-2 w-full"
            disabled={loading}
          >
            <option value="">-- Selecione --</option>
            {sortTables(Object.keys(allowedTables)).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle paginação */}
        <div className="mb-4">
          <label className="inline-flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={paginationEnabled}
              onChange={handleTogglePagination}
              disabled={loading}
            />
            <span>Ativar paginação (200 resultados por página)</span>
          </label>
        </div>

        {/* Joins disponíveis */}
        {item && (
          <div>
            <strong className="block mb-2">Joins disponíveis:</strong>
            <div className="flex flex-wrap gap-4">
              {(allowedJoinsPerTable[item] || []).map((join) => (
                <label
                  key={join}
                  className="inline-flex items-center space-x-2 cursor-pointer"
                >
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

        {/* FILTROS SUBDIVIDIDOS */}
        {item && (
          <div>
            <strong className="block mb-2">Filtros disponíveis:</strong>
            <div className="space-y-4">
              {/* Tabela principal */}
              <div>
                <p className="font-semibold mb-2">
                  Tabela principal: <span className="italic">{item}</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(allowedTables[item] || []).map((field) => (
                    <input
                      key={field}
                      type={
                        dateFields.has(field)
                          ? "date"
                          : numberFields.has(field)
                            ? "number"
                            : "text"
                      }
                      value={filters[field] || ""}
                      onChange={(e) => handleChangeFilter(field, e.target.value)}
                      className="border p-2 rounded w-full"
                      placeholder={`${item}.${field}`}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {/* Joins */}
              {joins.map((join) => {
                const joinFields = joinFieldsMap[join] || [];
                if (joinFields.length === 0) return null;

                return (
                  <div key={join}>
                    <p className="font-semibold mb-2">
                      Join: <span className="italic">{join}</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {joinFields.map((field) => (
                        <input
                          key={`${join}.${field}`}
                          type={
                            dateFields.has(field)
                              ? "date"
                              : numberFields.has(field)
                                ? "number"
                                : "text"
                          }
                          value={filters[field] || ""}
                          onChange={(e) => handleChangeFilter(field, e.target.value)}
                          className="border p-2 rounded w-full"
                          placeholder={`${join}.${field}`}
                          disabled={loading}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Campos para exibir no relatório */}
        {item && (
          <div>
            <strong className="block mb-2">Campos para exibir no relatório:</strong>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-48 overflow-auto border rounded p-3">
              {Object.entries(fieldsToShow).map(([field, checked]) => (
                <label
                  key={field}
                  className="inline-flex items-center space-x-2 cursor-pointer"
                >
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

        {/* Paginação */}
        {paginationEnabled && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || loading}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <span>
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page === totalPages || loading}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        )}

        {/* Mensagem de erro */}
        {error && <p className="mt-4 text-red-600 font-semibold">{error}</p>}

        {/* Resultados */}
        {currentPageResults.length > 0 && (
          <div className="overflow-auto mt-6">
            <table className="w-full border-collapse border border-gray-300 text-gray-900">
              <thead>
                <tr className="bg-gray-200">
                  {Object.entries(fieldsToShow)
                    .filter(([_, checked]) => checked)
                    .map(([col]) => (
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
                {currentPageResults.map((row, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {Object.entries(fieldsToShow)
                      .filter(([_, checked]) => checked)
                      .map(([col]) => {
                        const [joinMaybe, field] = col.includes(".")
                          ? col.split(".")
                          : [null, col];

                        const value = joinMaybe
                          ? row[joinMaybe]?.[field]
                          : row[field];

                        if (value === null || value === undefined)
                          return <td key={col}></td>;

                        if (typeof value === "object")
                          return <td key={col}>{JSON.stringify(value)}</td>;

                        return <td key={col}>{String(value)}</td>;
                      })}
                  </tr>
                ))}
              </tbody>
            </table>

            <footer className="mt-12 text-center text-sm text-gray-500 border-t pt-4">
              <p>
                <strong>
                  Do not rely on openFDA to make decisions regarding medical care.
                  Consult a Doctor
                </strong>
                <br />
                <em>
                  Não confie no openFDA para tomar decisões relacionadas a cuidados
                  médicos. Consulte um médico
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
