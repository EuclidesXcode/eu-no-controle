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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Sales table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bouquet_id UUID REFERENCES bouquets(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(10, 2) NOT NULL,
    cost_price_at_sale NUMERIC(10, 2), -- Snapshot of cost price at moment of sale
    tax_value NUMERIC(10, 2), -- Calculated tax based on card_tax
    commission_value NUMERIC(10, 2) DEFAULT 7.00, -- Commission at time of sale
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payment_method TEXT CHECK (payment_method IN ('Pix', 'Cartão Crédito', 'Cartão Débito', 'Dinheiro'))
);

-- Enable Row Level Security (RLS)
ALTER TABLE bouquets ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies (Simplifying for back-office, assuming authenticated users or just public for now if not setting up full Auth yet)
-- In a real scenario, you'd want: CREATE POLICY "Allow all for authenticated" ON bouquets FOR ALL USING (auth.role() = 'authenticated');
-- For now, I'll allow everything to make it easier to test, but I'll add a comment about it.

CREATE POLICY "Enable all for everyone" ON bouquets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for everyone" ON sales FOR ALL USING (true) WITH CHECK (true);
