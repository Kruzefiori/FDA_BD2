import prisma from '../prisma/client';

export async function getDrugs(
  item: string,
  where: any,
  include: any
) {
  switch(item) {
    case 'drug':
      return prisma.drug.findMany({
        where,
        include,
      });
    case 'report':
      return prisma.report.findMany({
        where,
        include,
      });
    case 'company':
      return prisma.company.findMany({
        where,
        include,
      });
    case 'shortages':
      return prisma.shortages.findMany({
        where,
        include,
      });
    case 'product':
      return prisma.product.findMany({
        where,
        include,
      });
    case 'activeIngredient':
      return prisma.activeIngredient.findMany({
        where,
        include,
      });
    case 'adverseReaction':
      return prisma.adverseReaction.findMany({
        where,
        include,
      });
    case 'relAdverseReactionXDrug':
      return prisma.relAdverseReactionXDrug.findMany({
        where,
        include,
      });
    case 'relAdverseReactionXReport':
      return prisma.relAdverseReactionXReport.findMany({
        where,
        include,
      });
    case 'relReportXDrug':
      return prisma.relReportXDrug.findMany({
        where,
        include,
      });
    default:
      throw new Error(`Unsupported item ${item}`);
  }
}
