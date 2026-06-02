# WebHashtag

WebHashtagは、ハッシュタグの仕組みをWeb全体に応用するプロトコルです。
プラットフォームの協力を必要とせず、どんなWebページでもタグサーバーへのリンクを貼るだけでタグに参加できます。

## 概念

- **タグサーバー (Tag Server)** — ハッシュタグを管理し、登録された記事一覧を保持するサーバー。APIのみを公開するヘッドレスなサーバーです。
- **コンテンツサーバー (Content Server)** — 記事ページにタグサーバーへのリンクを含む、あらゆる公開Webページ。特別なセットアップは不要です。

記事に `<a href="https://tag.example.com/tag/typescript">TypeScript</a>` のようなリンクを埋め込み、そのリンクを一度クリックするだけで登録が完了します。タグサーバーはRefererからページURLを取得し、バック検証でリンクの存在を確認してから登録します。これにより、ページのオーナーだけが自分のコンテンツを登録できます。

## 仕様

[spec/DRAFT.md](spec/DRAFT.md)

## 実装例

[impl/example-server](impl/example-server) — Bun + Elysia によるタグサーバーのリファレンス実装
