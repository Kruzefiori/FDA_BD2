import { ActiveIngredient, Drug, DrugBase, Prisma } from "@prisma/client";
import prisma from "../src/prisma/client";
import { fetchData } from "./fetch";
import { LinkActiveIngredientToDrug, Medicamento, ProcessDrugActiveIngredients, Shortage, ShortageRecord, TermOccurrence } from "./types";

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

async function createDrugBase(drug: DrugBase) {
  const drugBase = await prisma.drugBase.create({
    data: {
      name: drug.name,
      strength: drug.strength,
      dosageForm: drug.dosageForm,
      route: drug.route
    }
  });
  console.log(`Base de medicamento criada: ${drug.name} (${drug.strength})`);
  return drugBase;
}

async function findOrCreateDrugBase(drug: DrugBase) {
  const drugBase = await prisma.drugBase.findUnique({
    where: {
      name_strength: {
        name: drug.name,
        strength: drug.strength
      }
    }
  });

  if (!drugBase) {
    return await createDrugBase(drug);
  }
  return drugBase;
}

async function createDrug(drugData: Omit<Drug, "id">) {
  const drug = await prisma.drug.create({
    data: {
      companyName: drugData.companyName,
      drugName: drugData.drugName,
      drugStrength: drugData.drugStrength
    }
  });
  console.log(`Medicamento criado: ${drugData.drugName} (${drugData.drugStrength}) para ${drugData.companyName}`);
  return drug;
}

