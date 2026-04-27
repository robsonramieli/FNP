import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFile } from 'node:fs/promises'
import * as db from './db.js'

const app = new Hono()

app.get('/', async (c) => {
  try {
    const html = await readFile('./index.html', 'utf-8')
    return c.html(html)
  } catch {
    return c.text('index.html não encontrado', 404)
  }
})

app.get('/api/all', (c) => {
  try { return c.json(db.getAllData()) }
  catch (err) { return c.json({ error: err.message }, 500) }
})

app.post('/api/ingredient', async (c) => {
  try { const { id, value } = await c.req.json(); db.updateIngredient(id, value); return c.json({ ok: true }) }
  catch (err) { return c.json({ error: err.message }, 500) }
})

app.post('/api/fixed-cost', async (c) => {
  try { const { id, value } = await c.req.json(); db.updateFixedCost(id, value); return c.json({ ok: true }) }
  catch (err) { return c.json({ error: err.message }, 500) }
})

app.post('/api/variable-cost', async (c) => {
  try { const { id, value } = await c.req.json(); db.updateVariableCost(id, value); return c.json({ ok: true }) }
  catch (err) { return c.json({ error: err.message }, 500) }
})

app.post('/api/business-param', async (c) => {
  try { const { id, value } = await c.req.json(); db.updateBusinessParam(id, value); return c.json({ ok: true }) }
  catch (err) { return c.json({ error: err.message }, 500) }
})

app.post('/api/product-price', async (c) => {
  try { const { id, price } = await c.req.json(); db.updateProductPrice(id, price); return c.json({ ok: true }) }
  catch (err) { return c.json({ error: err.message }, 500) }
})

app.post('/api/reset', (c) => {
  try { db.resetAndReseed(); return c.json({ ok: true }) }
  catch (err) { return c.json({ error: err.message }, 500) }
})

app.use('/*', serveStatic({ root: './' }))

const port = 3000
console.log(`Servidor rodando em http://localhost:${port}`)
serve({ fetch: app.fetch, port })
