import Database from 'better-sqlite3';

const db = new Database('database.db');
db.pragma('journal_mode = WAL');

// ═══════════════════════════════════════════════════
// SCHEMA
// ═══════════════════════════════════════════════════
db.exec(`
  CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'un'
  );

  CREATE TABLE IF NOT EXISTS fixed_costs (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS variable_costs (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0,
    notes TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS business_params (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Frango',
    currentPrice REAL NOT NULL DEFAULT 0,
    cmvIdeal REAL NOT NULL DEFAULT 35,
    proteina REAL NOT NULL DEFAULT 0,
    embalagem REAL NOT NULL DEFAULT 0,
    ovo REAL NOT NULL DEFAULT 0,
    farinha_t REAL NOT NULL DEFAULT 0,
    farinha_r REAL NOT NULL DEFAULT 0,
    acomp REAL NOT NULL DEFAULT 0,
    molhos REAL NOT NULL DEFAULT 0,
    pardo REAL NOT NULL DEFAULT 0,
    extra REAL NOT NULL DEFAULT 0,
    extra_label TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS combos (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    day_label TEXT DEFAULT '',
    currentPrice REAL NOT NULL DEFAULT 0,
    discount_pct REAL NOT NULL DEFAULT 0,
    items TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS weekly_sales (
    id INTEGER PRIMARY KEY,
    product_name TEXT NOT NULL,
    day TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0
  );
`);

