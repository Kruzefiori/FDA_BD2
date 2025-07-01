import prisma from '../prisma/client';

export async function getDrugs(
  item: string,
  where: any,
  select: any,
  take: number = 100,
  skip: number = 0
) {
  let query: any = { where, select, take, skip };

  if (isNaN(take) || isNaN(skip)) {
    query.take = 1000; // Default take
    query.skip = 0;    // Default skip
  }

  console.dir({ item, query }, { depth: null });
  //return query
  switch (item.toLowerCase()) {
    case 'drug':
      return prisma.drug.findMany(query);
    case 'report':
      return prisma.report.findMany(query);
    case 'company':
      return prisma.company.findMany(query);
    case 'shortages':
      return prisma.shortages.findMany(query);
    case 'product':
      return prisma.product.findMany(query);
    case 'activeingredient':
      return prisma.activeIngredient.findMany(query);
    case 'adversereaction':
      return prisma.adverseReaction.findMany(query);

    // Relacionamentos ternários
    case 'reladversereactionxreport':
      return prisma.relAdverseReactionXReport.findMany(query);
    case 'relreportxdrug':
      return prisma.relReportXDrug.findMany(query);

    default:
      throw new Error(`Unsupported item ${item}`);
  }
}
