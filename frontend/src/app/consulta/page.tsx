"use client";

import { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout";
import DynamicChart from "../components/DynamicChart";

const PAGE_SIZE = 200;

/**
 * Objeto que mapeia os nomes de exibição dos campos e joins.
 * 
 * Este objeto contém os nomes amigáveis para cada campo e join utilizado na pesquisa.
 * Os nomes são usados para exibir informações mais legíveis para o usuário.
 */
const displayNames: Record<string, string> = {
  activeIngredient: "Ingrediente Ativo",
  adverseReaction: "Reação Adversa",
  company: "Empresa",
  drug: "Medicamento",
  drugs: "Medicamento",
  product: "Produto",
  report: "Reporte",
  shortages: "Escassez de Medicamentos",
  dosageForm: "Forma Farmacêutica",
  presentation: "Apresentação",
  route: "Via de Administração",
  drugId: "ID do Medicamento",
  drugName: "Nome do Medicamento",
  companyName: "Nome da Empresa",
  initialPostingDate: "Data de Publicação Inicial",
  occurCountry: "País de Ocorrência",
  transmissionDate: "Data de Transmissão",
  patientAge: "Idade do Paciente",
  patientGender: "Gênero do Paciente",
  patientWeight: "Peso do Paciente",
  activeIngredientName: "Nome do Ingrediente Ativo",
  activeIngredientStrength: "Concentração do Ingrediente Ativo",
  strength: "Concentração",
  drugCount: "Contagem de Medicamentos",
  name: "Nome",
  id: "ID",
  reportDrugs: "Relatório",
  adverseReactions: "Reação Adversa",
};

/**
 * Função para obter o nome de exibição de um campo ou join.
 * @param key 
 * @returns 
 */
const getDisplayName = (key: string): string => {
  if (key.includes(".")) {
    const [join, field] = key.split(".");
    const joinName = displayNames[toCamelCase(join)] || toCamelCase(join);
    const fieldName = displayNames[toCamelCase(field)] || toCamelCase(field);
    return `${joinName} - ${fieldName}`;
  }
  const found = Object.entries(displayNames).find(
    ([k]) => k.toLowerCase() === key.toLowerCase()
  );
  return found ? found[1] : key + "No String";
};

/**
 * Função para converter uma string em camelCase.
 * 
 * Esta função adiciona espaços antes de letras maiúsculas, divide a string em palavras,
 * converte a primeira palavra para minúsculas e as demais para capitalizadas.
 * 
 * @param str 
 * @returns 
 */
const toCamelCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before uppercase letters
    .split(" ")
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join("");
};

