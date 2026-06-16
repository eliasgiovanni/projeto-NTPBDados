import express from 'express';
import dotenv from 'dotenv';
// Dotenv deve vir antes de qualquer importação que use o banco
dotenv.config();

import cors from 'cors';
import pool from './db.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- ROTAS DA API ---

app.get('/', (req, res) => {
  res.send('API NTPBDados Rodando com PostgreSQL!');
});

// 1. Buscar Categorias
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categorias ORDER BY nome');
    res.json(result.rows);
  } catch (err) {
    console.error('ERRO /api/categories:', err);
    res.status(500).json({ error: 'Erro interno ao buscar categorias.' });
  }
});

// 2. Buscar Produtos
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nome as categoria_nome 
      FROM produtos p 
      LEFT JOIN categorias c ON p.categoria_id = c.id 
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('ERRO /api/products:', err);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// 3. Buscar Estatísticas do Dashboard
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const statsQuery = await pool.query(`
      SELECT 
        (SELECT COALESCE(SUM(total_venda), 0) FROM vendas) as receita_total,
        (SELECT COUNT(*) FROM vendas) as total_vendas,
        (SELECT COUNT(*) FROM produtos) as total_produtos,
        (SELECT COALESCE(AVG(total_venda), 0) FROM vendas) as ticket_medio
    `);
    
    const rankingQuery = await pool.query(`
      SELECT p.nome, c.nome as cat, p.status, p.preco, p.estoque, p.sales
      FROM produtos p
      JOIN categorias c ON p.categoria_id = c.id
      ORDER BY p.sales DESC
      LIMIT 5
    `);

    res.json({
      metrics: statsQuery.rows[0],
      ranking: rankingQuery.rows
    });
  } catch (err) {
    console.error('ERRO /api/dashboard/stats:', err);
    res.status(500).json({ error: 'Erro ao processar estatísticas.' });
  }
});

// 4. Registrar Venda (com suporte a múltiplos itens e cliente)
app.post('/api/sales', async (req, res) => {
  const { clienteId, productId, quantity, items } = req.body;
  const targetClienteId = clienteId ? Number(clienteId) : 1;

  // Normaliza os itens de venda para suportar tanto o formato legado quanto o novo
  let saleItems: { productId: number; quantity: number }[] = [];
  if (items && Array.isArray(items) && items.length > 0) {
    saleItems = items.map(item => ({
      productId: Number(item.productId),
      quantity: Number(item.quantity)
    }));
  } else if (productId && quantity) {
    saleItems = [{ productId: Number(productId), quantity: Number(quantity) }];
  } else {
    return res.status(400).json({ error: 'Nenhum item informado para a venda.' });
  }

  const dbClient = await pool.connect();
  try {
    await dbClient.query('BEGIN');
    
    let totalVenda = 0;
    const processedItems = [];
    
    // Validar estoque e calcular preços
    for (const item of saleItems) {
      const productRes = await dbClient.query('SELECT preco, estoque, nome FROM produtos WHERE id = $1', [item.productId]);
      if (productRes.rows.length === 0) {
        throw new Error(`Produto ID ${item.productId} não encontrado.`);
      }
      const { preco, estoque, nome } = productRes.rows[0];
      if (estoque < item.quantity) {
        throw new Error(`Estoque insuficiente para o produto "${nome}" (Estoque: ${estoque}, Solicitado: ${item.quantity}).`);
      }
      const totalItem = Number(preco) * Number(item.quantity);
      totalVenda += totalItem;
      processedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        precoUnitario: preco
      });
    }
    
    // Registrar a venda principal vinculando o cliente
    const vendaRes = await dbClient.query(
      'INSERT INTO vendas (total_venda, cliente_id) VALUES ($1, $2) RETURNING id',
      [totalVenda, targetClienteId]
    );
    const vendaId = vendaRes.rows[0].id;
    
    // Registrar os itens e dar baixa no estoque dos produtos
    for (const item of processedItems) {
      await dbClient.query(
        'INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES ($1, $2, $3, $4)',
        [vendaId, item.productId, item.quantity, item.precoUnitario]
      );
      await dbClient.query(
        'UPDATE produtos SET estoque = estoque - $1, sales = sales + $1 WHERE id = $2',
        [item.quantity, item.productId]
      );
    }
    
    await dbClient.query('COMMIT');
    res.json({ success: true, message: 'Venda processada com sucesso no PostgreSQL!' });
  } catch (err: any) {
    await dbClient.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    dbClient.release();
  }
});

// 5. Cadastrar Produto
app.post('/api/products', async (req, res) => {
  const { nome, preco, estoque, categoria_id, descricao } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO produtos (nome, preco, estoque, categoria_id, status, descricao) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nome, preco, estoque, categoria_id, 'Ativo', descricao || null]
    );
    res.json({ success: true, product: result.rows[0], message: 'Produto cadastrado com sucesso!' });
  } catch (err) {
    console.error('ERRO /api/products:', err);
    res.status(500).json({ error: 'Erro ao cadastrar produto.' });
  }
});

// 6. Atualizar Produto (Edição)
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { preco, estoque, descricao } = req.body;
  try {
    const result = await pool.query(
      'UPDATE produtos SET preco = $1, estoque = $2, descricao = $3 WHERE id = $4 RETURNING *',
      [preco, estoque, descricao || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    res.json({ success: true, product: result.rows[0], message: 'Produto atualizado com sucesso!' });
  } catch (err) {
    console.error('ERRO PUT /api/products:', err);
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

// 7. Buscar Clientes
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('ERRO /api/clients:', err);
    res.status(500).json({ error: 'Erro ao buscar clientes.' });
  }
});

// 8. Cadastrar Cliente
app.post('/api/clients', async (req, res) => {
  const { nome, endereco, telefone, cpf } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO clientes (nome, endereco, telefone, cpf) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, endereco || null, telefone || null, cpf || null]
    );
    res.json({ success: true, client: result.rows[0], message: 'Cliente cadastrado com sucesso!' });
  } catch (err) {
    console.error('ERRO /api/clients:', err);
    res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Servidor auditado rodando na porta ${port}`);
});
