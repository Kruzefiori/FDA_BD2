import prisma from '../prisma/client';

export async function getDrugs(
  item: string,
  where: any,
  include: any,
  select: Record<string, boolean>
) {

  let query: any = { where }
  if (select && Object.keys(select).length > 0) {
    query.select = select;
  } else if (include && Object.keys(include).length > 0) {
    query.include = include;
  }
  console.log({
    item,
    where,
    include,
    select
  })
  switch(item) {
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
    case 'activeIngredient':
      return prisma.activeIngredient.findMany(query);
    case 'adverseReaction':
      return prisma.adverseReaction.findMany(query);
    case 'relAdverseReactionXDrug':
      return prisma.relAdverseReactionXDrug.findMany(query);
    case 'relAdverseReactionXReport':
      return prisma.relAdverseReactionXReport.findMany(query);
    case 'relReportXDrug':
      return prisma.relReportXDrug.findMany(query);
    default:
      throw new Error(`Unsupported item ${item}`);
  }
}
