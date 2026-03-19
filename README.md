# Ostrich SVG & PDF Pro

高性能なSVG・PDFユーティリティツールです。SVGの変換、PDFの分割、そしてGemini APIを活用した高度なOCR（テキスト・表抽出）機能を備えています。

## 🚀 主な機能

- **SVG 変換**: SVGファイルをPDFや画像フォーマットに高品質で変換。
- **PDF 分割**: 複数ページのPDFを個別のページに素早く分割。
- **Gemini OCR**: Google Gemini APIを使用して、画像からテキストや表データを高精度に抽出。
- **HEIC 対応**: iPhoneなどで使用されるHEIC形式の画像もサポート。
- **高速・安全**: ブラウザ上での処理を基本とし、セキュアで高速なユーザー体験を提供。

## 🛠 使用技術

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Motion (Framer Motion)
- **Libraries**: 
  - `jspdf` / `pdf-lib` (PDF操作)
  - `pdfjs-dist` (PDFレンダリング)
  - `jszip` (アーカイブ作成)
  - `@google/genai` (Gemini API 連携)
  - `lucide-react` (アイコン)

## 📦 セットアップと実行方法

### 1. リポジトリのクローン
```bash
git clone <your-repository-url>
cd ostrich-svg-pdf-pro
```

### 2. 依存関係のインストール
```bash
npm install
```

### 3. 環境変数の設定
プロジェクトのルートディレクトリに `.env` ファイルを作成し、Gemini APIキーを設定してください。

```env
VITE_GEMINI_API_KEY=あなたのAPIキー
```

### 4. 開発サーバーの起動
```bash
npm run dev
```

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
