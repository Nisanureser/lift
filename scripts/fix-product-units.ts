import { eq, inArray, sql } from 'drizzle-orm'

import { db } from '../src/database'
import { products } from '../src/database/schema'

/** Eski seed kayitlarindaki Turkce birim kodlarini API formatina cevirir. */
const UNIT_FIXES: Record<string, string> = {
  adet: 'piece',
  metre: 'meter',
}

/** Veritabanindaki gecersiz urun birimlerini duzeltir. */
async function fixProductUnits(): Promise<void> {
  const invalidUnits = Object.keys(UNIT_FIXES)
  const rows = await db
    .select({ id: products.id, unit: products.unit })
    .from(products)
    .where(inArray(products.unit, invalidUnits))

  if (rows.length === 0) {
    console.log('Duzeltilecek urun birimi yok.')
    return
  }

  for (const row of rows) {
    const nextUnit = UNIT_FIXES[row.unit]
    if (!nextUnit) continue

    await db
      .update(products)
      .set({ unit: nextUnit, updatedAt: sql`now()` })
      .where(eq(products.id, row.id))

    console.log(`  ${row.id}: ${row.unit} -> ${nextUnit}`)
  }

  console.log(`${rows.length} urun birimi guncellendi.`)
}

fixProductUnits()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Birim duzeltme basarisiz:', error)
    process.exit(1)
  })
