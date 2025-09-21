-- xPayアプリケーション用のデータベーステーブル作成スクリプト

-- 1. users テーブル（ユーザー管理）
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    role text CHECK (role IN ('admin', 'member')) NOT NULL,
    password text NOT NULL,
    email text UNIQUE NOT NULL,
    total_deposit integer DEFAULT 0 CHECK (total_deposit >= 0),
    total_withdraw integer DEFAULT 0 CHECK (total_withdraw >= 0),
    balance integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    buy_price integer CHECK (buy_price >= 0),
    sell_price integer CHECK (sell_price >= 0),
    stock integer DEFAULT 0,
    bought_count integer DEFAULT 0 CHECK (bought_count >= 0),
    sold_count integer DEFAULT 0 CHECK (sold_count >= 0),
    created_by uuid REFERENCES users(id),
    -- 追加フィールド
    description text,
    category text,
    image_url text,
    expiry_date date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS money_table (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    deposit integer DEFAULT 0 CHECK (deposit >= 0),
    withdraw integer DEFAULT 0 CHECK (withdraw >= 0),
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount integer NOT NULL CHECK (amount > 0),
    description text NOT NULL,
    category text NOT NULL DEFAULT '研究室物品',
    created_at timestamp with time zone DEFAULT now()
);

-- 5. incomes テーブル（収入管理：手入力・全体残高追加など）
CREATE TABLE IF NOT EXISTS incomes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount integer NOT NULL CHECK (amount > 0),
    description text NOT NULL,
    source text NOT NULL DEFAULT 'manual', -- manual | overall | other
    created_at timestamp with time zone DEFAULT now()
);

-- 6. transactions テーブル（ユーザー別入出金履歴：管理画面でのチャージ/引き出し）
CREATE TABLE IF NOT EXISTS transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('deposit', 'withdraw', 'purchase')),
    amount integer NOT NULL CHECK (amount > 0),
    description text,
    related_order_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at);
CREATE INDEX IF NOT EXISTS idx_money_table_user_id ON money_table(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_incomes_created_at ON incomes(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- 在庫更新関数の作成
CREATE OR REPLACE FUNCTION decrement_stock(p_item_id uuid, p_quantity integer)
RETURNS void AS $$
BEGIN
    UPDATE items 
    SET stock = GREATEST(stock - p_quantity, 0)
    WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;

-- テーブルコメントの追加
COMMENT ON TABLE users IS 'ユーザー管理テーブル';
COMMENT ON TABLE items IS '商品管理テーブル';
COMMENT ON TABLE money_table IS '残高管理テーブル';
COMMENT ON TABLE expenses IS '支出管理テーブル';

-- サンプルデータの挿入（テスト用）
-- 管理者ユーザーの作成
INSERT INTO users (name, email, password, role) VALUES
('管理者', 'admin@example.com', 'admin123', 'admin')
ON CONFLICT (email) DO NOTHING;

-- サンプル商品の追加
INSERT INTO items (name, buy_price, sell_price, stock, bought_count) VALUES
('コーラ', 100, 150, 10, 10),
('お茶', 80, 120, 15, 15),
('チョコレート', 120, 200, 8, 8)
ON CONFLICT DO NOTHING;

-- サンプル支出の追加
INSERT INTO expenses (amount, description, category) VALUES
(5000, 'コピー用紙購入', '研究室物品'),
(12000, 'プリンター用トナー', '消耗品')
ON CONFLICT DO NOTHING;

