import prisma from "./src/prisma/client";
import fetch from "node-fetch";

export interface Medicamento {
  application_number: string
  sponsor_name: string
  openfda: Openfda
  products: Product[]
}

export interface ApplicationDoc {
  id: string
  url: string
  date: string
  type: string
}

export interface Openfda {
  application_number: string[]
  brand_name: string[]
  generic_name: string[]
  manufacturer_name: string[]
  product_ndc: string[]
  product_type: string[]
  route: string[]
  substance_name: string[]
  rxcui: string[]
  spl_id: string[]
  spl_set_id: string[]
  package_ndc: string[]
  nui: string[]
  pharm_class_epc: string[]
  unii: string[]
}

export interface Product {
  product_number: string
  reference_drug: string
  brand_name: string
  active_ingredients: ActiveIngredient[]
  reference_standard: string
  dosage_form: string
  route: string
  marketing_status: string
  te_code: string
}

export interface ActiveIngredient {
  name: string
  strength: string
}

export interface Shortage {
  discontinued_date: string
  update_type: string
  initial_posting_date: string
  proprietary_name: string
  strength: string[]
  package_ndc: string
  generic_name: string
  contact_info: string
  openfda: Openfda
  update_date: string
  therapeutic_category: string[]
  dosage_form: string
  presentation: string
  company_name: string
  status: string
  shortage_reason?: string
}

export interface Openfda {
  application_number: string[]
  brand_name: string[]
  generic_name: string[]
  manufacturer_name: string[]
  product_ndc: string[]
  product_type: string[]
  route: string[]
  substance_name: string[]
  rxcui: string[]
  spl_id: string[]
  spl_set_id: string[]
  package_ndc: string[]
  nui: string[]
  pharm_class_moa: string[]
  pharm_class_epc: string[]
  unii: string[]
}

export interface Empresa {
  term: string
  count: number
}


const cadastraEmpresas = async (empresas: Empresa[]) => {
  const promises: Promise<void>[] = [];

  for (const empresa of empresas) {
    const promise = (async () => {
      const { term, count } = empresa;
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
    })();

    promises.push(promise);
  }

  return promises;
};


const cadastraEfeitosAdversos = async (efeitosAdversos: Empresa[]) => {
  const promises: Promise<void>[] = [];
  for (const efeito of efeitosAdversos) {
    const promise = (async () => {
      const { term } = efeito;
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
    })();
    promises.push(promise);
  }


  return promises;
};

const cadastraMedicamentos = async (medicamentos: Medicamento[], empresa: string) => {
  for (const medicamento of medicamentos) {
    if (!medicamento.products) {
      console.warn("Medicamento does not have 'products':", medicamento);
      continue; // Skip this iteration if 'products' is undefined
    }

    const { products } = medicamento;
    const { active_ingredients, dosage_form, route, brand_name } = products[0];

    console.log("products: ", products);

    const existingDrug = await prisma.drug.findUnique({
      where: {
        name_strength: {
          name: brand_name,
          strength: active_ingredients[0]?.strength,
        },
      },
    });
    if (existingDrug) {
      console.log(`Medicamento ${brand_name} já existe.`);
      continue; // Skip this iteration if the drug already exists
    }

    try {
      await prisma.drug.create({
        data: {
          name: brand_name,
          strength: active_ingredients[0]?.strength,
          dosageForm: dosage_form,
          route: route,
          companyName: empresa,
        },
      });
    }
    catch (error) {
      console.error("Erro ao cadastrar medicamento:", error);
      continue; // Skip this iteration if there was an error
    }
  }
};

const cadastraShortages = async (shortages: Shortage[], drugName: string) => {
  for (const shortage of shortages) {
    try{
      console.log("shortage: ", shortage);

    await prisma.shortages.create({
      data: {
        presentation: shortage.presentation,
        dosageForm: shortage.dosage_form,
        description: shortage?.shortage_reason,
        initialPostingDate: new Date(shortage.initial_posting_date),
        Drug: {
          connectOrCreate: {
            where: {
              name_strength: {
                name: drugName,
                strength: shortage.strength[0],
              },
            },
            create: {
              name: drugName,
              strength: shortage.strength[0],
              dosageForm: shortage.dosage_form,
              route: shortage.openfda.route[0],
              company: {
                connectOrCreate: {
                  where: {
                    name: shortage.company_name,  
                  },
                  create: {
                    name: shortage.company_name,
                    drugCount: 1,
                  }
                }
              }
            }
          }
        }
      }
    });}catch (error) {
      console.error("Erro ao cadastrar shortage:", shortage);
      continue; // Skip this iteration if there was an error
    }
  }
};



const urlListaEmpresas = "https://api.fda.gov/drug/drugsfda.json?count=sponsor_name"

const urlListaMedicamentos = `https://api.fda.gov/drug/drugsfda.json?limit=50&search=sponsor_name:"REPLACE"`

//const urlListaShortages = `https://api.fda.gov/drug/shortages.json?skip=1&search=openfda.brand_name:"REPLACE"`