// ═══════════════════════════════════════════════════
// SEED — só executa se estiver vazio
// ═══════════════════════════════════════════════════
export function seed() {
  const count = db.prepare('SELECT count(*) as c FROM ingredients').get().c;
  if (count > 0) return;

  // ─── INGREDIENTES (preços unitários reais da planilha) ───
  const insertIng = db.prepare('INSERT INTO ingredients (id, label, value, unit) VALUES (?,?,?,?)');
  const ingredients = [
    // Embalagens (diferentes tamanhos)
    ['embalagem_p',      'Embalagem P',               1.52,  'un'],
    ['embalagem_m',      'Embalagem M',               2.05,  'un'],
    ['embalagem_g',      'Embalagem G',               2.60,  'un'],
    ['embalagem_kids',   'Embalagem Kids/Combo',      2.15,  'un'],
    ['embalagem_ind',    'Embalagem Individual',      1.33,  'un'],
    ['embalagem_bat',    'Embalagem Batata/Petisco',  1.52,  'un'],
    ['embalagem_bat_m',  'Embalagem Batata M',        1.52,  'un'],
    // Proteínas (preço por kg)
    ['frango_kg',        'Frango (kg)',               18.00, 'kg'],
    ['alcatra_kg',       'Alcatra (kg)',              45.00, 'kg'],
    ['coracao_kg',       'Coração (kg)',              22.00, 'kg'],
    ['coxinha_kg',       'Coxinha (kg)',              11.25, 'kg'],
    ['suino_kg',         'Filé Suíno (kg)',           16.00, 'kg'],
    ['linguica_kg',      'Linguiça Especial (kg)',    35.00, 'kg'],
    ['queijo_coalho_kg', 'Queijo Coalho (kg)',        35.00, 'kg'],
    ['tulipa_kg',        'Tulipa (kg)',               16.00, 'kg'],
    ['couve_flor_kg',    'Couve Flor (kg)',           10.62, 'kg'],
    // Ingredientes secos / outros
    ['ovo',              'Ovo (Un)',                   0.55, 'un'],
    ['farinha_t',        'Farinha de Trigo (kg)',      4.00, 'kg'],
    ['farinha_r',        'Farinha de Rosca (kg)',      8.00, 'kg'],
    ['acomp',            'Acompanhamento (porção)',    1.80, 'un'],
    ['molhos',           'Molhos (Un)',                1.50, 'un'],
    ['pardo',            'Sacola Pardo (Un)',           0.70, 'un'],
    ['pao_brioche',      'Pão Brioche (Un)',            1.70, 'un'],
    ['bacon_kg',         'Bacon Fatiado (kg)',         40.00, 'kg'],
    ['cheddar_bisnaga',  'Cheddar Bisnaga (1,1kg)',   28.00, 'un'],
    ['aneis_cebola',     'Anéis de Cebola (400g)',     8.59, 'un'],
    ['mini_churros',     'Mini Churros (pacote)',      21.38, 'un'],
    ['batata_kg',        'Batata Frita (kg)',          12.00, 'kg'],
    ['polenta_kg',       'Polenta (kg)',                6.00, 'kg'],
    ['aipim_kg',         'Aipim (kg)',                 6.00, 'kg'],
    // Bebidas
    ['suco_kapo',        'Suco Kapo (Un)',              2.50, 'un'],
    ['coca_2l',          'Coca-Cola 2L (compra)',       6.76, 'un'],
    ['coca_600ml',       'Coca-Cola 600ml (compra)',    3.25, 'un'],
    ['coca_lata',        'Coca-Cola Lata (compra)',     2.20, 'un'],
  ];
  for (const [id, label, value, unit] of ingredients) insertIng.run(id, label, value, unit);

  // ─── CUSTOS FIXOS ───
  const insertFix = db.prepare('INSERT INTO fixed_costs (id, label, value) VALUES (?,?,?)');
  const fixed = [
    ['aluguel',     'Aluguel',                           3000],
    ['agua_luz',    'Água e Luz',                         800],
    ['telefone',    'Telefone',                           150],
    ['internet',    'Internet',                           150],
    ['sistema',     'Sistema (Anove, Mr. Chef)',          200],
    ['jornais',     'Jornais / Rádio / Anúncios fixos',  200],
    ['mat_escrit',  'Mat. Escritório e Limpeza',          200],
    ['manutencao',  'Manut./Rep. Louças e Utensílios',    300],
    ['seguros',     'Seguros, Conta Banco e TEF',         150],
    ['contador',    'Contador',                           500],
    ['motoboy',     'Arrancada Motoboy',                  400],
    ['oleo',        'Óleo de Algodão',                    300],
    ['mkt',         'MKT (Tráfego, Anúncios)',            500],
  ];
  for (const [id, label, value] of fixed) insertFix.run(id, label, value);

  // ─── CUSTOS VARIÁVEIS (% sobre faturamento) ───
  const insertVar = db.prepare('INSERT INTO variable_costs (id, label, value, notes) VALUES (?,?,?,?)');
  const variables = [
    ['cmv',             'CMV (média dos produtos)',         34.98, 'Preencher pelo médio real'],
    ['impostos',        'Impostos (Simples Nacional)',       0,    'Depende da faixa de faturamento'],
    ['royalties',       'Royalties',                        2.00, ''],
    ['fundo_pub',       'Fundo de Publicidade e Programa',  0.50, ''],
    ['taxa_cartao',     'Taxas de Cartões',                 0,    'Depende da proporção dinheiro/cartão'],
    ['pessoal',         'Custos com Pessoal',               0,    'Salários, encargos, férias, 13º'],
  ];
  for (const [id, label, value, notes] of variables) insertVar.run(id, label, value, notes);

  // ─── PARÂMETROS DO NEGÓCIO ───
  const insertParam = db.prepare('INSERT INTO business_params (id, label, value) VALUES (?,?,?)');
  const params = [
    ['investimento_total', 'Investimento Total (R$)', 125000],
    ['cmv_ideal',          'CMV Ideal (%)',               35],
    ['percentual_cartao',  'Vendas no Cartão (%)',         70],
  ];
  for (const [id, label, value] of params) insertParam.run(id, label, value);

  // ─── PRODUTOS ───
  // Campos: id, name, category, currentPrice, cmvIdeal,
  //         proteina, embalagem, ovo, farinha_t, farinha_r,
  //         acomp, molhos, pardo, extra, extra_label
  // Todos os valores são R$ diretos (lidos da planilha)
  const insertProd = db.prepare(`
    INSERT INTO products
      (id,name,category,currentPrice,cmvIdeal,proteina,embalagem,ovo,farinha_t,farinha_r,acomp,molhos,pardo,extra,extra_label)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);
  const products = [
    // FRANGO
    [1,  'Frango P',                'Frango',   49.00, 35, 9.00,    1.52, 0.55, 0.60, 1.20, 1.80, 1.50, 0.70, 0,    ''],
    [2,  'Frango M',                'Frango',   75.00, 35, 16.20,   2.05, 1.10, 1.20, 2.00, 2.40, 3.00, 0.70, 0,    ''],
    [3,  'Frango G',                'Frango',   90.00, 35, 25.20,   2.60, 1.65, 1.80, 3.60, 3.60, 4.50, 0.70, 0,    ''],
    [4,  'Frango Kids',             'Frango',   35.00, 35, 4.50,    2.15, 0.55, 0.40, 0.80, 0.96, 1.50, 0.70, 2.50, 'Suco Kapo'],
    [5,  'Frango Individual',       'Frango',   30.00, 35, 4.50,    1.33, 0.55, 0.40, 0.80, 0.96, 1.50, 0.70, 0,    ''],
    // ALCATRA
    [6,  'Alcatra P',               'Alcatra',  69.00, 35, 18.90,   1.52, 1.10, 0.60, 1.20, 1.80, 1.50, 0.70, 0,    ''],
    // CORAÇÃO
    [7,  'Coração P',               'Coração',  59.00, 35, 11.00,   1.52, 1.10, 0.60, 1.20, 1.80, 1.50, 0.70, 0,    ''],
    // COXINHA
    [8,  'Coxinha P',               'Coxinha',  33.00, 35, 5.625,   1.52, 1.10, 0.60, 1.20, 1.80, 1.50, 0.70, 0,    ''],
    [9,  'Coxinha M',               'Coxinha',  45.00, 35, 8.4375,  2.05, 1.00, 1.20, 2.00, 2.40, 1.50, 0.70, 0,    ''],
    [10, 'Coxinha G',               'Coxinha',  65.00, 35, 11.25,   2.60, 1.65, 1.80, 3.60, 3.60, 4.50, 0.70, 0,    ''],
    // MISTOS
    [11, 'Misto Frango+Alcatra',    'Misto',    95.00, 35, 27.90,   2.05, 1.65, 1.20, 2.40, 3.60, 3.00, 0.70, 0,    ''],
    [12, 'Misto Frango+Coração',    'Misto',    95.00, 35, 20.00,   2.05, 1.65, 1.20, 2.40, 3.60, 3.00, 0.70, 0,    ''],
    [13, 'Mistão',                  'Misto',   130.00, 35, 38.90,   2.60, 2.75, 1.80, 3.60, 5.40, 4.50, 0.70, 0,    ''],
    [14, 'Mistinho Frango+Alcatra', 'Misto',    69.00, 35, 15.75,   1.52, 1.10, 1.20, 2.00, 1.80, 1.50, 0.70, 0,    ''],
    [15, 'Mistinho Frango+Coração', 'Misto',    65.00, 35, 10.00,   1.52, 1.10, 1.20, 2.00, 1.80, 1.50, 0.70, 0,    ''],
    [16, 'Mistinho Coração+Alcatra','Misto',    65.00, 35, 16.75,   1.52, 1.10, 1.20, 2.00, 1.80, 1.50, 0.70, 0,    ''],
    // FILÉ SUÍNO
    [17, 'Filé Suíno',              'Suíno',    49.00, 35, 8.00,    1.52, 1.00, 1.20, 1.20, 1.80, 1.50, 0.70, 0,    ''],
    // LINGUIÇA
    [18, 'Linguiça Especial',       'Linguiça', 59.00, 35, 14.00,   1.52, 1.10, 1.20, 1.20, 1.80, 1.50, 0.70, 0,    ''],
    // TULIPA
    [19, 'Tulipa P',                'Tulipa',   45.00, 35, 8.00,    1.52, 1.10, 0.60, 1.20, 1.80, 1.50, 0.70, 0,    ''],
    [20, 'Tulipa M',                'Tulipa',   60.00, 35, 12.00,   2.05, 1.00, 1.20, 2.00, 2.40, 3.00, 0.70, 0,    ''],
    [21, 'Tulipa G',                'Tulipa',   75.00, 35, 14.40,   2.60, 1.65, 1.80, 3.60, 3.60, 4.50, 0.70, 0,    ''],
    // COUVE FLOR
    [22, 'Couve Flor',              'Outros',   35.00, 35, 3.186,   1.52, 0.55, 1.00, 2.00, 1.80, 1.50, 0.70, 0,    ''],
    // PETISCOS / ACOMPANHAMENTOS
    [23, 'Batata Frita P',          'Petisco',  22.00, 35, 4.80,    1.52, 0,    0,    0,    0,    0,    0.70, 0,    ''],
    [24, 'Batata Frita Kids',       'Petisco',  16.90, 35, 4.36875, 1.33, 0,    0,    0,    0,    0,    0.70, 0,    ''],
    [25, 'Anéis de Cebola P',       'Petisco',  25.00, 35, 8.59,    1.52, 0,    0,    0,    0,    0,    0.70, 0,    ''],
    [26, 'Anéis de Cebola Kids',    'Petisco',  18.90, 35, 4.995,   1.33, 0,    0,    0,    0,    0,    0.70, 0,    ''],
    [27, 'Polenta P',               'Petisco',  23.20, 35, 2.90,    1.52, 0,    0,    0,    0,    0,    0.70, 0,    ''],
    [28, 'Polenta Kids',            'Petisco',  16.90, 35, 1.8125,  1.33, 0,    0,    0,    0,    0,    0.70, 0,    ''],
    [29, 'Aipim P',                 'Petisco',  30.90, 35, 5.56,    1.52, 0,    0,    0,    0,    0,    0.70, 0,    ''],
    [30, 'Aipim Kids',              'Petisco',  20.90, 35, 3.475,   1.33, 0,    0,    0,    0,    0,    0.70, 0,    ''],
    [31, 'Mini Churros Kids',       'Petisco',  24.90, 35, 5.6875,  1.33, 0,    0,    0,    0,    0,    0.70, 0,    ''],
    [32, 'Mini Churros Mini',       'Petisco',  16.90, 35, 2.84375, 1.65, 0,    0,    0,    0,    0,    0.70, 0,    ''],
    // QUEIJO COALHO
    [33, 'Queijo Coalho P',         'Queijo',   79.90, 35, 16.713,  1.52, 1.12, 0.4785, 1.05, 0,  0,    0.70, 0,    ''],
    [34, 'Queijo Coalho Kids',      'Queijo',   49.90, 35, 7.209,   1.33, 0.56, 0.319,  0.70, 0,  0,    0.70, 0,    ''],
    // LINGUIÇA KIDS
    [35, 'Linguiça Especial Kids',  'Linguiça', 39.90, 35, 8.3475,  1.33, 0.56, 0.319, 0.70, 1.398, 0, 0.70, 0,    ''],
    // FILÉ SUÍNO P
    [36, 'Filé Suíno P',            'Suíno',    59.90, 35, 8.64402, 1.52, 1.12, 0.4785, 1.05, 2.621, 3.00, 0.70, 0, ''],
    // BEBIDAS
    [37, 'Coca-Cola 2L',            'Bebida',   14.90, 40, 0,       0.90, 0,    0,    0,    0,    0,    0,    6.76, 'Coca 2L compra'],
    [38, 'Coca-Cola 600ml',         'Bebida',    9.90, 40, 0,       0.90, 0,    0,    0,    0,    0,    0,    4.05, 'Coca 600ml compra'],
    [39, 'Suco Kapo',               'Bebida',    5.00, 40, 0,       0,    0,    0,    0,    0,    0,    0,    2.50, 'Kapo compra'],
  ];
  for (const p of products) insertProd.run(...p);

  // ─── COMBOS ───
  const insertCombo = db.prepare('INSERT INTO combos (id,name,day_label,currentPrice,discount_pct,items) VALUES (?,?,?,?,?,?)');
  const combos = [
    [1, 'Combo Casal (2P)',    '',          88.70,  8, JSON.stringify(['Frango P','Batata Frita Kids','Coca-Cola 600ml'])],
    [2, 'Combo Família (3P)',  '',         141.70,  8, JSON.stringify(['Frango M','Batata Frita P','Coca-Cola 2L'])],
    [3, 'Combo Galera (4P)',   '',         156.70,  8, JSON.stringify(['Frango G','Batata Frita P','Coca-Cola 2L'])],
    [4, 'Combo Terça',         'Terça',     93.90,  8, JSON.stringify(['Frango P','Batata Frita Kids','Coca-Cola 600ml','Mini Churros Mini'])],
    [5, 'Combo Quarta',        'Quarta',   162.90,  8, JSON.stringify(['Frango M','Linguiça Especial Kids','Coca-Cola 2L','Mini Churros Mini'])],
    [6, 'Combo Quinta',        'Quinta',   167.95,  8, JSON.stringify(['Frango M','Batata Frita Kids','Mini Churros Kids','Coca-Cola 2L','Anéis de Cebola Mini'])],
    [7, 'Combo Sexta',         'Sexta',    145.05,  8, JSON.stringify(['Frango M','Mini Churros Kids','Coca-Cola 2L','Anéis de Aipim Mini'])],
    [8, 'Combo Sábado',        'Sábado',   161.89,  8, JSON.stringify(['Frango G','Batata Frita P','Coca-Cola 2L','Mini Churros Mini'])],
    [9, 'Combo Domingo (6P)',  'Domingo',  220.79,  8, JSON.stringify(['Frango G','Batata Frita Kids','Filé Suíno P','Coca-Cola 2L','Mini Churros Mini'])],
  ];
  for (const c of combos) insertCombo.run(...c);

  // ─── VENDAS SEMANAIS (Planilha2) ───
  const insertSale = db.prepare('INSERT INTO weekly_sales (product_name, day, quantity) VALUES (?,?,?)');
  const days = ['Terça','Quarta','Quinta','Sexta','Sábado','Domingo'];
  const sales = [
    ['Frango Kids', [7, 0, 3, 0, 0, 0]],
    ['Frango P',    [14, 7, 6, 24, 31, 30]],
    ['Frango M',    [0, 10, 10, 15, 8, 12]],
    ['Frango G',    [5, 0, 10, 11, 29, 8]],
  ];
  for (const [name, qtds] of sales) {
    days.forEach((day, i) => { if (qtds[i] > 0) insertSale.run(name, day, qtds[i]); });
  }

  console.log('[DB] Seed concluído com sucesso.');
}

// ═══════════════════════════════════════════════════
// QUERIES
// ═══════════════════════════════════════════════════
export function getAllData() {
  return {
    ingredients:   db.prepare('SELECT * FROM ingredients ORDER BY id').all(),
    fixedCosts:    db.prepare('SELECT * FROM fixed_costs ORDER BY id').all(),
    variableCosts: db.prepare('SELECT * FROM variable_costs ORDER BY id').all(),
    businessParams:db.prepare('SELECT * FROM business_params ORDER BY id').all(),
    products:      db.prepare('SELECT * FROM products ORDER BY category, name').all(),
    combos:        db.prepare('SELECT * FROM combos ORDER BY id').all().map(c => ({ ...c, items: JSON.parse(c.items) })),
    weeklySales:   db.prepare('SELECT * FROM weekly_sales ORDER BY product_name, day').all(),
  };
}

export function updateIngredient(id, value) {
  db.prepare('UPDATE ingredients SET value=? WHERE id=?').run(value, id);
}

export function updateFixedCost(id, value) {
  db.prepare('UPDATE fixed_costs SET value=? WHERE id=?').run(value, id);
}

export function updateVariableCost(id, value) {
  db.prepare('UPDATE variable_costs SET value=? WHERE id=?').run(value, id);
}

export function updateBusinessParam(id, value) {
  db.prepare('UPDATE business_params SET value=? WHERE id=?').run(value, id);
}

export function updateProductPrice(id, price) {
  db.prepare('UPDATE products SET currentPrice=? WHERE id=?').run(price, id);
}

export function resetAndReseed() {
  db.exec(`
    DELETE FROM ingredients; DELETE FROM fixed_costs; DELETE FROM variable_costs;
    DELETE FROM business_params; DELETE FROM products; DELETE FROM combos; DELETE FROM weekly_sales;
  `);
  seed();
}

seed();
