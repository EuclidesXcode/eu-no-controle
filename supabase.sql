-- ============================================================
-- SCHEMA COMPLETO - Temática Buquês
-- Execute isso em um banco novo (CREATE TABLE IF NOT EXISTS é seguro)
-- Para banco existente, use a seção ALTER TABLE no final
-- ============================================================

-- Create Bouquets table
CREATE TABLE IF NOT EXISTS bouquets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    card_tax NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    images TEXT[] DEFAULT '{}',
    fixed_commission NUMERIC(10, 2) NOT NULL DEFAULT 7.00,
    category TEXT DEFAULT 'premium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sales table (full schema)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bouquet_id UUID REFERENCES bouquets(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(10, 2) NOT NULL,
    cost_price_at_sale NUMERIC(10, 2),         -- Snapshot do custo no momento da venda
    tax_value NUMERIC(10, 2),                   -- Taxa calculada (% do cartão)
    commission_value NUMERIC(10, 2) DEFAULT 7.00, -- Comissão fixa no momento da venda
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method TEXT CHECK (payment_method IN ('Pix', 'Cartão Crédito', 'Cartão Débito', 'Dinheiro')),
    -- Campos do comprador (adicionados na v2)
    buyer_name TEXT,
    buyer_phone TEXT,
    buyer_address TEXT,
    wants_to_register BOOLEAN DEFAULT FALSE
);

-- Enable Row Level Security (RLS)
ALTER TABLE bouquets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Policies (abertas para facilitar testes — restrinja em produção)
CREATE POLICY "Enable all for everyone" ON bouquets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON sales FOR ALL USING (true) WITH CHECK (true);


-- ============================================================
-- MIGRAÇÕES — Execute apenas se a tabela já existir
-- ============================================================

-- Adiciona campos de comprador (v2)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS buyer_phone TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS buyer_address TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS wants_to_register BOOLEAN DEFAULT FALSE;

-- Adiciona commission_value caso não exista
ALTER TABLE sales ADD COLUMN IF NOT EXISTS commission_value NUMERIC(10, 2) DEFAULT 7.00;

-- Adiciona cost_price_at_sale caso não exista
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cost_price_at_sale NUMERIC(10, 2);

-- Adiciona tax_value caso não exista
ALTER TABLE sales ADD COLUMN IF NOT EXISTS tax_value NUMERIC(10, 2);

