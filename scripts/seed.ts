import { eq, sql } from 'drizzle-orm'

import { CUSTOMER_TYPES } from '../src/constants/customer.constants'
import {
  ORDER_MOVEMENT_TYPES,
  ORDER_PAYMENT_METHODS,
  ORDER_STATUSES,
} from '../src/constants/order.constants'
import {
  WORK_ORDER_PRIORITIES,
  WORK_ORDER_STATUSES,
  WORK_ORDER_TYPES,
} from '../src/constants/work-order.constants'
import { db } from '../src/database'
import {
  categories,
  customers,
  elevators,
  orderItems,
  orderMovements,
  orderPayments,
  orders,
  products,
  sites,
  users,
  workOrders,
} from '../src/database/schema'
import { createPasswordHash } from '../src/utils/password.util'

const DEMO_EMAIL = 'demo@lift.local'

/** N gun once belirli saatte tarih uretir. */
function daysAgo(days: number, hours = 11, minutes = 0): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hours, minutes, 0, 0)
  return date
}

/** Demo verisi zaten var mi kontrol eder. */
async function hasDemoData(): Promise<boolean> {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_EMAIL)).limit(1)
  return Boolean(row)
}

/** Mevcut demo verisini temizler (--force ile). */
async function clearDemoData(): Promise<void> {
  await db.execute(sql`
    TRUNCATE TABLE
      order_payments,
      order_movements,
      order_items,
      orders,
      service_expenses,
      service_parts,
      service_log_photos,
      service_logs,
      work_orders,
      contracts,
      elevators,
      sites,
      customers,
      stock_movements,
      product_images,
      products,
      categories,
      refresh_tokens,
      token_blacklist,
      users
    RESTART IDENTITY CASCADE
  `)
}

