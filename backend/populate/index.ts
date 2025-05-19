import { ActiveIngredient, Drug, Prisma } from "@prisma/client";
import prisma from "../src/prisma/client";
import { fetchData } from "./fetch";
import { ApiResponseDrugsFDA, LinkActiveIngredientToDrug, Medicamento, ProcessDrugActiveIngredients, Shortage, ShortageRecord, TermOccurrence } from "./types";

async function batchCreateCompanies(empresas: TermOccurrence[]) {
  console.log(`Processando ${empresas.length} empresas...`);

  const existingCompanies = await prisma.company.findMany({
    where: {
      name: {
        in: empresas.map(function (e) { return e.term; })
      }
    },
    select: { name: true }
  });

  console.log(`Encontradas ${existingCompanies.length} empresas existentes`);
  console.log(`Empresas existentes: ${existingCompanies.slice(0, 5)
    .map(function (c) { return c.name; })
    .join(", ")}`);

  const existingCompanyNames = new Set(existingCompanies.map(function (c) { return c.name; }));
  const newCompanies = empresas.filter(function (e) { return !existingCompanyNames.has(e.term); });

  if (newCompanies.length > 0) {
    await prisma.company.createMany({
      data: newCompanies.map(function (company) {
        return {
          name: company.term,
          drugCount: company.count
        };
      }),
      skipDuplicates: true
    });
    console.log(`Criadas ${newCompanies.length} novas empresas`);
  } else {
    console.log("Nenhuma nova empresa para criar");
  }
}

async function batchCreateAdverseReactions(reactions: TermOccurrence[]) {
  console.log(`Processando ${reactions.length} reações adversas...`);

  const existingReactions = await prisma.adverseReaction.findMany({
    where: {
      name: {
        in: reactions.map(function (r) { return r.term; })
      }
    },
    select: { name: true }
  });

  const existingReactionNames = new Set(existingReactions.map(function (r) { return r.name; }));
  const newReactions = reactions.filter(function (r) { return !existingReactionNames.has(r.term); });

  if (newReactions.length > 0) {
    await prisma.adverseReaction.createMany({
      data: newReactions.map(function (reaction) {
        return {
          name: reaction.term
        };
      }),
      skipDuplicates: true
    });
    console.log(`Criadas ${newReactions.length} novas reações adversas`);
  } else {
    console.log("Nenhuma nova reação adversa para criar");
  }
}

async function createDrug(drugData: Omit<Drug, "id">) {
  await findOrCreateCompany(drugData.companyName);

  const drug = await prisma.drug.create({
    data: {
      companyName: drugData.companyName,
      drugName: drugData.drugName,
    }
  });

  console.log(`Medicamento criado: ${drugData.drugName} para ${drugData.companyName}`);

  return drug;
}

async function findOrCreateDrug(drugData: Omit<Drug, "id">) {
  const drug = await prisma.drug.findFirst({
    where: {
      companyName: drugData.companyName,
      drugName: drugData.drugName,
    }
  });

  if (!drug) {
    console.log(`Medicamento não encontrado: ${drugData.drugName} para empresa ${drugData.companyName}, criando nova entrada`);
    return await createDrug(drugData);
  }
  return drug;
}

async function createActiveIngredient(activeIngredientData: ActiveIngredient) {
  const activeIngredient = await prisma.activeIngredient.create({
    data: {
      name: activeIngredientData.name,
      strength: activeIngredientData.strength
    }
  });
  console.log(`Princípio ativo criado: ${activeIngredient.name} (${activeIngredient.strength})`);
  return activeIngredient;
}

async function findOrCreateActiveIngredient(activeIngredientData: ActiveIngredient) {
  const activeIngredient = await prisma.activeIngredient.findUnique({
    where: {
      name_strength: {
        name: activeIngredientData.name,
        strength: activeIngredientData.strength
      }
    }
  });

  if (!activeIngredient) {
    return await createActiveIngredient(activeIngredientData);
  }
  return activeIngredient;
}

async function linkActiveIngredientToDrug(data: LinkActiveIngredientToDrug) {
  const existingRelation = await prisma.product.findFirst({
    where: {
      activeIngredientName: data.activeIngredient.name,
      activeIngredientStrength: data.activeIngredient.strength,
      drugId: data.drug.id
    }
  });

  if (!existingRelation) {
    await prisma.product.create({
      data: {
        drugId: data.drug.id,
        activeIngredientName: data.activeIngredient.name,
        activeIngredientStrength: data.activeIngredient.strength,
        dosageForm: data.dosageForm || 'UNKNOWN',
        route: data.route || 'UNKNOWN',
      }
    });
    console.log(`Princípio ativo ${data.activeIngredient.name} vinculado ao medicamento ID: ${data.drug.id}`);
  }
}

