# xPay - 研究室内の在庫管理システム

xPayは研究室内の食べ物や飲み物の在庫を管理し、簡単に購入できるWebアプリケーションです。

## 主な機能

### 🔐 認証・ユーザー管理
- **ログイン画面**: メールアドレスとパスワードでログイン
- **アカウント新規作成**: 名前、メールアドレス、パスワード、ロールを設定
- **ロール管理**: 
  - `member`: 一般メンバー（商品購入のみ可能）
  - `admin`: 管理者（在庫管理も可能、管理者パスワード「1234」が必要）
- **セッション管理**: ログイン状態の保持

### 🛍️ 商品管理・購入
- **商品一覧**: 在庫状況と価格を表示
- **ショッピングカート**: 商品の追加・削除・数量変更
- **チェックアウト**: 決済処理と在庫更新
- **在庫管理**: 管理者のみ商品の追加・編集・在庫調整

### 📊 データ管理
- **Supabase連携**: リアルタイムデータベース
- **在庫追跡**: 買値・売値・在庫数の管理
- **購入履歴**: 売上・購入数の記録

## 技術スタック

- **フレームワーク**: Next.js 15.4.2 (App Router)
- **フロントエンド**: React 19.1.0
- **スタイリング**: Tailwind CSS 4
- **データベース**: Supabase (PostgreSQL)
- **認証**: カスタム認証システム
- **言語**: TypeScript
- **状態管理**: React Context API

## セットアップ

### 1. リポジトリのクローン
```bash
git clone https://github.com/YumaKyogoku/xPay.git
cd xPay/xpay-app
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
`.env.local`ファイルを作成し、以下の内容を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=https://kuhhmdnmzeqkwkcohxye.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1aGhtZG5temVxa3drY29oeXllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0OTE3NTAsImV4cCI6MjA3MTA2Nzc1MH0.25W3B56Aw-SmFYWsU-K_9R1i6dVp46Ao_-cjIrP_Jzw
```

### 4. データベースの準備
Supabaseプロジェクトで以下のテーブルが作成されていることを確認してください：

#### users テーブル
```sql
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    role text CHECK (role IN ('admin', 'member')),
    password text NOT NULL,
    email text UNIQUE NOT NULL,
    total_deposit integer DEFAULT 0 CHECK (total_deposit >= 0),
    total_withdraw integer DEFAULT 0 CHECK (total_withdraw >= 0),
    balance integer DEFAULT 0,
    created_at timestamp DEFAULT now()
);
```

#### items テーブル
```sql
CREATE TABLE items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    buy_price integer CHECK (buy_price >= 0),
    sell_price integer CHECK (sell_price >= 0),
    stock integer DEFAULT 0,
    bought_count integer DEFAULT 0 CHECK (bought_count >= 0),
    sold_count integer DEFAULT 0 CHECK (sold_count >= 0),
    created_by uuid REFERENCES users(id),
    image bytea,
    created_at timestamp DEFAULT now()
);
```

#### money_table テーブル
```sql
CREATE TABLE money_table (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    deposit integer DEFAULT 0 CHECK (deposit >= 0),
    withdraw integer DEFAULT 0 CHECK (withdraw >= 0),
    created_at timestamp DEFAULT now()
);
```

### 5. 在庫更新関数の作成
Supabaseで以下のRPC関数を作成してください：

```sql
CREATE OR REPLACE FUNCTION decrement_stock(p_item_id uuid, p_quantity integer)
RETURNS void AS $$
BEGIN
    UPDATE items 
    SET stock = GREATEST(stock - p_quantity, 0)
    WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;
```

### 6. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

## 使用方法

### 初回利用
1. **アカウント作成**: `/register` にアクセスしてアカウントを作成
2. **ログイン**: `/login` でメールアドレスとパスワードを入力
3. **商品購入**: `/products` で商品を選択し、カートに追加

### 管理者機能
- **在庫管理**: `/inventory` で商品の追加・編集・在庫調整
- **管理者アカウント作成**: ロール選択で「管理者」を選択し、管理者パスワード「1234」を入力

### 一般ユーザー機能
- **商品閲覧**: 商品一覧の確認
- **購入**: カートへの追加とチェックアウト
- **履歴確認**: 購入履歴の確認

## 開発

### プロジェクト構造
```
xpay-app/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── login/          # ログイン画面
│   │   ├── register/       # アカウント作成画面
│   │   ├── products/       # 商品一覧
│   │   ├── cart/           # ショッピングカート
│   │   ├── checkout/       # 決済処理
│   │   ├── inventory/      # 在庫管理（管理者のみ）
│   │   └── layout.tsx      # ルートレイアウト
│   ├── components/         # 再利用可能コンポーネント
│   │   ├── Header.tsx      # ナビゲーションヘッダー
│   │   ├── ProductCard.tsx # 商品カード
│   │   └── ProtectedRoute.tsx # 認証保護コンポーネント
│   ├── contexts/           # React Context
│   │   ├── AuthContext.tsx # 認証状態管理
│   │   └── CartContext.tsx # カート状態管理
│   └── lib/                # ユーティリティ
│       ├── supabase.ts     # Supabaseクライアント
│       └── database.types.ts # データベース型定義
```

### 認証フロー
1. 未認証ユーザーは自動的に `/login` にリダイレクト
2. ログイン成功後、セッション情報をlocalStorageに保存
3. 認証が必要なページは `ProtectedRoute` コンポーネントで保護
4. 管理者機能は `requiredRole="admin"` で制限

### 状態管理
- **AuthContext**: ユーザー認証状態、ログイン・ログアウト・登録機能
- **CartContext**: ショッピングカートの状態、商品の追加・削除・数量変更

## ビルド

### 本番ビルド
```bash
npm run build
```

### 本番サーバーの起動
```bash
npm start
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## サポート

問題が発生した場合や質問がある場合は、GitHubのIssuesページで報告してください。
