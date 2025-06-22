/*
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


// model Shortages {
//   id                 Int      @id @default(autoincrement())
//   drugName           String
//   drugStrength       String
//   dosageForm         String
//   description        String?
//   initialPostingDate DateTime
//   presentation       String
//   Drug               Drug     @relation(fields: [drugName], references: [name], onDelete: Cascade)
// }
// const cadastraShortages = async (shortages: Shortage[]) => {
//   for (const shortage of shortages) {
    
//     const { proprietary_name } = shortage;

//     // Cria ou conecta o Drug (medicamento base)
//     let drug = await prisma.drug.findUnique({
//       where: { name: proprietary_name.charAt(0).toUpperCase() + proprietary_name.slice(1).toLowerCase() },
//     });

//     if (!drug) {
//       drug = await prisma.drug.create({
//         data: {
//           name: proprietary_name.charAt(0).toUpperCase() + proprietary_name.slice(1).toLowerCase(),
//         },
//       });
//       console.log(`Medicamento ${proprietary_name} cadastrado.`);
//     }

//     // Cria o Shortage
//     await prisma.shortages.create({
//       data: {
//         drugName: proprietary_name.charAt(0).toUpperCase() + proprietary_name.slice(1).toLowerCase(),
//         drugStrength: shortage.strength.join(", "),
//         dosageForm: shortage.dosage_form,
//         description: shortage.shortage_reason,
//       }
//     });
//   }
// };

const cadastraMedicamentos = async (medicamentos: Medicamento[]) => {
  for (const medicamento of medicamentos) {
    const { sponsor_name, products } = medicamento;

    if (!products) {
      console.warn("Medicamento does not have 'products':", medicamento);
      continue;
    }

    for (const product of products) {
      const { brand_name, dosage_form, route, product_number, marketing_status, reference_drug, active_ingredients } = product;

      if (!active_ingredients || active_ingredients.length === 0) {
        console.warn("Product does not have 'active_ingredients':", product);
        continue;
      }

      // Cria ou conecta o Drug (medicamento base)
      let drug = await prisma.drug.findUnique({
        where: { name: brand_name.charAt(0).toUpperCase() + brand_name.slice(1).toLowerCase() },
      });

      if (!drug) {
        drug = await prisma.drug.create({
          data: {
            name: brand_name.charAt(0).toUpperCase() + brand_name.slice(1).toLowerCase(),
            companies: {
              connectOrCreate: {
                where: { name: sponsor_name },
                create: { name: sponsor_name },
              },
            },
          },
        });
        console.log(`Medicamento ${brand_name} cadastrado.`);
      }

      // Verifica se o Product já existe para evitar duplicatas
      const existingProduct = await prisma.product.findFirst({
        where: {
          drugId: drug.id,
          productNumber: product_number,
        },
      });

      if (existingProduct) {
        console.log(`Produto ${brand_name} / ${product_number} já existe.`);
        continue;
      }

      // Cria o Product e ingredientes ativos vinculados
      const createdProduct = await prisma.product.create({
        data: {
          productNumber: product_number,
          referenceDrug: reference_drug,
          dosageForm: dosage_form,
          route,
          marketingStatus: marketing_status,
          drug: {
            connect: { id: drug.id },
          },
          activeIngredients: {
            create: await Promise.all(
              active_ingredients.map(async (ingredient) => {
                const { name, strength } = ingredient;

                const existingIngredient = await prisma.activeIngredient.findUnique({
                  where: {
                    name_strength: { name, strength },
                  },
                });

                if (!existingIngredient) {
                  await prisma.activeIngredient.create({
                    data: {
                      name,
                      strength,
                    },
                  });
                  console.log(`Ingrediente ativo ${name} criado.`);
                }

                return {
                  ingredient: {
                    connect: {
                      name_strength: { name, strength },
                    },
                  },
                  strength, // força registrada na ProductActiveIngredient (pode ser duplicada ou alternativa)
                };
              })
            ),
          },
        },
      });

      console.log(`Produto ${createdProduct.productNumber} cadastrado com sucesso.`);
    }
  }
};



const urlListaEmpresas = "https://api.fda.gov/drug/drugsfda.json?count=sponsor_name"

const urlListaMedicamentos = `https://api.fda.gov/drug/drugsfda.json?limit=1000`


const urlListaShortages = 'https://api.fda.gov/drug/shortages.json?limit=1000'

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

const fetchData = async (initialUrl: string): Promise<any[]> => {
  let allResults: any[] = [];
  let nextUrl: string | null = initialUrl;
  let apiKeyIndex = 0;
  const maxRetries = 500;

  while (nextUrl) {
    let response;
    let retries = 0;

    // Adiciona a chave da API na URL
    const urlObj = new URL(nextUrl);
    urlObj.searchParams.set("api_key", apiKeys[apiKeyIndex]);

    while (retries < maxRetries) {
      try {
        const controller = new AbortController();
        response = await fetch(urlObj.toString(), { signal: controller.signal });

        if (response.ok) break;

        if (response.status === 429) {
          console.warn(`Erro 429: Limite atingido com a chave ${apiKeys[apiKeyIndex]}. Trocando...`);
          apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
          await sleep(5000);
        } else if (response.status === 404) {
          console.warn("Erro 404: Não encontrado. Tentando novamente...");
          await sleep(5000);
        } else {
          console.error(`Erro ${response.status}: ${response.statusText}`);
          console.error("Resposta da API:", await response.text());
          console.error("URL da requisição:", urlObj.toString());
          throw new Error(`Erro na requisição: ${JSON.stringify(response)}`);
        }
      } catch (error: any) {
        if (error.code === 'ETIMEDOUT') {
          retries++;
          console.warn(`Timeout. Tentativa ${retries}/${maxRetries}. Aguardando 20s...`);
          await sleep(20000);
        } else {
          console.error("Erro na requisição:", JSON.stringify(error.message));
          throw error;
        }
      }
    }

    if (retries === maxRetries) {
      throw new Error(`Falha após ${maxRetries} tentativas. URL: ${urlObj.toString()}`);
    }

    const data = await response!.json() as ApiResponse;

    if (!data.results || data.results.length === 0) {
      console.warn("API retornou resposta vazia:", urlObj.toString());
      break;
    }

    allResults = allResults.concat(data.results);

    // Extrai o Link header para rel="next"
    const linkHeader = response?.headers?.get("Link");
    console.log("Link header:", linkHeader);
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = match ? match[1] : null;
      console.log("Próxima URL:", nextUrl);
    } else {
      nextUrl = null;
    }

    await sleep(3000);
  }

  return allResults;
};


const listaEmpresas = async (): Promise<any> => {
  return await fetchData(urlListaEmpresas);
}

const listaMedicamentosPorEmpresa = async (empresa: string): Promise<any> => {
  return await fetchData(urlListaMedicamentos.replace("REPLACE", empresa));
}

const listaShortages = async () => {
  return await fetchData(urlListaShortages);
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

const listaMedicamentos = async (): Promise<any> => {
  return await fetchData(urlListaMedicamentos);
}



const main = async () => {
  try {
    const empresasData = await listaEmpresas();

    const promises_emp = await cadastraEmpresas(empresasData);
    const efeitosAdversos = await listaEfeitosAdversos();

    const promises_efe = await cadastraEfeitosAdversos(efeitosAdversos);
    
    const medicamentosTodos = await listaMedicamentos();
    
    console.log("Medicamentos:", medicamentosTodos.length);
    const promisesMedicamentos = await cadastraMedicamentos(medicamentosTodos);

    const shortages = await listaShortages();

    //const promisesShortages = await cadastraShortages(shortages);

    await Promise.all([...promises_emp, ...promises_efe]);
    // empresasData.forEach(async (empresa: any) => {
    //   const medicamentos = await listaMedicamentosPorEmpresa(empresa.term);
    //   cadastraMedicamentos(medicamentos, empresa.term);
    //   medicamentos.forEach(async (medicamento: Medicamento) => {
    //     console.log("Medicamento:", medicamento);
    //     if (!medicamento.products) {
    //       console.warn("Medicamento does not have 'products':", medicamento);
    //       return; // Skip this iteration if 'products' is undefined
    //     }
    //     await sleep(3000); // Atraso de 3 segundos entre as requisições
    //     const listaShortages = await listaShortagesPorMedicamento(medicamento?.products[0]?.brand_name);
    //     console.log("Lista de shortages:", listaShortages);
    //     //stop execution
    //     cadastraShortages(listaShortages, medicamento.products[0].brand_name , empresa);
    //     //const reportsRemedio = await listaReportsPorRemedio(medicamento?.products?.brand_name);
    //     //console.log("Lista de reports por remedio:", listaReportsPorRemedio.results);
    //     //cadastraReportsPorRemedio(listaReportsPorRemedio.results);
    //     //console.log("Medicamento object:", medicamento);
    //   });
    // });
  } catch (error) {
    console.error("Erro - Main(): ", error);
  }
};

main(); */