const urlListaShortages = new URL('https://api.fda.gov/drug/shortages.json')

const urlListaEfeitosAdversos = `https://api.fda.gov/drug/event.json?count=patient.reaction.reactionmeddrapt.exact`

const urlReportsPorRemedio = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"REPLACE"`

const apiKeys = [
  "pu9DShPFCotgX8VGGhuB3Cv8VQAjJp0Zp0YfdsJI",
  "CsjmOmUE6s9vpqJ79boALrdKzMSs0vbZfM6tm3kn",
  "R3ocagtQTKGgN3HeJygQoSTPKcG7363TUYlfFejI",
  "eNLbh360E9PyR4pAeMV6ERseR9K1nXPgbs1kGVi9",
  "8zAOfLqeChggb3QqJuyEEl9ggt4xv0SCYBiuJkqg",
  "qBZSCZcRPcUKaWjsTfeiQrYfbkoemGJtgm4nBIYt",
  "x1dc3MyLzeSnT5N2f68o3hQiSilvWww4YrisBewq"
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
  const maxRetries = 6; // Número máximo de tentativas

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

        response = await fetch(finalUrl.toString(), { signal: controller.signal });


        if (response.ok) break; // Sai do loop se a resposta for bem-sucedida

        if (response.status === 429) {
          console.warn(`Erro 429: Muitas requisições com a chave ${apiKeys[apiKeyIndex]}. Trocando para a próxima chave...`);
          apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length; // Passa para a próxima chave
          await sleep(5000); // Espera 5 segundos antes de tentar novamente
        } else if (response.status === 404) {
          console.warn(`Erro 404: Not found`);
          await sleep(5000); // Espera 5 segundos antes de tentar novamente

        } else {
          console.error(`Erro ${response.status}: ${response.statusText}`);
          console.error("Resposta da API:", await response.text());
          console.error("URL da requisição:", finalUrl.toString());
          throw new Error(`Erro na requisição: ${JSON.stringify(response)}`);
        }
      } catch (error: any) {
        if (error.code === 'ETIMEDOUT') {
          retries++;
          console.warn(`Erro de timeout. Tentativa ${retries} de ${maxRetries}. Aguardando 20 segundos antes de tentar novamente...`);
          await sleep(20000); // Espera 20 segundos antes de tentar novamente
        } else {
          console.error("Erro na requisição:", JSON.stringify(error.message));
          throw error; // Lança o erro se não for timeout
        }
      }
    }

    if (retries === maxRetries) {
      throw new Error(`Falha após ${maxRetries} tentativas. URL: ${finalUrl.toString()}`);
    }

    const data = await response!.json();

    if ((data as ApiResponse).results?.length === 0) {
      console.warn("API returned an empty response:", finalUrl.toString());
      return [];
    }

    // Adiciona os resultados da página atual à lista de resultados
    const typedData = data as ApiResponse; // Typecast 'data' to 'ApiResponse'
    allResults = allResults.concat(typedData.results || []);

    // Atualiza os valores de paginação com base no meta da resposta
    total = typedData.meta?.results?.total || 0;
    skip += typedData.meta?.results?.limit || 0;

    // Adiciona um atraso antes da próxima iteração
    await sleep(3000); // 3 segundos de atraso entre as chamadas

    if (skip >= total) {
      console.warn("Pagination exceeded total records. Stopping further requests.");
      break;
    }

  } while (skip < total); // Continua enquanto ainda houver dados para buscar

  return allResults;
};

const listaEmpresas = async (): Promise<any> => {
  return await fetchData(urlListaEmpresas);
}

const listaMedicamentosPorEmpresa = async (empresa: string): Promise<any> => {
  return await fetchData(urlListaMedicamentos.replace("REPLACE", empresa));
}

const listaShortagesPorMedicamento = async (medicamento: string) => {
  if (!medicamento) {
    console.log("listaShortagesPorMedicamento vazio, retornando lista vazia");
    return []
  }
  const url = new URL(urlListaShortages);
  url.searchParams.set("search", `openfda.brand_name:"${medicamento}"`);
  return await fetchData(url.toString());
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

    const promises_emp = await cadastraEmpresas(empresasData);
    const efeitosAdversos = await listaEfeitosAdversos();

    const promises_efe = await cadastraEfeitosAdversos(efeitosAdversos);

    await Promise.all([...promises_emp, ...promises_efe]);

    empresasData.forEach(async (empresa: any) => {
      const medicamentos = await listaMedicamentosPorEmpresa(empresa.term);
      cadastraMedicamentos(medicamentos, empresa.term);
      medicamentos.forEach(async (medicamento: Medicamento) => {
        console.log("Medicamento:", medicamento);
        if (!medicamento.products) {
          console.warn("Medicamento does not have 'products':", medicamento);
          return; // Skip this iteration if 'products' is undefined
        }
        await sleep(3000); // Atraso de 3 segundos entre as requisições
        const listaShortages = await listaShortagesPorMedicamento(medicamento?.products[0]?.brand_name);
        cadastraShortages(listaShortages, medicamento.products[0].brand_name);
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