# 請求書生成アプリ

Vanilla HTML/CSS/JavaScriptで構築された請求書生成Webアプリケーション

## 🚀 セットアップ

### 1. 環境変数の設定
`.env.example` をコピーして `.env.local` を作成し、Google Apps Script WebアプリURLを設定してください。

```bash
cp .env.example .env.local
```

`.env.local` を編集：
```env
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 2. Google Apps Script設定
`setup-instructions.md` の手順に従ってGoogle Apps Scriptを設定してください。

### 3. アプリの起動
ローカルサーバーで起動してください：

```bash
# Python 3の場合
python -m http.server 8000

# Node.jsの場合（serve パッケージ）
npx serve .
```

ブラウザで `http://localhost:8000` を開いてアプリを使用できます。

## 📁 ファイル構成

```
/
├── index.html              # メインHTML
├── css/
│   ├── style.css          # メインスタイル
│   └── print.css          # 印刷用スタイル
├── js/
│   ├── app.js             # メインロジック
│   ├── calculator.js      # 計算処理
│   ├── pdf-generator.js   # PDF生成
│   ├── google-sheets.js   # Google Sheets連携
│   └── env-loader.js      # 環境変数読み込み
├── .env.local             # 環境変数（要作成）
├── .env.example           # 環境変数サンプル
└── setup-instructions.md  # セットアップガイド
```

## ✨ 機能

- ✅ リアルタイムプレビュー
- ✅ PDF出力
- ✅ Google Sheets連携（縦型保存）
- ✅ 消費税10%固定計算
- ✅ レスポンシブデザイン
- ✅ 商品明細の動的追加・削除

## 🔧 技術仕様

- **フロントエンド**: Vanilla HTML/CSS/JavaScript
- **PDF生成**: html2pdf.js
- **データ保存**: Google Sheets (Apps Script)
- **消費税**: 10%固定