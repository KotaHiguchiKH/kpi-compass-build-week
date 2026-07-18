# kpi-compass-build-week

KPI Compass(月次売上CSV → 根拠つきブリーフ)のハッカソン成果物。`npm test` / `npm start` で動作。
`todo/` 配下は独立した「AI Todo」アプリ(下記参照)。

## ai-todo: ユーザーのアクションアイテムを自動記録する

作業中に「ユーザー(Kota)本人にしかできないアクション」が発生したら、発生したその場で
GitHub リポジトリ `KotaHiguchiKH/kpi-compass-build-week` に、ラベル `ai-todo` 付きの Issue として記録すること。
ユーザーは AI Todo アプリ(https://kotahiguchikh.github.io/kpi-compass-build-week/)でこの一覧を消化する。

対象の例: 承認・意思決定、アカウント作成や API キー発行、支払い、実機や本番環境での動作確認、
外部サービスでの手動設定、他者への連絡。エージェント自身で完了できる作業(コード変更など)は対象外。

### 本文フォーマット(レシピ形式・必須)

ユーザーは ADHD 特性があり、「手順を考える」「思い出す」「調べる」がタスク着手の障壁になる。
本文は **上から順に実行するだけで完了するチェックリスト** として書くこと。判断・調査・記憶を
一切ユーザーに残さない。アプリはこの形式を子チェックボックス・コピーボタン付きでレンダリングする。

ルール:

- タイトルは命令形で1行(例: 「Stripe の本番 API キーを発行して .env に設定する」)
- 手順は `- [ ] ` のチェックリスト。1ステップ = 1つの単純な操作(クリック、貼り付け、入力)
- 開くページは必ず **直リンク**(`https://...`)をステップ内に書く。「設定画面を開く」だけは禁止
- 実行するコマンドや AI に貼るプロンプトは、ステップの直後にコードブロックで置く
  (言語名 `bash` / `powershell` / `prompt` を付けるとアプリでラベル表示される)
- どこで何をするかまで指定する(「X をコピーして Y の Z 欄に貼る」)
- 末尾に以下のメタ行を入れる:
  - `_source: <プロジェクト名や会話の要約>_`(必須。アプリに発生元として表示される)
  - `_session: <このセッションのURL>_`(わかる場合のみ。アプリから元セッションに飛べる)
- 1アクション = 1 Issue。既に同じ内容の open Issue があれば作らない
- ユーザーから完了の報告を受けたら該当 Issue を close する

例:

````markdown
- [ ] https://dashboard.stripe.com/apikeys を開く
- [ ] 「本番キーを表示」をクリックして `sk_live_...` をコピーする
- [ ] 下のコマンドの `<キー>` を置き換えて、プロジェクトのターミナルに貼って実行する

```bash
echo "STRIPE_SECRET_KEY=<キー>" >> .env
```

- [ ] 完了したらこの Issue をチェックで消す

_source: ECサイト決済導入(Claude Code)_
_session: https://claude.ai/code/session_xxxx_
````

### 作成手段(使えるものを上から順に)

1. GitHub MCP ツール(issue の create)
2. `gh issue create -R KotaHiguchiKH/kpi-compass-build-week -l ai-todo -t "<title>" -b "<body>"`
3. `curl -sS -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/repos/KotaHiguchiKH/kpi-compass-build-week/issues -d '{"title":"<title>","body":"<body>","labels":["ai-todo"]}'`
