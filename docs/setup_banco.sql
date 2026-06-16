-- Script de Criação do Banco de Dados NTPBDados
-- Data: 16/06/2026

-- 1. Criação das Tabelas
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    endereco VARCHAR(255),
    telefone VARCHAR(50),
    cpf VARCHAR(14)
);

CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estoque INTEGER NOT NULL DEFAULT 0,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'Ativo',
    sales INTEGER DEFAULT 0,
    descricao TEXT,
    criado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendas (
    id SERIAL PRIMARY KEY,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_venda DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    cliente_id INTEGER REFERENCES clientes(id) DEFAULT 1
);

CREATE TABLE IF NOT EXISTS itens_venda (
    id SERIAL PRIMARY KEY,
    venda_id INTEGER REFERENCES vendas(id) ON DELETE CASCADE,
    produto_id INTEGER REFERENCES produtos(id) ON DELETE SET NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario DECIMAL(10,2) NOT NULL
);

-- 2. Inserção de Dados Iniciais (Seed)
INSERT INTO categorias (nome, descricao) VALUES 
('Eletrônicos', 'Dispositivos eletrônicos e gadgets'),
('Periféricos', 'Teclados, mouses e monitores'),
('Acessórios', 'Fones de ouvido e cabos')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO clientes (id, nome, endereco, telefone, cpf) VALUES
(1, 'Consumidor Final', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Ajustar a sequência do SERIAL de clientes
SELECT setval(pg_get_serial_sequence('clientes', 'id'), COALESCE(MAX(id), 1)) FROM clientes;

INSERT INTO produtos (nome, preco, estoque, categoria_id, status, descricao) VALUES 
('Smartphone Galaxy S24', 4500.00, 15, 1, 'Em Alta', 'Celular topo de linha da Samsung com IA'),
('MacBook Air M2', 8200.00, 8, 1, 'Estável', 'Notebook ultrafino da Apple com processador M2'),
('Fone Sony XM5', 2100.00, 22, 3, 'Em Alta', 'Headphone com cancelamento de ruído ativo líder de mercado'),
('Monitor Gamer 27"', 1800.00, 12, 2, 'Estável', 'Monitor com taxa de atualização de 144Hz e tempo de resposta de 1ms'),
('Teclado Mecânico RGB', 450.00, 30, 2, 'Em Alta', 'Teclado switch azul com iluminação RGB customizável');

