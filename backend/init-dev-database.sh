rm prisma/dev.db
npx prisma migrate dev --name init
npx tsx prisma/init-dev-database.ts
