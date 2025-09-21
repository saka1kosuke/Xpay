-- Supabase RLSポリシー修正用SQL
-- このファイルの内容をSupabaseのSQL Editorで実行してください

-- 1. 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."users";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."users";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "public"."users";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "public"."users";

-- 2. 新しいRLSポリシーを作成
-- 全ユーザーが読み取り可能
CREATE POLICY "Enable read access for all users" ON "public"."users"
FOR SELECT USING (true);

-- 新規ユーザー登録時に挿入可能
CREATE POLICY "Enable insert for new user registration" ON "public"."users"
FOR INSERT WITH CHECK (true);

-- ユーザーは自分の情報のみ更新可能
CREATE POLICY "Enable update for users based on user_id" ON "public"."users"
FOR UPDATE USING (auth.uid()::text = id);

-- 管理者は全ユーザーの情報を更新可能
CREATE POLICY "Enable update for admins" ON "public"."users"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "public"."users" 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- 3. itemsテーブルのRLSポリシーも確認・修正
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."items";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."items";
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON "public"."items";

CREATE POLICY "Enable read access for all users" ON "public"."items"
FOR SELECT USING (true);

CREATE POLICY "Enable insert for admins only" ON "public"."items"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "public"."users" 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

CREATE POLICY "Enable update for admins only" ON "public"."items"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "public"."users" 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- 4. transactionsテーブルのRLSポリシー
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON "public"."transactions";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."transactions";

CREATE POLICY "Enable read access for users based on user_id" ON "public"."transactions"
FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Enable insert for authenticated users only" ON "public"."transactions"
FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 管理者は全取引履歴を読み取り可能
CREATE POLICY "Enable read access for admins" ON "public"."transactions"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "public"."users" 
    WHERE id = auth.uid()::text AND role = 'admin'
  )
);