const allowedTables: Record<string, string[]> = {
  shortages: [
    "id",
    "drugId",
    "dosageForm",
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
  drug: ["id", "companyName", "drugName"],
};

const allowedJoinsPerTable: Record<string, string[]> = {
  shortages: ["Drug"],
  company: ["Drug"],
  drug: ["AdverseReaction"],
  report: ["drugs", "adverseReactions"],
  product: ["Drug"],
  activeIngredient: ["Product"],
  adverseReaction: ["drugs", "report"],
};

const joinFieldsMap: Record<string, string[]> = {
  Drug: ["id", "companyName", "drugName"],
  Drugs: ["id", "companyName", "drugName"],
  Company: ["name", "drugCount"],
  Shortages: [
    "id",
    "dosageForm",
    "initialPostingDate",
    "presentation",
  ],
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
  report: [
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

const operatorOptions = [
  { value: "equals", label: "Igual a" },
  { value: "contains", label: "Contém" },
  { value: "startsWith", label: "Começa com" },
  { value: "endsWith", label: "Termina com" },
  { value: "gt", label: "Maior que " },
  { value: "gte", label: "Maior ou igual a" },
  { value: "lt", label: "Menor que" },
  { value: "lte", label: "Menor ou igual a" },
];

/**
 * Função principal do componente DrugSearch.
 * 
 * Este componente permite ao usuário pesquisar medicamentos e seus relacionamentos,
 * aplicando filtros, selecionando campos para exibição e realizando buscas cruzadas.
 * @returns 
 */
export default function DrugSearch() {
  const [item, setItem] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [filterOps, setFilterOps] = useState<Record<string, string>>({});
  const [joins, setJoins] = useState<string[]>([]);
  const [fieldsToShow, setFieldsToShow] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
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
  }, [item, joins, filters, filterOps, paginationEnabled]);

  const handleChangeFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleChangeOp = (key: string, op: string) => {
    setFilterOps((prev) => ({ ...prev, [key]: op }));
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

  /**
   * Função para construir a query string com base nos filtros, joins e campos selecionados.
   * 
   * Esta função coleta os parâmetros necessários e os formata em uma string de consulta.
   * Se não houver item selecionado, retorna uma string vazia.
   * 
   * @returns 
   */
  const buildQueryString = () => {
    if (!item) return "";

    const params = new URLSearchParams();
    params.append("item", item);
    joins.forEach((j) => params.append("join", j));
    for (const key in filters) {
      if (filters[key]) {
        params.append(key, filters[key]);
        const op = filterOps[key] || (numberFields.has(key.split(".").pop()!) ? "equals" : "contains");
        params.append(`${key}__op`, op);
      }
    }
    const selectedFields = Object.entries(fieldsToShow)
      .filter(([_, checked]) => checked)
      .map(([field]) => field);
    if (selectedFields.length > 0) {
      params.append("fields", selectedFields.join(","));
    }
    // Add paging parameters
    if (paginationEnabled) {
      params.append("page", String(page));
      params.append("pageSize", String(pageSize));
    }
    return params.toString();
  };

  /** * Função para buscar os dados com base nos filtros e joins selecionados.
 * 
   * Esta função constrói a query string com os parâmetros necessários e faz uma requisição para o backend.
   * Se houver erro, exibe uma mensagem de erro. Se a busca for bem-sucedida, atualiza os resultados.
   * 
   * @returns void
   */
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
      const url = `http://localhost:3000/drug/search?${queryString}`;
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

  /**
   * Função para exportar os resultados para CSV.
   * 
   * Esta função coleta os campos selecionados, formata os dados em linhas CSV e cria um arquivo para download.
   * Se não houver resultados, não faz nada.
   * 
   * Os campos são verificados se estão marcados para exibição e formatados corretamente para CSV.
   * @returns 
   */
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
  const currentPageResults = results;

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
          <label className="block font-semibold mb-1">Item de Pesquisa:</label>
          <select
            value={item}
            onChange={(e) => {
              setItem(e.target.value);
              setFilters({});
              setFilterOps({});
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
                {getDisplayName(opt)}
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
            <span>Ativar paginação</span>
          </label>
          {paginationEnabled && (
            <>
              <label className="flex items-center gap-1">
                Resultados por página:
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={pageSize}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(100, Number(e.target.value)));
                    setPageSize(val);
                    setPage(1); // Reset to first page if page size changes
                  }}
                  className="border rounded p-1 w-16"
                  disabled={loading}
                />
              </label>
              <label className="flex items-center gap-1">
                Página:
                <input
                  type="number"
                  min={1}
                  value={page}
                  onChange={(e) => setPage(Math.max(1, Number(e.target.value)))}
                  className="border rounded p-1 w-16"
                  disabled={loading}
                />
              </label>
            </>
          )}
        </div>

        {/* Joins disponíveis */}
        {item && (
          <div>
            <strong className="block mb-2">Pesquisas Cruzadas Disponíveis:</strong>
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
                  <span>{getDisplayName(join)}</span>
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
                  Pesquisa principal: <span className="italic">{displayNames[item] || item}</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(allowedTables[item] || []).map((field) => {
                    const key = field;
                    return (
                      <div key={key} className="flex gap-2">
                        <input
                          type={
                            dateFields.has(field)
                              ? "date"
                              : numberFields.has(field)
                                ? "number"
                                : "text"
                          }
                          value={filters[key] || ""}
                          onChange={(e) => handleChangeFilter(key, e.target.value)}
                          className="border p-2 rounded flex-1"
                          placeholder={`${getDisplayName(field)}`}
                          disabled={loading}
                        />
                        <select
                          value={filterOps[key] || "contains"}
                          onChange={(e) => handleChangeOp(key, e.target.value)}
                          className="border p-2 rounded w-28"
                          disabled={loading}
                        >
                          {operatorOptions.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Joins */}
              {joins.map((join) => {
                const joinFields = joinFieldsMap[join] || [];
                if (joinFields.length === 0) return null;

                return (
                  <div key={join}>
                    <p className="font-semibold mb-2">
                      Consulta Cruzada: <span className="italic">{getDisplayName(join)}</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {joinFields.map((field) => {
                        const filterKey = `${join}.${field}`;
                        return (
                          <div key={filterKey} className="flex gap-2">
                            <input
                              type={
                                dateFields.has(field)
                                  ? "date"
                                  : numberFields.has(field)
                                    ? "number"
                                    : "text"
                              }
                              value={filters[filterKey] || ""}
                              onChange={(e) =>
                                handleChangeFilter(filterKey, e.target.value)
                              }
                              className="border p-2 rounded flex-1"
                              placeholder={`${getDisplayName(field)}`}
                              disabled={loading}
                            />
                            <select
                              value={filterOps[filterKey] || "contains"}
                              onChange={(e) => handleChangeOp(filterKey, e.target.value)}
                              className="border p-2 rounded w-28"
                              disabled={loading}
                            >
                              {operatorOptions.map((op) => (
                                <option key={op.value} value={op.value}>
                                  {op.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
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
                  <span>{getDisplayName(field)}</span>
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
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
          <button
            onClick={exportToCSV}
            disabled={loading || results.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
          >
            Exportar CSV
          </button>
        </div>

        {/* Resultados */}
        <div className="overflow-auto max-h-[400px] border rounded p-2 bg-white text-black">
          {error && (
            <div className="bg-red-100 text-red-700 p-2 rounded mb-2">{error}</div>
          )}
          {!error && results.length === 0 && !loading && <div>Nenhum resultado para exibir.</div>}
          {results.length > 0 && (
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  {Object.entries(fieldsToShow)
                    .filter(([, checked]) => checked)
                    .map(([field]) => (
                      <th
                        key={field}
                        className="border border-gray-300 p-1 text-left bg-gray-200"
                      >
                        {getDisplayName(field)}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {Object.entries(fieldsToShow)
                      .filter(([, checked]) => checked)
                      .map(([field]) => (
                        <td key={field} className="border border-gray-300 p-1">
                          {row[field] ?? row[field.split(".")[1]] ?? ""}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Gráfico dinâmico */}
        {item === "company" && (
          <DynamicChart data={currentPageResults} fieldsToShow={fieldsToShow} />
        )}      </div>
    </PageLayout>
  );
}
