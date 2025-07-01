# Recipe Manager - 製菓業向けレシピ・原価管理システム

製菓業向けの包括的なレシピ管理および原価計算システムです。原料の仕入れから製品の利益率分析まで、製菓業務のあらゆる側面をサポートします。

## 🌟 主な機能

### 📊 ダッシュボード
- 事業の全体概要を一目で把握
- 主要指標の表示（製品数、レシピ数、平均利益率など）
- 高利益率製品のランキング
- 原料価格トレンド分析
- 最近の仕入れ履歴

### 🥄 原料管理
- 原料マスターの完全なCRUD操作
- 商品名、一般名、レシピ表示名の管理
- 数量・単位の詳細設定
- 統一されたフォームバリデーション

### 📝 レシピ管理
- レシピの作成・編集・削除
- バージョン管理による履歴追跡
- 複雑度・作業量による分類
- 卵種別対応（全卵・卵白・卵黄）
- バッチサイズと出来高の管理
- リアルタイム原価計算

### 🛍️ 仕入れ履歴管理
- 仕入れデータの詳細記録
- 税率・割引率の自動計算
- 仕入先管理
- 価格トレンドの分析

### 🏷️ 製品管理と利益率分析
- レシピと製品の紐付け
- リアルタイム利益率計算
- 販売価格と原価の比較
- 包装材料の管理
- 賞味期限設定

### 🔍 高度な検索・フィルタリング
- 製品・レシピ・原料の横断検索
- ステータス・カテゴリー別フィルタリング
- 利益率による絞り込み
- リアルタイム検索結果表示

### 🥚 卵マスター管理
- 卵重量の詳細設定（全卵・卵白・卵黄）
- レシピでの卵種別使用量計算

## 🚀 技術スタック

### フロントエンド
- **React 18** - TypeScript
- **Tailwind CSS** - スタイリング
- **React Router** - ルーティング
- **カスタムフック** - 状態管理・バリデーション

### バックエンド
- **FastAPI** - Python Webフレームワーク
- **SQLAlchemy** - ORM
- **Pydantic v2** - データバリデーション
- **PostgreSQL** - データベース

### インフラ
- **Docker Compose** - コンテナオーケストレーション
- **nginx** - リバースプロキシ（本番環境用）

## 📦 セットアップ

### 前提条件
- Docker & Docker Compose
- Git

### インストール手順

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd recipi-manager
   ```

2. **環境変数の設定**
   ```bash
   # バックエンド用の.envファイルを作成
   cp backend/.env.example backend/.env
   
   # 必要に応じて環境変数を編集
   vi backend/.env
   ```

3. **Docker Composeでの起動**
   ```bash
   # コンテナの構築と起動
   docker-compose up --build
   
   # バックグラウンドで起動する場合
   docker-compose up -d --build
   ```

4. **アプリケーションへのアクセス**
   - フロントエンド: http://localhost:3006
   - バックエンドAPI: http://localhost:8000
   - API ドキュメント: http://localhost:8000/docs

### 開発環境のセットアップ

```bash
# フロントエンド開発
cd frontend
npm install
npm start

# バックエンド開発
cd backend
python -m venv venv
source venv/bin/activate  # Windowsの場合: venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## 🗄️ データベース構造

### 主要テーブル
- **ingredients** - 原料マスター
- **recipes** - レシピマスター
- **recipe_details** - レシピ詳細（原料配合）
- **products** - 製品マスター
- **purchase_history** - 仕入れ履歴
- **packaging_materials** - 包装材料
- **egg_master** - 卵重量設定

### 関係性
```
recipes (1) ←→ (N) recipe_details (N) ←→ (1) ingredients
recipes (1) ←→ (N) products
ingredients (1) ←→ (N) purchase_history
products (N) ←→ (1) packaging_materials
```

## 💼 使用方法

### 基本的なワークフロー

1. **原料登録**
   - 「原料」メニューから新規原料を登録
   - 商品名、数量、単位を設定

2. **レシピ作成**
   - 「レシピ」メニューから新規レシピを作成
   - 原料を選択し、使用量を入力
   - 卵を使用する場合は種別を選択

3. **仕入れ履歴入力**
   - 「仕入れ履歴」メニューから仕入れデータを入力
   - 税率・割引率を設定して正確な原価を記録

4. **製品登録と利益率分析**
   - 「製品」メニューから製品を登録
   - レシピと紐付けて販売価格を設定
   - 自動計算される利益率を確認

5. **ダッシュボードでの分析**
   - 「ダッシュボード」で全体の状況を把握
   - 利益率の高い製品や価格トレンドを確認

### 高度な機能

- **検索・フィルタリング**: 各一覧ページで詳細な絞り込みが可能
- **利益率分析**: 製品一覧で色分け表示された利益率をリアルタイム確認
- **原価計算**: レシピの原価から製品の利益率まで自動計算
- **価格トレンド**: 仕入れ価格の変動をダッシュボードで確認

## 🔧 設定

### 環境変数

```bash
# データベース設定
DATABASE_URL=postgresql://user:password@db:5432/recipe_manager

# アプリケーション設定
DEBUG=true
SECRET_KEY=your-secret-key-here

# CORS設定
ALLOWED_ORIGINS=http://localhost:3006,http://localhost:3000
```

### カスタマイズ

- **税率設定**: 仕入れ履歴で0%、8%、10%の税率を選択可能
- **単位設定**: g、kg、ml、l、個などの単位をサポート
- **卵重量設定**: 卵マスターで各部位の重量をカスタマイズ

## 📈 パフォーマンス最適化

- **バッチAPIの実装**: 複数レシピの詳細を一括取得
- **フロントエンドキャッシュ**: 計算結果のメモ化
- **遅延読み込み**: 大量データの効率的な表示
- **検索の最適化**: リアルタイム検索のパフォーマンス向上

## 🧪 テスト

```bash
# フロントエンドテスト
cd frontend
npm test

# バックエンドテスト
cd backend
pytest
```

## 🔐 セキュリティ

- **データバリデーション**: Pydanticによる厳密な入力検証
- **SQLインジェクション対策**: SQLAlchemy ORMの使用
- **CORS設定**: 適切なオリジン制限
- **環境変数**: 機密情報の安全な管理

## 📚 API ドキュメント

FastAPIの自動生成ドキュメントを http://localhost:8000/docs で確認できます。

### 主要エンドポイント
- `GET /recipes/` - レシピ一覧取得
- `POST /recipes/` - レシピ作成
- `GET /products/` - 製品一覧取得
- `POST /recipes/batch-details` - バッチレシピ詳細取得
- `GET /purchase-history/` - 仕入れ履歴取得
---

**Recipe Manager** は製菓業の効率的な運営をサポートするための包括的なソリューションです。原料管理から利益率分析まで、すべての業務プロセスを一元化し、データドリブンな意思決定を可能にします。