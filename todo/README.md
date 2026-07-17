# AI Todo — 「私がボトルネック」をなくす仕組み

AI(Claude / Codex など)と作業していると、「Kota さん本人がやらないと進まないこと」
(承認、APIキー発行、支払い、実機確認…)が会話の中に埋もれて、そこで作業が止まりがちです。

この仕組みは、それを解決します。

```
AI との会話で「あなたのやること」が発生
        │  AI が自動で起票(CLAUDE.md / AGENTS.md のルール)
        ▼
GitHub Issues(ラベル: ai-todo)← ハブ。どの AI からも書き込める
        │                         └─(任意)Power Automate → Microsoft To Do
        ▼
AI Todo アプリ(todo/index.html)
   リニアなリスト表示 → チェック → 爽快な完了音とともに消える(Issue が close される)
```

バックエンドは **GitHub Issues** です。サーバー運用は不要で、Claude も Codex も
GitHub には最初からアクセスできるため、「AI がリストに書き込む」経路として最も確実です。

---

## 1. アプリを開く

ローカル:

```bash
npm run todo
# → http://localhost:4310
```

またはスマホからも使いたい場合は GitHub Pages を有効化:
リポジトリの **Settings → Pages → Deploy from a branch → `main` / (root)** を選ぶと、
`https://kotahiguchikh.github.io/kpi-compass-build-week/todo/` で開けます。

リスト表示だけならトークン不要です(public リポジトリのため)。

## 2. トークンを設定する(チェックで消す・手動追加に必要)

1. https://github.com/settings/personal-access-tokens/new を開く
2. Repository access: **Only select repositories** → `kpi-compass-build-week`
3. Permissions → Repository permissions → **Issues: Read and write** だけ付与
4. 生成されたトークン(`github_pat_...`)をアプリの **⚙ 設定** に貼って保存

トークンはブラウザの localStorage にのみ保存されます。

## 3. AI に「やること」を書き込ませる

このリポジトリで作業する Claude / Codex には、ルート直下の `CLAUDE.md` / `AGENTS.md` の
ルールが自動で効きます。**他のプロジェクトや普段の会話でも効かせるには**、同じルールを
グローバル設定に貼ってください:

- Claude Code: `~/.claude/CLAUDE.md`
- Codex CLI: `~/.codex/AGENTS.md`

貼るスニペット(`CLAUDE.md` の「ai-todo」セクションと同一):

```markdown
## ai-todo: ユーザーのアクションアイテムを自動記録する

作業中に「ユーザー(Kota)本人にしかできないアクション」が発生したら、発生したその場で
GitHub リポジトリ `KotaHiguchiKH/kpi-compass-build-week` に、ラベル `ai-todo` 付きの Issue として記録すること。

対象の例: 承認・意思決定、アカウント作成や API キー発行、支払い、実機や本番環境での動作確認、
外部サービスでの手動設定、他者への連絡。エージェント自身で完了できる作業(コード変更など)は対象外。

書き方:
- タイトル: ユーザーがやることを命令形で1行
- 本文: 背景・手順・リンクを簡潔に。末尾に `_source: <プロジェクト名や会話の要約>_` を1行入れる
- 1アクション = 1 Issue。既に同じ内容の open Issue があれば作らない
- ユーザーから完了の報告を受けたら該当 Issue を close する

作成手段(使えるものを上から順に):
1. GitHub MCP ツール(issue の create)
2. `gh issue create -R KotaHiguchiKH/kpi-compass-build-week -l ai-todo -t "<title>" -b "<body>"`
3. `curl -sS -X POST -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" https://api.github.com/repos/KotaHiguchiKH/kpi-compass-build-week/issues -d '{"title":"<title>","body":"<body>","labels":["ai-todo"]}'`
```

ChatGPT(Web)など Issue を直接作れない AI の場合は、カスタム指示に
「私のアクションアイテムが発生したら、会話の最後に『📌 あなたのやること』としてまとめて」と書き、
出てきた項目をアプリの入力欄から追加すれば同じリストに載ります。

## 4. (任意)Microsoft To Do に同期する

Power Automate に GitHub と Microsoft To Do の公式コネクタがあるので、ノーコードで橋渡しできます:

1. https://make.powerautomate.com → **作成 → 自動化したクラウド フロー**
2. トリガー: **GitHub — When a new issue is opened**(対象: このリポジトリ)
3. 条件: issue のラベルに `ai-todo` が含まれる場合のみ続行
4. アクション: **Microsoft To Do — Add a to-do**(タイトルに issue タイトルを渡す)

無料プランの範囲で動きます。逆方向(To Do で完了 → Issue close)も
「When a to-do is completed」トリガー + GitHub「Update an issue」で組めますが、まずは片方向で十分です。

## 運用メモ

- リストは既定で古い順(キュー)。「次にやるべき1件」が常に一番上に来ます
- 完了 = Issue close(`state_reason: completed`)。履歴は Issues の Closed に残ります
- 別リポジトリに移したくなったら、アプリの ⚙ 設定で owner/repo を変えるだけです
