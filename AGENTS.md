# Agent instructions

## ai-todo: ユーザーのアクションアイテムを自動記録する

作業中に「ユーザー(Kota)本人にしかできないアクション」が発生したら、発生したその場で
GitHub リポジトリ `KotaHiguchiKH/kpi-compass-build-week` に、ラベル `ai-todo` 付きの Issue として記録すること。
ユーザーは `todo/` の AI Todo アプリでこの一覧を消化する。

対象の例: 承認・意思決定、アカウント作成や API キー発行、支払い、実機や本番環境での動作確認、
外部サービスでの手動設定、他者への連絡。エージェント自身で完了できる作業(コード変更など)は対象外。

書き方:

- タイトル: ユーザーがやることを命令形で1行(例: 「Stripe の本番 API キーを発行して .env に設定する」)
- 本文: 必要な背景・手順・リンクを簡潔に。末尾に `_source: <プロジェクト名や会話の要約>_` を1行入れる
  (AI Todo アプリに発生元として表示される)
- 1アクション = 1 Issue。既に同じ内容の open Issue があれば作らない
- ユーザーから完了の報告を受けたら該当 Issue を close する

作成手段(使えるものを上から順に):

1. GitHub MCP ツール(issue の create)
2. `gh issue create -R KotaHiguchiKH/kpi-compass-build-week -l ai-todo -t "<title>" -b "<body>"`
3. `curl -sS -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/repos/KotaHiguchiKH/kpi-compass-build-week/issues -d '{"title":"<title>","body":"<body>","labels":["ai-todo"]}'`
