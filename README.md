# AIお問い合わせ前さばきデモ

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![NextJS](https://img.shields.io/badge/Built_with-NextJS-blue)
![OpenAI API](https://img.shields.io/badge/Powered_by-OpenAI_API-orange)

Next.js と OpenAI Responses API を使った、お問い合わせ前さばきエージェントのデモです。  
ユーザーは `Customer View` で AI と会話し、AI はナレッジベースとツールを使って自己解決を支援します。解決が難しい場合は、適切な問い合わせ先メールアドレスへ案内します。

管理者は `Admin` 画面で以下を確認できます。

- 受信したお問い合わせ一覧
- 問い合わせ詳細と会話ログ
- 件数、カテゴリ別、ステータス別のダッシュボード
- ナレッジベース用の追加資料アップロード
- ベクトルストアの再構築



## 主な機能

- 顧客向けチャット画面と管理画面の分離
- OpenAI File Search を使ったナレッジ検索
- FAQ / Knowledge Base / 管理画面アップロード資料をまとめたベクトル化
- ユーザー問い合わせのローカル JSON 保存
- 問い合わせ一覧、詳細、簡易分析ダッシュボード
- 関数呼び出しによる注文確認、返金、返品などのデモ動作
- ストリーミング応答

## 画面構成

### `/`

トップページです。`/customer` と `/admin` への導線があります。

### `/customer`

顧客向けのチャット画面です。  
AI が直接返答し、回答生成中は待機表示が出ます。

### `/admin`

管理画面です。以下を表示します。

- お問い合わせ件数や平均メッセージ数
- カテゴリ別件数グラフ
- ステータス別グラフ
- 日別の流入推移
- お問い合わせ一覧
- お問い合わせ詳細と会話ログ
- ベクトルストア管理パネル

### `/init_vs`

ベクトルストア再構築用の単独ページです。  
現在は管理画面内のパネルからも同じ処理を実行できます。

## セットアップ

1. リポジトリを取得します

```bash
git clone https://github.com/openai/openai-support-agent-demo.git
cd openai-support-agent-demo
```

2. OpenAI API キーを設定します

`.env` を作成し、以下を設定してください。

```bash
OPENAI_API_KEY=<your-api-key>
```

3. 依存関係をインストールします

```bash
npm install
```

4. 開発サーバーを起動します

```bash
npm run dev
```

5. ベクトルストアを作成または再構築します

ブラウザで `http://localhost:3000/admin` を開き、`Vector Store` パネルから以下を実施します。

- 必要なら資料をアップロード
- `Rebuild vector store` を押す

再構築に成功した Vector Store は自動で active 設定されます。  
そのため、通常運用では `config/constants.ts` を毎回書き換える必要はありません。

`config/constants.ts` の `VECTOR_STORE_ID` は、初回起動時や設定ファイル未生成時のフォールバック値として扱われます。

## 管理画面での資料アップロード

管理画面では独自資料をアップロードできます。アップロードしたファイルはローカルに保存され、次回のベクトルストア再構築時に組み込まれます。

- 対応例: `.md`, `.txt`, `.pdf`, `.doc`, `.docx`, `.csv`, `.json`
- 保存先ファイル本体: `data/admin_uploads`
- メタデータ: `data/admin-documents.json`

現在の実装は「既存のベクトルストアに追加」ではなく、「毎回新しいベクトルストアを再構築し、その新しい ID を自動で active に切り替える」方式です。

## 問い合わせデータ

問い合わせログはデモ用にローカル JSON へ保存しています。

- 問い合わせ API: `app/api/inquiries/route.ts`
- 保存ロジック: `lib/inquiries-store.ts`
- 保存先: `data/inquiries.json`

保存される内容の例:

- 問い合わせカテゴリ
- 優先度
- ステータス
- 直近のユーザー発話
- 直近の AI 返答
- 会話ログ
- 推奨問い合わせ先メール

## 動作確認用の例

`/customer` で以下のような入力を試せます。

- `返金の方法を教えて`
- `注文をキャンセルしたい`
- `パスワードを忘れました`
- `配送が遅れています`
- `商品が破損していました`

管理画面では、これらの内容が問い合わせ一覧とグラフに反映されます。

## カスタマイズポイント

- プロンプトとモデル: `config/constants.ts`
- 利用可能ツール: `config/tools-list.ts`
- ツールの実装: `config/functions.ts`
- デモ用顧客情報・初期データ: `config/demoData.ts`
- 管理画面 UI: `app/admin/page.tsx`, `components/AdminDashboard.tsx`
- ベクトルストア管理 UI: `components/VectorStoreManager.tsx`

## 制約

- ツール実行はデモ用のプレースホルダーで、実データは更新しません
- ベクトルストア ID の更新は手動です
- 問い合わせ保存先は DB ではなくローカル JSON です
- 本番利用には認証、監査、ガードレール、権限制御などの追加実装が必要です

## ライセンス

MIT License です。詳細は [LICENSE](./LICENSE) を参照してください。
