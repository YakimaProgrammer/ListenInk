import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  // Create 15 users
  for (let i = 0; i < 15; i++) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
      },
    });

    // Create 1-3 categories for each user
    const numCategories = faker.number.int({ min: 1, max: 3 });
    for (let j = 0; j < numCategories; j++) {
      const category = await prisma.category.create({
        data: {
          name: faker.commerce.department(),
          color: faker.color.human(),
          userId: user.id,
        },
      });

      // Create 1-15 documents for each category
      const numDocuments = faker.number.int({ min: 1, max: 15 });
      for (let k = 0; k < numDocuments; k++) {
        const document = await prisma.document.create({
          data: {
            s3key: faker.string.alphanumeric(64),
            name: faker.system.fileName(),
            numpages: faker.number.int({ min: 1, max: 500 }),
            completed: true,
            categoryId: category.id,
          },
        });

        // Create a random number of bookmarks for each document
        const numBookmarks = faker.number.int({ min: 1, max: 10 });
        for (let l = 0; l < numBookmarks; l++) {
          await prisma.bookmark.create({
            data: {
              page: faker.number.int({ min: 0, max: document.numpages }),
              audiotime: faker.number.int({ min: 0, max: 3600000 }), // max 1 hour in ms
              documentId: document.id,
            },
          });
        }
      }
    }
  }

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
