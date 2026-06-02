# example-server

WebHashtagタグサーバーのリファレンス実装です。Bun + Elysia で動作します。

## 設定

`.env.example` をコピーして `.env` を作成します。

```
SERVER_HOST=localhost:3000   # サーバーのホスト名(ポート含む)
SERVER_NAME=Example Tag Server
MODE=open                    # "open" または "closed"
SECRET_KEY=                  # MODE=closed の場合のみ必要
```

`MODE=closed` の場合、`SECRET_KEY` を空のまま一度起動するとキーが生成されてログに出力されます。それを `.env` に設定してください。

## 起動

```bash
bun install
bun run dev
```

サーバーは `http://localhost:3000` で起動します。

## トークン発行 (closedモード)

```bash
bun run scripts/issue-token.ts <url> <tag>
```
