// src/services/drugService.ts
import prisma from '../prisma/client';

export const getDrugs = async (table: string, where: any) => {
  console.log(where);
  switch (table) {
    case 'shortages':
      return await prisma.shortages.findMany({ 
        where,
        include: { Drug: true } 
      });
    case 'company':
      return await prisma.company.findMany({ where });
    case 'adverseReaction':
      return await prisma.adverseReaction.findMany({ 
        where,
        include: { 
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
        include: { Product: true }
      });
    case 'product':
      return await prisma.product.findMany({ where });
    case 'relAdverseReactionXDrug':
      return await prisma.relAdverseReactionXDrug.findMany({ 
        where,
        include: { 
          AdverseReaction: true,
          Drug: true 
        } 
      });
    case 'relAdverseReactionXReport':
      return await prisma.relAdverseReactionXReport.findMany({ 
        where,
        include: { 
          AdverseReaction: true,
          Report: true 
        } 
      });
    case 'relReportXDrug':
      return await prisma.relReportXDrug.findMany({ 
        where,
        include: { 
          Report: true,
          Drug: true 
        } 
      });
    case 'drug':
      return await prisma.drug.findMany({ where });
    default:
      return Promise.reject(new Error('Invalid table name'));
  }
};