async function processDrugActiveIngredients(data: ProcessDrugActiveIngredients) {
  const { product, drug } = data;
  if (!product.active_ingredients || product.active_ingredients.length === 0) {
    console.log(`Medicamento ${drug.id} não possui princípios ativos definidos`);
    return;
  }

  for (const ingredient of product.active_ingredients) {
    if (!ingredient.name || !ingredient.strength) {
      console.log(`Ingrediente inválido para medicamento ${drug.id} - falta nome ou força`);
      continue;
    }

    await findOrCreateActiveIngredient({
      name: ingredient.name,
      strength: ingredient.strength
    });

    await linkActiveIngredientToDrug({
      activeIngredient: { name: ingredient.name, strength: ingredient.strength },
      drug: { id: drug.id },
      dosageForm: product.dosage_form,
      route: product.route
    });
  }
}

async function isTablePopulated(tableName: Prisma.ModelName, minCount = 1) {
  const count = await (prisma[tableName as any] as any).count();
  return count >= minCount;
}

async function processShortagesForDrug(drugName: string) {
  try {
    const url = new URL("https://api.fda.gov/drug/shortages.json");
    url.searchParams.set("search", `openfda.brand_name: "${drugName}"`);

    const shortagesData = await fetchData<Shortage>(url);

    if (!shortagesData) {
      console.log(`Nenhuma escassez encontrada para o medicamento: ${drugName}`);
      return;
    }

    for (const shortage of shortagesData) {
      if (!shortage.strength || !shortage.strength.length) {
        console.log(`Ignorando escassez sem dosagem para medicamento: ${drugName}`);
        continue;
      }

      await processShortageRecord({
        drug: { drugName },
        shortage
      });
    }
  } catch (error) {
    console.error(`Erro ao processar escassez para medicamento ${drugName}: `, error);
  }
}

async function processShortageRecord(data: ShortageRecord) {
  const { drug, shortage } = data;
  const drugName = drug.drugName;
  const companyName = shortage.company_name || "UNKNOWN";
  try {
    const drugData = await prisma.drug.findFirst({
      where: {
        drugName,
        companyName,
      }
    });

    if (!drugData) {
      await createDrugFromShortage({
        drug: { drugName },
        shortage
      });
    } else {
      await createShortageRecord({ drug: { id: drugData.id }, shortage });
    }
  } catch (error) {
    console.error(`Erro criando escassez para ${drugName}(${shortage.strength}): `, error);
  }
}

async function createDrugFromShortage(data: ShortageRecord) {
  const { drug, shortage } = data;
  const drugName = drug.drugName;
  console.log(`Medicamento não encontrado com nome: ${drugName} e força: ${shortage.strength ? shortage.strength[0] : 'unknown'}, criando nova entrada`);

  const companyName = shortage.company_name || "UNKNOWN";

  const company = await findOrCreateCompany(companyName);

  const drugData = await findOrCreateDrug({
    companyName: company.name,
    drugName: drugName,
  });

  await createShortageRecord({ drug: { id: drugData.id }, shortage });

  return drugData;
}

async function findOrCreateCompany(companyName: string) {
  if (!companyName) {
    companyName = "UNKNOWN";
  }

  const company = await prisma.company.findUnique({
    where: {
      name: companyName
    }
  });

  if (!company) {
    console.log(`Empresa não encontrada: ${companyName}, criando nova entrada`);
    return await prisma.company.create({
      data: {
        name: companyName,
        drugCount: 0
      }
    });
  }
  return company;
}

async function createShortageRecord(data: Omit<ShortageRecord, "drug"> & { drug: { id: number } }) {
  const { drug, shortage } = data;

  const dosageForm = shortage.dosage_form || "UNKNOWN";
  const presentation = shortage.presentation || "UNKNOWN";

  await prisma.shortages.create({
    data: {
      drugId: drug.id,
      presentation: presentation,
      dosageForm: dosageForm,
      description: shortage?.shortage_reason || null,
      initialPostingDate: new Date(shortage.initial_posting_date || Date.now())
    }
  });

  console.log(`Registro de escassez criado para medicamento ID: ${drug.id}`);
}