/** Bos veritabanina test icin ornek kayitlar ekler. */
async function seedDemoData(): Promise<void> {
  const { hash, salt } = createPasswordHash('Demo1234!')

  const [user] = await db
    .insert(users)
    .values({
      username: 'demo',
      email: DEMO_EMAIL,
      phone: '05551234567',
      password: hash,
      salt,
    })
    .returning()

  if (!user) {
    throw new Error('Demo kullanici olusturulamadi.')
  }

  const userId = user.id

  const [catHalat, catMotor, catSensor, catSarf] = await db
    .insert(categories)
    .values([
      { name: 'Halat', description: 'Traksiyon ve governor halatlari' },
      { name: 'Kapı motoru', description: 'Kapi operatoru ve motor parcalari' },
      { name: 'Sensör', description: 'Limit, emniyet ve fotosel' },
      { name: 'Sarf', description: 'Yag, conta ve temizlik malzemeleri' },
    ])
    .returning()

  const categoryIds = [catHalat, catMotor, catSensor, catSarf]
  if (categoryIds.some((item) => !item)) {
    throw new Error('Kategori seed basarisiz.')
  }

  const productRows = await db
    .insert(products)
    .values([
        {
          sku: 'HLT-8-10',
          name: 'Çelik halat 8x10',
          description: '8mm celik halat, 100m rulo',
          price: '1250.00',
          unit: 'meter',
          stockQuantity: '500',
          categoryId: catHalat!.id,
          createdBy: userId,
        },
        {
          sku: 'KMT-750',
          name: 'Kapı motoru 750N',
          description: 'Otomatik kapi motoru seti',
          price: '4200.00',
          unit: 'piece',
          stockQuantity: '18',
          categoryId: catMotor!.id,
          createdBy: userId,
        },
        {
          sku: 'SNS-LIM-A',
          name: 'Limit switch seti',
          description: 'Kat ve seviye limit switch',
          price: '680.00',
          unit: 'piece',
          stockQuantity: '42',
          categoryId: catSensor!.id,
          createdBy: userId,
        },
        {
          sku: 'SRF-YAG-5',
          name: 'Asansör yağı 5L',
          description: 'Hidrolik yag, 5 litre',
          price: '320.00',
          unit: 'piece',
          stockQuantity: '60',
          categoryId: catSarf!.id,
          createdBy: userId,
        },
        {
          sku: 'SNS-FOTO',
          name: 'Fotosel çifti',
          description: 'Kapi kenar fotosel',
          price: '540.00',
          unit: 'piece',
          stockQuantity: '25',
          categoryId: catSensor!.id,
          createdBy: userId,
        },
      ])
      .returning()

  const [corpCustomer, corpCustomer2, individualCustomer] = await db
    .insert(customers)
    .values([
      {
        type: CUSTOMER_TYPES.CORPORATE,
        companyName: 'Atlas Plaza Yönetim A.Ş.',
        taxNumber: '1234567890',
        taxOffice: 'Kadıköy',
        contactPersonName: 'Mehmet Yılmaz',
        phone: '02161234567',
        email: 'servis@atlasplaza.com',
        address: 'Caferağa Mah. Moda Cad. No:12 Kadıköy / İstanbul',
        createdBy: userId,
      },
      {
        type: CUSTOMER_TYPES.CORPORATE,
        companyName: 'Bosphorus Residence Site Yönetimi',
        taxNumber: '9876543210',
        taxOffice: 'Beşiktaş',
        contactPersonName: 'Ayşe Demir',
        phone: '02129876543',
        email: 'yonetim@bosphorus.com',
        address: 'Bebek Mah. Cevdet Paşa Cad. No:45 Beşiktaş / İstanbul',
        createdBy: userId,
      },
      {
        type: CUSTOMER_TYPES.INDIVIDUAL,
        firstName: 'Ali',
        lastName: 'Kaya',
        nationalId: '12345678901',
        phone: '05321234567',
        email: 'ali.kaya@mail.com',
        address: 'Ataşehir / İstanbul',
        createdBy: userId,
      },
    ])
    .returning()

  const [siteAtlas, siteBosphorus, siteAli] = await db
    .insert(sites)
    .values([
      {
        customerId: corpCustomer!.id,
        name: 'Atlas Plaza A Blok',
        address: 'Moda Cad. No:12',
        city: 'İstanbul',
        district: 'Kadıköy',
        contactName: 'Mehmet Yılmaz',
        contactPhone: '02161234567',
        createdBy: userId,
      },
      {
        customerId: corpCustomer2!.id,
        name: 'Bosphorus Residence',
        address: 'Cevdet Paşa Cad. No:45',
        city: 'İstanbul',
        district: 'Beşiktaş',
        contactName: 'Ayşe Demir',
        contactPhone: '02129876543',
        createdBy: userId,
      },
      {
        customerId: individualCustomer!.id,
        name: 'Ali Kaya Konut',
        address: 'Barbaros Mah. Mor Sok. No:8',
        city: 'İstanbul',
        district: 'Ataşehir',
        contactPhone: '05321234567',
        createdBy: userId,
      },
    ])
    .returning()

  const [elevAtlasA, elevAtlasB, elevBosphorus, elevAli] = await db
    .insert(elevators)
    .values([
      {
        siteId: siteAtlas!.id,
        label: 'A1 Asansör',
        brand: 'Otis',
        model: 'Gen2',
        serialNumber: 'OT-A1-2019',
        capacity: '630 kg',
        status: 'active',
        createdBy: userId,
      },
      {
        siteId: siteAtlas!.id,
        label: 'A2 Yük Asansörü',
        brand: 'Schindler',
        model: '3300',
        serialNumber: 'SC-A2-2018',
        capacity: '1000 kg',
        status: 'active',
        createdBy: userId,
      },
      {
        siteId: siteBosphorus!.id,
        label: 'Blok B Asansör',
        brand: 'Kone',
        model: 'MonoSpace',
        serialNumber: 'KN-B-2020',
        capacity: '800 kg',
        status: 'active',
        createdBy: userId,
      },
      {
        siteId: siteAli!.id,
        label: 'Konut Asansörü',
        brand: 'Arkel',
        model: 'Easy',
        serialNumber: 'AR-K-2021',
        capacity: '450 kg',
        status: 'active',
        createdBy: userId,
      },
    ])
    .returning()

  await db.insert(workOrders).values([
    {
      elevatorId: elevAtlasA!.id,
      assignedTo: userId,
      type: WORK_ORDER_TYPES.PERIODIC_MAINTENANCE,
      status: WORK_ORDER_STATUSES.IN_PROGRESS,
      priority: WORK_ORDER_PRIORITIES.NORMAL,
      scheduledAt: daysAgo(0, 9),
      startedAt: daysAgo(0, 9, 30),
      description: 'Aylık periyodik bakım',
      createdBy: userId,
      createdAt: daysAgo(2),
    },
    {
      elevatorId: elevBosphorus!.id,
      assignedTo: userId,
      type: WORK_ORDER_TYPES.BREAKDOWN,
      status: WORK_ORDER_STATUSES.ASSIGNED,
      priority: WORK_ORDER_PRIORITIES.URGENT,
      scheduledAt: daysAgo(0, 14),
      description: 'Kapı kapanmıyor, acil müdahale',
      createdBy: userId,
      createdAt: daysAgo(0, 8),
    },
    {
      elevatorId: elevAtlasB!.id,
      type: WORK_ORDER_TYPES.INSPECTION,
      status: WORK_ORDER_STATUSES.PLANNED,
      priority: WORK_ORDER_PRIORITIES.NORMAL,
      scheduledAt: daysAgo(-3, 10),
      description: 'Yıllık muayene hazırlığı',
      createdBy: userId,
      createdAt: daysAgo(1),
    },
    {
      elevatorId: elevAli!.id,
      assignedTo: userId,
      type: WORK_ORDER_TYPES.BREAKDOWN,
      status: WORK_ORDER_STATUSES.POSTPONED,
      priority: WORK_ORDER_PRIORITIES.LOW,
      scheduledAt: daysAgo(1, 15),
      description: 'Ses geliyor, parça bekleniyor',
      internalNotes: 'Müşteri cumartesi uygun',
      createdBy: userId,
      createdAt: daysAgo(3),
    },
    {
      elevatorId: elevAtlasA!.id,
      assignedTo: userId,
      type: WORK_ORDER_TYPES.PERIODIC_MAINTENANCE,
      status: WORK_ORDER_STATUSES.COMPLETED,
      priority: WORK_ORDER_PRIORITIES.NORMAL,
      scheduledAt: daysAgo(7, 10),
      startedAt: daysAgo(7, 10, 15),
      completedAt: daysAgo(7, 12),
      description: 'Periyodik bakım tamamlandı',
      createdBy: userId,
      createdAt: daysAgo(8),
    },
    {
      elevatorId: elevBosphorus!.id,
      assignedTo: userId,
      type: WORK_ORDER_TYPES.BREAKDOWN,
      status: WORK_ORDER_STATUSES.COMPLETED,
      priority: WORK_ORDER_PRIORITIES.URGENT,
      scheduledAt: daysAgo(12, 8),
      startedAt: daysAgo(12, 8, 20),
      completedAt: daysAgo(12, 11),
      description: 'Fotosel arızası giderildi',
      createdBy: userId,
      createdAt: daysAgo(13),
    },
  ])

  const halat = productRows.find((item) => item.sku === 'HLT-8-10')!
  const motor = productRows.find((item) => item.sku === 'KMT-750')!
  const sensor = productRows.find((item) => item.sku === 'SNS-LIM-A')!
  const yag = productRows.find((item) => item.sku === 'SRF-YAG-5')!

  /** Pesin siparis kaydi olusturur. */
  async function insertCashOrder(input: {
    paymentMethodId: string
    createdAt: Date
    note?: string
    lines: { productId: string; productName: string; unitPrice: string; quantity: string }[]
  }) {
    const lineTotal = input.lines.reduce(
      (sum, line) => sum + Number(line.unitPrice) * Number(line.quantity),
      0
    )

    const [order] = await db
      .insert(orders)
      .values({
        paymentMethodId: input.paymentMethodId,
        status: ORDER_STATUSES.COMPLETED,
        total: lineTotal.toFixed(2),
        customerNote: input.note ?? null,
        createdBy: userId,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
      })
      .returning()

    if (!order) throw new Error('Siparis seed basarisiz.')

    await db.insert(orderItems).values(
      input.lines.map((line) => ({
        orderId: order.id,
        productId: line.productId,
        productName: line.productName,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
        lineTotal: (Number(line.unitPrice) * Number(line.quantity)).toFixed(2),
        createdAt: input.createdAt,
      }))
    )

    await db.insert(orderMovements).values([
      {
        orderId: order.id,
        type: ORDER_MOVEMENT_TYPES.ORDER_RECEIVED,
        label: 'Sipariş alındı',
        description: 'Demo seed kaydı',
        createdAt: input.createdAt,
      },
      {
        orderId: order.id,
        type: ORDER_MOVEMENT_TYPES.STOCK_OUT,
        label: 'Stok hareketi',
        description: `${input.lines.length} kalem depodan düşüldü`,
        createdAt: input.createdAt,
      },
    ])

    return order
  }

  await insertCashOrder({
    paymentMethodId: ORDER_PAYMENT_METHODS.NAKIT,
    createdAt: daysAgo(5),
    note: 'Atlas Plaza acil halat',
    lines: [{ productId: halat.id, productName: halat.name, unitPrice: '1250.00', quantity: '2' }],
  })

  await insertCashOrder({
    paymentMethodId: ORDER_PAYMENT_METHODS.HAVALE,
    createdAt: daysAgo(2),
    note: 'Bosphorus limit switch',
    lines: [
      { productId: sensor.id, productName: sensor.name, unitPrice: '680.00', quantity: '3' },
      { productId: yag.id, productName: yag.name, unitPrice: '320.00', quantity: '2' },
    ],
  })

  await insertCashOrder({
    paymentMethodId: ORDER_PAYMENT_METHODS.KREDI_KARTI_POS,
    createdAt: daysAgo(0, 16),
    note: 'Bugunku saha siparisi',
    lines: [{ productId: yag.id, productName: yag.name, unitPrice: '320.00', quantity: '1' }],
  })

  const vadeliTotal = 4200 + 680
  const [vadeliOrder] = await db
    .insert(orders)
    .values({
      paymentMethodId: ORDER_PAYMENT_METHODS.VADELI,
      status: ORDER_STATUSES.COMPLETED,
      total: String(vadeliTotal),
      customerNote: 'Vadeli demo siparis',
      createdBy: userId,
      createdAt: daysAgo(10),
      updatedAt: daysAgo(10),
    })
    .returning()

  if (!vadeliOrder) throw new Error('Vadeli siparis seed basarisiz.')

  await db.insert(orderItems).values([
    {
      orderId: vadeliOrder.id,
      productId: motor.id,
      productName: motor.name,
      unitPrice: '4200.00',
      quantity: '1',
      lineTotal: '4200.00',
      createdAt: daysAgo(10),
    },
    {
      orderId: vadeliOrder.id,
      productId: sensor.id,
      productName: sensor.name,
      unitPrice: '680.00',
      quantity: '1',
      lineTotal: '680.00',
      createdAt: daysAgo(10),
    },
  ])

  await db.insert(orderMovements).values([
    {
      orderId: vadeliOrder.id,
      type: ORDER_MOVEMENT_TYPES.ORDER_RECEIVED,
      label: 'Sipariş alındı',
      description: 'Vadeli açık hesap',
      createdAt: daysAgo(10),
    },
    {
      orderId: vadeliOrder.id,
      type: ORDER_MOVEMENT_TYPES.STOCK_OUT,
      label: 'Stok hareketi',
      description: '2 kalem depodan düşüldü',
      createdAt: daysAgo(10),
    },
  ])

  await db.insert(orderPayments).values([
    {
      orderId: vadeliOrder.id,
      amount: '2500.00',
      note: 'İlk tahsilat',
      createdBy: userId,
      createdAt: daysAgo(4),
    },
    {
      orderId: vadeliOrder.id,
      amount: '2380.00',
      note: 'Kalan bakiye',
      createdBy: userId,
      createdAt: daysAgo(1),
    },
  ])

  await db.insert(orderMovements).values([
    {
      orderId: vadeliOrder.id,
      type: ORDER_MOVEMENT_TYPES.PAYMENT_RECEIVED,
      label: 'Ödeme alındı',
      description: '2500.00 TL tahsil edildi',
      createdAt: daysAgo(4),
    },
    {
      orderId: vadeliOrder.id,
      type: ORDER_MOVEMENT_TYPES.PAYMENT_RECEIVED,
      label: 'Ödeme alındı',
      description: '2380.00 TL tahsil edildi',
      createdAt: daysAgo(1),
    },
  ])

  console.log('')
  console.log('Demo verisi yuklendi.')
  console.log('')
  console.log('  Giris bilgileri:')
  console.log('  E-posta : demo@lift.local')
  console.log('  Sifre   : Demo1234!')
  console.log('')
  console.log('  Icerik ozeti:')
  console.log('  - 4 kategori, 5 urun')
  console.log('  - 3 musteri, 3 tesis, 4 asansor')
  console.log('  - 6 is emri (acik, devam, tamamlanan, ertelenen)')
  console.log('  - 4 siparis (pesin + vadeli, kasa raporu icin farkli gunler)')
  console.log('')
}

/** CLI giris noktasi: bos DB'ye demo veri yukler. */
async function main(): Promise<void> {
  const force = process.argv.includes('--force')

  if (!force && (await hasDemoData())) {
    console.log('Demo verisi zaten mevcut (demo@lift.local).')
    console.log('Sifirdan yuklemek icin: bun run db:seed -- --force')
    return
  }

  if (force) {
    console.log('Mevcut veriler temizleniyor...')
    await clearDemoData()
  }

  console.log('Demo verisi yukleniyor...')
  await seedDemoData()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed basarisiz:', error)
    process.exit(1)
  })
