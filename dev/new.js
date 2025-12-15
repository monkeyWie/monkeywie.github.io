import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const [, , rawName] = process.argv

if (!rawName) {
  console.error('Usage: node dev/new.js <slug>')
  process.exit(1)
}

const slug = rawName.trim()
const now = new Date()

const formatDate = (date) => {
  const pad = (n) => n.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())
  const second = pad(date.getSeconds())
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

const content = `---
title: ${slug}
published: ${formatDate(now)}
categories: 
tags:
  - 
---

`

const postsDir = path.resolve(__dirname, '../src/content/posts')
const targetPath = path.join(postsDir, `${slug}.md`)

const run = async () => {
  await fs.mkdir(postsDir, { recursive: true })
  await fs
    .writeFile(targetPath, content, { encoding: 'utf8', flag: 'wx' })
    .catch(async (err) => {
      if (err.code === 'EEXIST') {
        console.error(`File already exists: ${targetPath}`)
        process.exit(1)
      }
      throw err
    })
  console.log(`Created ${targetPath}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
