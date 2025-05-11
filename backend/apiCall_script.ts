import prisma from "./src/prisma/client";
import fetch from "node-fetch";

const cadastraEmpresas = async (empresas: any[]) => {
  for (const empresa of empresas) {
    const { term , count} = empresa;
    const existingCompany = await prisma.company.findUnique({
      where: { name: term },
    });
    if (!existingCompany) {
      await prisma.company.create({
        data: {
          name: term,
          drugCount: count,
        },
      });
      console.log(`Empresa ${term} cadastrada com sucesso.`);
    } else {
      console.log(`Empresa ${term} já existe.`);
    }
  }
};

const cadastraEfeitosAdversos = async (efeitosAdversos: any[]) => {
  for (const efeito of efeitosAdversos) {
    const { term  } = efeito;
    const existingEfeito = await prisma.adverseReaction.findUnique({
      where: { name: term },
    });   
    if (!existingEfeito) {
      await prisma.adverseReaction.create({
        data: {
          name: term
        },
      });
      console.log(`Efeito adverso ${term} cadastrado com sucesso.`);
    } else {
      console.log(`Efeito adverso ${term} já existe.`);
    }
  }
};

// name              String
// strength          String
// dosageForm        String
// route             String
// companyName       String

const cadastraMedicamentos = async (medicamentos: any[], empresa: string) => {
  for (const medicamento of medicamentos) {
    if (!medicamento.products) {
      console.warn("Medicamento does not have 'products':", medicamento);
      continue; // Skip this iteration if 'products' is undefined
    }

    const { products } = medicamento;
    const { active_ingredients = [], dosage_form , route  } = products || {};

    console.log("products: ", products);

    // await prisma.drug.create({
    //   data: {
    //     name: active_ingredients?.brand_name || "Unknown",
    //     strength: active_ingredients?.strength || "Unknown",
    //     dosageForm: dosage_form || "Unknown",
    //     route: route || "Unknown",
    //     companyName: empresa,
    //   },
    // });
  }
};



const urlListaEmpresas = "https://api.fda.gov/drug/drugsfda.json?count=sponsor_name"

const urlListaMedicamentos = `https://api.fda.gov/drug/drugsfda.json?limit=50&search=sponsor_name:"REPLACE"`

const urlListaShortages = `https://api.fda.gov/drug/shortages.json?skip=1&search=openfda.brand_name:"REPLACE"`

const urlListaEfeitosAdversos = `https://api.fda.gov/drug/event.json?count=patient.reaction.reactionmeddrapt.exact`

