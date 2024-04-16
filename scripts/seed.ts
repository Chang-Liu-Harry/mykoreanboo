const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()


async function main() {
  try {
    await db.category.createMany({
      data: [
        { name: 'Philosophy' },
        { name: 'Scientists' },
        { name: 'Enterpreneurs' },
        { name: 'Musicians' },
        { name: 'Sports' },
        { name: 'Famous People' },
        { name: 'Games' },
      ]
    })

  } catch (error) {
    console.error(error)
  } finally {
    await db.$disconnect()
  }
}

main()