async function findOrCreateDrug(drugData: Omit<Drug, "id">) {
  const drug = await prisma.drug.findFirst({
    where: {
      companyName: drugData.companyName,
      drugName: drugData.drugName,
      drugStrength: drugData.drugStrength
    }
  });

  if (!drug) {
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
  const existingRelation = await prisma.relActiveIngredientXDrug.findFirst({
    where: {
      activeIngredientName: data.activeIngredient.name,
      activeIngredientStrength: data.activeIngredient.strength,
      drugId: data.drug.id
    }
  });

  if (!existingRelation) {
    await prisma.relActiveIngredientXDrug.create({
      data: {
        activeIngredientName: data.activeIngredient.name,
        activeIngredientStrength: data.activeIngredient.strength,
        drugId: data.drug.id
      }
    });
    console.log(`Princípio ativo ${data.activeIngredient.name} vinculado ao medicamento ID: ${data.drug.id}`);
  }
}

async function processDrugActiveIngredients(data: ProcessDrugActiveIngredients) {
  const { product, drug } = data;
  if (!product.active_ingredients || product.active_ingredients.length === 0) {
    return;
  }

  for (const ingredient of product.active_ingredients) {
    if (!ingredient.name || !ingredient.strength) {
      continue;
    }

    await findOrCreateActiveIngredient({
      name: ingredient.name,
      strength: ingredient.strength
    });
    await linkActiveIngredientToDrug({
      activeIngredient: { name: ingredient.name, strength: ingredient.strength },
      drug: { id: drug.id }
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
        console.log(`Ignorando escassez sem força para medicamento: ${drugName}`);
        continue;
      }

      await processShortageRecord({
        drug: { drugName },
        shortage
      });
    }
  } catch (error) {
    console.error(`Erro ao processar escassez para medicamento ${drugName}: `, error);
    throw error;
  }
}

async function processShortageRecord(data: ShortageRecord) {
  const { drug, shortage } = data;
  const drugName = drug.drugName;
  try {
    const drugData = await prisma.drug.findFirst({
      where: {
        drugName,
        drugStrength: shortage.strength[0]
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
    console.error(`Erro criando escassez para ${drugName}(${shortage.strength[0]}): `, error);
    throw error;
  }
}

async function createDrugFromShortage(data: ShortageRecord) {
  const { drug, shortage } = data;
  const drugName = drug.drugName;
  console.log(`Medicamento não encontrado com nome: ${drugName} e força: ${shortage.strength[0]}, criando nova entrada`);

  await findOrCreateDrugBase({
    name: drugName,
    strength: shortage.strength[0],
    dosageForm: shortage.dosage_form,
    route: shortage.openfda?.route?.[0]
  });

  const company = await findOrCreateCompany(shortage.openfda?.manufacturer_name?.[0]);
  const drugData = await findOrCreateDrug({
    companyName: company.name,
    drugName: drugName,
    drugStrength: shortage.strength[0]
  });
  await createShortageRecord({ drug: { id: drugData.id }, shortage });

  return drug;
}

async function findOrCreateCompany(companyName: string) {
  if (!companyName) {
    throw new Error("Nome da empresa não fornecido");
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
        name: companyName
      }
    });
  }
  return company;
}

async function createShortageRecord(data: Omit<ShortageRecord, "drug"> & { drug: { id: number } }) {
  const { drug, shortage } = data;
  await prisma.shortages.create({
    data: {
      drugId: drug.id,
      presentation: shortage.presentation,
      dosageForm: shortage.dosage_form,
      description: shortage?.shortage_reason || null,
      initialPostingDate: new Date(shortage.initial_posting_date)
    }
  });

  console.log(`Registro de escassez criado para medicamento ID: ${drug.id}`);
}

async function processShortagesForDrugs(drugs: Medicamento[]) {
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

async function processDrugsForCompany(company: string, limit = 50) {
  try {
    console.log(`Processando medicamentos para empresa: ${company}`);

    // Verifica se já existem medicamentos para esta empresa no banco de dados
    const existingDrugCount = await prisma.drug.count({
      where: {
        companyName: company
      }
    });

    if (existingDrugCount > 0) {
      console.log(`Já existem ${existingDrugCount} medicamentos cadastrados para ${company}. Pulando requisição à API.`);
      return;
    }

    const url = new URL("https://api.fda.gov/drug/drugsfda.json");
    url.searchParams.set("search", `sponsor_name: "${company}"`);
    url.searchParams.set("limit", limit.toString());

    const medicamentosData = await fetchData<Medicamento>(url);

    if (!medicamentosData || !Array.isArray(medicamentosData)) {
      console.warn(`Nenhum dado válido de medicamento para empresa: ${company}`);
      return;
    }

    const validDrugs = medicamentosData.filter((med) => {
      return (
        med.products?.length > 0 &&
        med.products[0].brand_name &&
        med.products[0].active_ingredients?.[0]?.strength
      );
    });


    if (validDrugs.length === 0) {
      console.log(`Nenhum medicamento válido encontrado para empresa: ${company}`);
      return;
    }

    for (const med of validDrugs) {
      await processDrugRecord(med, company);
    }

    await processShortagesForDrugs(validDrugs);
  } catch (error) {
    console.error(`Erro ao processar medicamentos para empresa ${company}: `, error);
    throw error;
  }
}

async function processDrugRecord(med: Medicamento, company: string) {
  const product = med.products[0];
  const drugName = product.brand_name;
  const drugStrength = product.active_ingredients?.[0]?.strength;
  const dosageForm = product.dosage_form;
  const route = product.route;

  await findOrCreateDrugBase({
    name: drugName,
    strength: drugStrength,
    dosageForm: dosageForm,
    route: route
  });
  const drug = await findOrCreateDrug({
    companyName: company,
    drugName: drugName,
    drugStrength: drugStrength
  });
  await processDrugActiveIngredients({
    product,
    drug
  });
  return drug;
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

// async function createReport(reportData) {
//   return await prisma.report.create({
//     data: {
//       occurCountry: reportData.occurcountry,
//       transmissionDate: new Date(reportData.transmissiondate),
//       patientAge: reportData.patient.patientonsetage,
//       patientGender: reportData.patient.patientsex,
//       patientWeight: reportData.patient.patientweight
//     }
//   });
// }

// async function processDrugsInReport(reportData, reportId) {
//   if (!reportData.patient.drug || !Array.isArray(reportData.patient.drug)) {
//     return;
//   }
//
//   for (const drugInfo of reportData.patient.drug) {
//     if (!drugInfo.medicinalproduct) continue;
//
//     const drug = await findOrCreateDrugFromReport(drugInfo);
//     if (drug) {
//       await linkDrugToReport(drug.id, reportId);
//     }
//   }
// }

// async function linkDrugToReport(drugId, reportId) {
//   await prisma.relReportXDrug.create({
//     data: {
//       reportId: reportId,
//       drugId: drugId
//     }
//   });
// }

// async function processReactionsInReport(reportData, reportId) {
//   if (!reportData.patient.reaction || !Array.isArray(reportData.patient.reaction)) {
//     return;
//   }
//
//   for (const reaction of reportData.patient.reaction) {
//     if (!reaction.reactionmeddrapt) continue;
//
//     const adverseReaction = await findOrCreateAdverseReaction(reaction.reactionmeddrapt);
//     await linkReactionToReport(adverseReaction.name, reportId);
//   }
// }

// async function findOrCreateAdverseReaction(reactionName) {
//   const adverseReaction = await prisma.adverseReaction.findUnique({
//     where: { name: reactionName }
//   });
//
//   if (!adverseReaction) {
//     return await prisma.adverseReaction.create({
//       data: { name: reactionName }
//     });
//   }
//   return adverseReaction;
// }

// async function linkReactionToReport(reactionName, reportId) {
//   await prisma.relAdverseReactionXReport.create({
//     data: {
//       reportId: reportId,
//       adverseReaction: reactionName
//     }
//   });
// }

// async function processAdverseEventReports(limit = 50) {
//   try {
//     console.log(`Processando relatórios de eventos adversos...`);
//
//     // Verifica se a tabela de relatórios já está populada
//     const isPopulated = await isTablePopulated('report', 20);
//
//     if (isPopulated) {
//       console.log("Tabela de relatórios já está populada. Pulando requisição à API.");
//       return;
//     }
//
//     const url = new URL("https://api.fda.gov/drug/event.json");
//     url.searchParams.set("limit", limit.toString());
//
//     const reportsData = await fetchData(url);
//
//     if (!reportsData) {
//       console.warn("Nenhum dado de relatório válido");
//       return;
//     }
//
//     const validReports = reportsData.filter(function (reportData) {
//       return reportData.receiver && reportData.patient;
//     });
//
//     for (const reportData of validReports) {
//       await processReport(reportData);
//     }
//   } catch (error) {
//     console.error("Erro em processAdverseEventReports:", error);
//     throw error;
//   }
// }

// async function processReport(reportData) {
//   try {
//     const report = await createReport(reportData);
//     await processDrugsInReport(reportData, report.id);
//     await processReactionsInReport(reportData, report.id);
//     console.log(`Relatório processado ID: ${report.id}`);
//   } catch (error) {
//     console.error("Erro ao processar relatório:", error);
//     throw error;
//   }
// }

// async function findOrCreateDrugFromReport(drugInfo) {
//   try {
//     const drugName = drugInfo.medicinalproduct;
//     const strength = drugInfo.drugstructuredosagenumb ?
//       `${drugInfo.drugstructuredosagenumb} ${drugInfo.drugstructuredosageunit || ''}`.trim() :
//       "Unknown";
//
//     const drug = await prisma.drug.findFirst({
//       where: {
//         drugName: drugName,
//         drugStrength: strength
//       }
//     });
//
//     if (drug) {
//       return drug;
//     }
//
//     await findOrCreateDrugBase(
//       drugName,
//       strength,
//       drugInfo.drugdosageform,
//       drugInfo.drugadministrationroute
//     );
//
//     const companyName = drugInfo.manufacturername || "Unknown";
//     const newDrug = await createDrug(companyName, drugName, strength);
//     console.log(`Medicamento criado a partir do relatório: ${drugName} (${strength})`);
//     return newDrug;
//   } catch (error) {
//     console.error(`Erro ao encontrar/criar medicamento a partir do relatório:`, error);
//     return null;
//   }
// }

async function processCompanyBatch(companiesToProcess: TermOccurrence[]) {
  const batchSize = 5;

  for (let i = 0; i < companiesToProcess.length; i += batchSize) {
    const batch = companiesToProcess.slice(i, i + batchSize);
    console.log(`Processando lote de empresas ${i / batchSize + 1}/${Math.ceil(companiesToProcess.length / batchSize)}`);

    const promises = batch.map(function (empresa) {
      return processDrugsForCompany(empresa.term);
    });

    await Promise.all(promises);
  }
}

// async function listReportsByDrugName(drugName: string) {
//   if (!drugName) {
//     console.log("listaReportsPorRemedio vazio, retornando lista vazia");
//     return {
//       results: {}
//     };
//   }
//
//   const url = "https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:REPLACE&limit=100";
//   return await fetchData(new URL(url.replace("REPLACE", drugName)));
// }
//
// async function cadastraReportsPorRemedio(remedio) {
//   if (!remedio) {
//     console.log("Nenhum remédio especificado para cadastrar relatórios");
//     return;
//   }
//
//   console.log(`Buscando relatórios para o medicamento: ${remedio}`);
//
//   const reports = await listReportsByDrugName(remedio);
//
//   if (!reports) {
//     console.log(`Nenhum relatório encontrado para o medicamento: ${remedio}`);
//     return;
//   }
//
//   console.log(`Encontrados ${reports.length} relatórios para o medicamento: ${remedio}`);
//
//   let processados = 0;
//
//   for (const reportData of reports) {
//     if (!reportData.receiver || !reportData.patient) continue;
//
//     try {
//       await processReport(reportData);
//       processados++;
//     } catch (error) {
//       console.error(`Erro ao processar relatório para o medicamento ${remedio}:`, error);
//     }
//   }
//
//   console.log(`Processados ${processados} relatórios para o medicamento: ${remedio}`);
// }

async function main() {
  try {
    console.log("Iniciando processo de importação de dados...");

    const [empresasData, efeitosAdversos] = await Promise.all([
      fetchCompanies(),
      fetchAdverseReactions()
    ]);

    console.log(`Recuperadas ${empresasData.length} empresas e ${efeitosAdversos.length} reações adversas`);

    await Promise.all([
      batchCreateCompanies(empresasData),
      batchCreateAdverseReactions(efeitosAdversos)
    ]);

    const companiesToProcess = empresasData.slice(0, 20);
    await processCompanyBatch(companiesToProcess);

    // await processAdverseEventReports(100);

    console.log("Processo de importação de dados concluído com sucesso");
  } catch (error) {
    console.error("Erro fatal no processo principal:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
