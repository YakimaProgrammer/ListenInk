import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const user = await prisma.user.create({
    data: {
      name: 'Barry B. Benson',
      email: 'doyoulike@jazz.com',
      categories: {
        create: {
          name: 'Films',
          color: 'blue',
          documents: {
            create: {
              s3key: 'ec05b36a4a68b40d3b4f8195907d2a64201672fd14d96a4502c679813288bcb8',
              name: 'Bee Movie',
              numpages: 1, 
              completed: true,
              bookmarks: {
                create: {
                  page: 0,
                  audiotime: 0,
                  order: 0
                },
              },
              order: 0
            },
          },
          order: 0
        },
      },
    },
  });

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
