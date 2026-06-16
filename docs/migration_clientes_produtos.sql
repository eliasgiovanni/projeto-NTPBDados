-- Script de Migração para Banco de Dados Existente
-- Executar este script no PostgreSQL para aplicar as novas tabelas e colunas.

-- 1. Criar a tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    endereco VARCHAR(255),
    telefone VARCHAR(50),
    cpf VARCHAR(14)
);

-- 2. Inserir o registro padrão para vendas sem identificação (ID 1)
-- Se já existir o ID 1, não causará conflito.
INSERT INTO clientes (id, nome, endereco, telefone, cpf) 
VALUES (1, 'Consumidor Final', NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Ajustar a sequência do SERIAL para que o próximo ID inserido automaticamente comece após o 1
SELECT setval(pg_get_serial_sequence('clientes', 'id'), COALESCE(MAX(id), 1)) FROM clientes;

-- 3. Adicionar coluna 'cliente_id' na tabela 'vendas' associando à tabela 'clientes'
-- Definimos o padrão (DEFAULT) como 1 para vendas sem identificação anteriores e futuras.
ALTER TABLE vendas 
ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id) DEFAULT 1;

-- 4. Adicionar coluna 'descricao' na tabela 'produtos' para permitir gerenciar a descrição dos itens
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS descricao TEXT;