const urlReportsPorRemedio = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"REPLACE"`

const apiKeys = [
  "pu9DShPFCotgX8VGGhuB3Cv8VQAjJp0Zp0YfdsJI",
  "CsjmOmUE6s9vpqJ79boALrdKzMSs0vbZfM6tm3kn",
  "R3ocagtQTKGgN3HeJygQoSTPKcG7363TUYlfFejI",
  "eNLbh360E9PyR4pAeMV6ERseR9K1nXPgbs1kGVi9",
  "8zAOfLqeChggb3QqJuyEEl9ggt4xv0SCYBiuJkqg",
]



const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ApiResponse {
  results?: any[];
  meta?: {
    results?: {
      total?: number;
      limit?: number;
    };
  };
}

const fetchData = async (url: string): Promise<any> => {
  let allResults: any[] = [];
  let skip = 0;
  let total = 0;
  let apiKeyIndex = 0; // Índice para controlar qual API key está sendo usada
  const maxRetries = 3; // Número máximo de tentativas

  do {
    // Atualiza o parâmetro de paginação (skip) na URL
    let finalUrl = new URL(url);
    finalUrl.searchParams.set("skip", skip.toString());
    finalUrl.searchParams.append("api_key", apiKeys[apiKeyIndex]);

    let response;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10 segundos de timeout

        response = await fetch(finalUrl.toString(), { signal: controller.signal });
        clearTimeout(timeout);

        if (response.ok) break; // Sai do loop se a resposta for bem-sucedida

        if (response.status === 429) {
          console.warn(`Erro 429: Muitas requisições com a chave ${apiKeys[apiKeyIndex]}. Trocando para a próxima chave...`);
          apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length; // Passa para a próxima chave
          await sleep(5000); // Espera 5 segundos antes de tentar novamente
        } else {
          throw new Error(`Erro na requisição: ${response.status}`);
        }
      } catch (error: any) {
        if (error.code === 'ETIMEDOUT') {
          retries++;
          console.warn(`Erro de timeout. Tentativa ${retries} de ${maxRetries}. Aguardando 20 segundos antes de tentar novamente...`);
          await sleep(20000); // Espera 20 segundos antes de tentar novamente
        } else {
          console.error("Erro na requisição:", error);
          throw error; // Lança o erro se não for timeout
        }
      }
    }

    if (retries === maxRetries) {
      throw new Error(`Falha após ${maxRetries} tentativas. URL: ${finalUrl.toString()}`);
    }

    const data = await response!.json();

    // Adiciona os resultados da página atual à lista de resultados
    const typedData = data as ApiResponse; // Typecast 'data' to 'ApiResponse'
    allResults = allResults.concat(typedData.results || []);

    // Atualiza os valores de paginação com base no meta da resposta
    total = typedData.meta?.results?.total || 0;
    skip += typedData.meta?.results?.limit || 0;

    // Adiciona um atraso antes da próxima iteração
    await sleep(2000); // 2 segundos de atraso entre as chamadas

  } while (skip < total); // Continua enquanto ainda houver dados para buscar

  return allResults;
};

const listaEmpresas = async (): Promise<any> => {
  return await fetchData(urlListaEmpresas);
}

const listaMedicamentosPorEmpresa = async (empresa: string): Promise<any> => {
  return await fetchData(urlListaMedicamentos.replace("REPLACE", empresa));
}

const listaShortagesPorMedicamento = async (medicamento: string): Promise<any> => {
  if (!medicamento) {
    console.log("listaShortagesPorMedicamento vazio, retornando lista vazia");
    return {
      results: {}

    };
  }
  return await fetchData(urlListaShortages.replace("REPLACE", medicamento));
}
const listaEfeitosAdversos = async (): Promise<any> => {
  return await fetchData(urlListaEfeitosAdversos);
}

const listaReportsPorRemedio = async (remedio: string): Promise<any> => {
  if (!remedio) {
    console.log("listaReportsPorRemedio vazio, retornando lista vazia");
    return {
      results: {}
    };
  }
  return await fetchData(urlReportsPorRemedio.replace("REPLACE", remedio));
}

const main = async () => {
  try {
    const empresasData = await listaEmpresas();

    //cadastraEmpresas(empresasData);
    const efeitosAdversos = await listaEfeitosAdversos();
    //cadastraEfeitosAdversos(efeitosAdversos);
    empresasData.forEach(async (empresa: any) => {
      const medicamentos = await listaMedicamentosPorEmpresa(empresa.term);
      console.log("-------------------------------------------------------------------------")
      cadastraMedicamentos(medicamentos , empresa.term);
      medicamentos.forEach(async (medicamento: any) => {
        //const listaShortages = await listaShortagesPorMedicamento(medicamento?.products?.brand_name);
        //console.log("Lista de shortages:", listaShortages.results);
        //cadastraShortages(listaShortages.results);
        //const reportsRemedio = await listaReportsPorRemedio(medicamento?.products?.brand_name);
        //console.log("Lista de reports por remedio:", listaReportsPorRemedio.results);
        //cadastraReportsPorRemedio(listaReportsPorRemedio.results);
        //console.log("Medicamento object:", medicamento);
      });
    });
  } catch (error) {
    console.error("Erro - Main(): ", error);
  }
};

main();