async function processShortagesForDrugs(drugs: ApiResponseDrugsFDA[]) {
  const brandNames = drugs
    .filter(function (med) {
      return med.products &&
        med.products[0]?.brand_name &&
        med.products[0]?.active_ingredients?.[0]?.strength;
    })
    .map(function (med) { return med.products[0].brand_name; });

  if (brandNames.length === 0) return;

  const batchSize = 5;

  for (let i = 0; i < brandNames.length; i += batchSize) {
    const batch = brandNames.slice(i, i + batchSize);

    for (const drugName of batch) {
      await processShortagesForDrug(drugName);
    }

    if (i + batchSize < brandNames.length) {
      await new Promise(function (resolve) { setTimeout(resolve, 1000); });
    }
  }
}

async function processDrugRecord(med: ApiResponseDrugsFDA, company: string) {
  try {
    if (!med.products || !med.products.length || !med.products[0].brand_name) {
      console.log("Registro de medicamento inválido - faltam dados essenciais");
      return null;
    }

    for (const product of med.products) {
      const drugName = product.brand_name;

      await findOrCreateCompany(company);

      const drug = await findOrCreateDrug({
        companyName: company,
        drugName: drugName,
      });

      await processDrugActiveIngredients({
        product: product,
        drug
      });

      return drug;
    }
  } catch (error) {
    console.error(`Erro ao processar medicamento: `, error);
    return null;
  }
}

async function fetchCompanies() {
  const isPopulated = await isTablePopulated('Company', 10);

  if (isPopulated) {
    console.log("Tabela de empresas já está populada. Obtendo dados do banco de dados.");
    const companies = await prisma.company.findMany({
      select: {
        name: true,
        drugCount: true
      }
    });

    return companies.map(function (c) {
      return {
        term: c.name,
        count: c.drugCount || 0
      };
    });
  }

  const url = new URL("https://api.fda.gov/drug/drugsfda.json");
  url.searchParams.set("count", "sponsor_name");
  return await fetchData<TermOccurrence>(url);
}

async function fetchAdverseReactions() {
  const isPopulated = await isTablePopulated('AdverseReaction', 10);

  if (isPopulated) {
    console.log("Tabela de reações adversas já está populada. Obtendo dados do banco de dados.");
    const reactions = await prisma.adverseReaction.findMany({
      select: {
        name: true
      }
    });

    return reactions.map(function (r) {
      return {
        term: r.name,
        count: 1 // Valor padrão já que não temos count no banco (ainda )
      };
    });
  }

  const url = new URL("https://api.fda.gov/drug/event.json");
  url.searchParams.set("count", "patient.reaction.reactionmeddrapt.exact");
  return await fetchData<TermOccurrence>(url);
}

async function processDrugs(limit = 1000) {
  try {
    const url = new URL("https://api.fda.gov/drug/drugsfda.json");
    url.searchParams.set("limit", limit.toString());

    const medicamentosData = await fetchData<ApiResponseDrugsFDA>(url, true);

    if (!medicamentosData || !Array.isArray(medicamentosData)) {
      console.warn(`Nenhum dado válido de medicamento!`);
      return;
    }

    const validDrugs = medicamentosData.filter((med) => {
      return (
        med.products?.length > 0 &&
        med.products[0].brand_name &&
        med.products[0].active_ingredients
      );
    });

    if (validDrugs.length === 0) {
      console.log(`Nenhum medicamento válido encontrado!`);
      return;
    }

    for (const med of validDrugs) {
      try {
        const companyName = med.sponsor_name || "UNKNOWN";
        await processDrugRecord(med, companyName);
      } catch (error) {
        console.error(`Erro ao processar medicamento individual: `, error);
      }
    }

    await processShortagesForDrugs(validDrugs);
  } catch (error) {
    console.error(`Erro ao processar medicamentos: `, error);
    throw error;
  }
}

async function main() {
  try {
    console.log("Iniciando processo de importação de dados...");

    await findOrCreateCompany("UNKNOWN");

    const [empresasData, efeitosAdversos] = await Promise.all([
      fetchCompanies(),
      fetchAdverseReactions()
    ]);

    console.log(`Recuperadas ${empresasData.length} empresas e ${efeitosAdversos.length} reações adversas`);

    await Promise.all([
      batchCreateCompanies(empresasData),
      batchCreateAdverseReactions(efeitosAdversos)
    ]);

    await processDrugs();

    // await processAdverseEventReports(100);

    console.log("Processo de importação de dados concluído com sucesso");
  } catch (error) {
    console.error("Erro fatal no processo principal:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
