// src/services/drugService.ts
import prisma from '../prisma/client';

export const getDrugs = async (table: string, where: any, include: any) => {
  console.log('getDrugs called with table:', table);
  console.log('where conditions:', where);
  console.log('include relations:', include);

  switch (table) {
    case 'shortages':
      return await prisma.shortages.findMany({ where, include: { ...include, Drug: true } });
    case 'company':
      return await prisma.company.findMany({ where });
    case 'adverseReaction':
      return await prisma.adverseReaction.findMany({
        where,
        include: {
          ...include,
          drugs: {
            include: {
              Drug: true
            }
          },
          reportDrugs: {
            include: {
              Report: true
            }
          }
        }
      });
    case 'report':
      return await prisma.report.findMany({
        where,
        include: {
          ...include,
          drugs: {
            include: {
              Drug: true
            }
          },
          adverseReactions: {
            include: {
              AdverseReaction: true
            }
          }
        }
      });
    case 'activeIngredient':
      return await prisma.activeIngredient.findMany({
        where,
        include: { ...include, Product: true }
      });
    case 'product':
      return await prisma.product.findMany({ where, include });
    case 'relAdverseReactionXDrug':
      return await prisma.relAdverseReactionXDrug.findMany({
        where,
        include: {
          ...include,
          AdverseReaction: true,
          Drug: true
        }
      });
    case 'relAdverseReactionXReport':
      return await prisma.relAdverseReactionXReport.findMany({
        where,
        include: {
          ...include,
          AdverseReaction: true,
          Report: true
        }
      });
    case 'relReportXDrug':
      return await prisma.relReportXDrug.findMany({
        where,
        include: {
          ...include,
          Report: true,
          Drug: true
        }
      });
    case 'drug':
      return await prisma.drug.findMany({ where, include });
    default:
      return Promise.reject(new Error('Invalid table name'));
  }
};
