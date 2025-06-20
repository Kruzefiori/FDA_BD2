import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.relAdverseReactionXReport.deleteMany();
  await prisma.relAdverseReactionXDrug.deleteMany();
  await prisma.relReportXDrug.deleteMany();
  await prisma.relActiveIngredientXDrug.deleteMany();

  await prisma.productActiveIngredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.activeIngredient.deleteMany();
  await prisma.shortages.deleteMany();
  await prisma.report.deleteMany();
  await prisma.adverseReaction.deleteMany();
  await prisma.drug.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  console.log('Todas as linhas foram apagadas.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());