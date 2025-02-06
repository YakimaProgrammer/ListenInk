#! /bin/bash

if_missing=false
for arg in "$@"; do
    if [[ "$arg" == "--if-missing" ]]; then
	if_missing=true
    fi
done

# Main logic
if [ "$if_missing" = true ]; then
    if [ -f "prisma/dev.db" ]; then
	#DB exists
	exit 0
    fi
fi

rm -f prisma/dev.db
npx prisma migrate dev --name init
npx tsx prisma/init-dev-database.ts
