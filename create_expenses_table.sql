-- 経理管理用のexpensesテーブルを作成
CREATE TABLE IF NOT EXISTS expenses (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount integer NOT NULL CHECK (amount > 0),
    description text NOT NULL,
    category text NOT NULL DEFAULT '研究室物品',
    created_at timestamp with time zone DEFAULT now()
);

-- インデックスを作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- コメントを追加
COMMENT ON TABLE expenses IS '研究室の支出管理テーブル';
COMMENT ON COLUMN expenses.amount IS '支出金額（円）';
COMMENT ON COLUMN expenses.description IS '支出の詳細説明';
COMMENT ON COLUMN expenses.category IS '支出カテゴリ（研究室物品、設備費、消耗品、その他）';

