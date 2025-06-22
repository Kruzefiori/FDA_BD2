// src/services/drugService.ts
import prisma from '../prisma/client';

export const getDrugs = async (table: string, where: any) => {
  console.log(where);
  switch (table) {
    case 'user':
      return await prisma.user.findMany({ where });
    case 'shortages':
      return await prisma.shortages.findMany({ where });
    case 'company':
      return await prisma.company.findMany({ where });
    case 'adverseReaction':
      return await prisma.adverseReaction.findMany({ where });
    case 'report':
      return await prisma.report.findMany({ where });
    case 'activeIngredient':
      return await prisma.activeIngredient.findMany({ where });
    case 'product':
      return await prisma.product.findMany({ where });
    case 'relAdverseReactionXDrug':
      return await prisma.relAdverseReactionXDrug.findMany({ where });
    case 'relAdverseReactionXReport':
      return await prisma.relAdverseReactionXReport.findMany({ where });
    case 'relReportXDrug':
      return await prisma.relReportXDrug.findMany({ where });
    case 'drug':
      return await prisma.drug.findMany({ where });
    default:
      return Promise.reject(new Error('Invalid table name'));
  }
};