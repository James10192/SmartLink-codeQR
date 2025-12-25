import sharp from 'sharp'
import fs from 'fs'

async function optimizeImage(input: string, output: string) {
  await sharp(input)
    .resize(1920, null, {
      withoutEnlargement: true,
      fit: 'inside'
    })
    .webp({ quality: 85 })
    .toFile(output)

  const stats = fs.statSync(output)
  console.log(`✅ ${output} → ${(stats.size / 1024 / 1024).toFixed(2)}MB`)
}

async function main() {
  await optimizeImage(
    'public/traditional-card.png',
    'public/traditional-card-optimized.webp'
  )
  await optimizeImage(
    'public/smartlink-qr-card.png',
    'public/smartlink-qr-card-optimized.webp'
  )
}

main()
