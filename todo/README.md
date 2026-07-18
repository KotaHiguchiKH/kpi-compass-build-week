# AI Todo — 「私がボトルネック」をなくす仕組み

AI(Claude / Codex など)と作業していると、「Kota さん本人がやらないと進まないこと」
(承認、APIキー発行、支払い、実機確認…)が会話の中に埋もれて、そこで作業が止まりがちです。

この仕組みは、それを解決します。

```
AI との会話で「あなたのやること」が発生
        │  AI がレシピ形式(手順チェックリスト+直リンク+コピペ素材)で自動起票
        ▼
GitHub Issues(ラベル: ai-todo)← ハブ。どの AI からも書き込める
        │                         └─(任意)Power Automate → Microsoft To Do
        ▼
AI Todo アプリ(PWA)
   上から順に手順を消化 → チェック → 爽快な完了音とともに消える(Issue が close される)
```

バックエンドは **GitHub Issues** です。サーバー運用は不要で、Claude も Codex も
GitHub には最初からアクセスできるため、「AI がリストに書き込む」経路として最も確実です。

## 1. アプリを開く・インストールする

アプリの URL(main に push されると GitHub Actions が自動デプロイ):

**https://kotahiguchikh.github.io/kpi-compass-build-week/**

普通のアプリのように使うには:

- **PC (Chrome/Edge)**: 上のURLを開く → アドレスバー右端のインストールアイコン(⊕ / モニタに↓)をクリック
  → 以後、タスクバーやスタートメニューから単独ウィンドウで起動できる
- **Android (Chrome)**: URLを開く → メニュー(⋮) → 「アプリをインストール」または「ホーム画面に追加」
- **iPhone (Safari)**: URLを開く → 共有ボタン → 「ホーム画面に追加」

リスト表示だけならトークン不要です(public リポジトリのため)。

## 2. トークンを設定する(チェックで消す・手動追加に必要)

1. https://github.com/settings/personal-access-tokens/new を開く
2. Token name は `ai-todo` など何でもよい。Expiration は Custom で最長を選ぶ
3. Repository access: **Only select repositories** → `kpi-compass-build-week`
4. Permissions → Repository permissions → **Issues: Read and write** だけ付与
5. 生成されたトークン(`github_pat_...`)をアプリの **⚙ 設定** に貼って保存

トークンはブラウザの localStorage にのみ保存されます。

## 3. AI に「やること」を書き込ませる

このリポジトリで作業する Claude / Codex には、ルート直下の `CLAUDE.md` / `AGENTS.md` の
ルールが自動で効きます。ポイントは **レシピ形式の強制**:

- 手順は `- [ ]` の子チェックリスト(アプリで1つずつチェックできる)
- 開くページは直リンク、コマンドや AI へのプロンプトはコードブロック(アプリでワンクリックコピー)
- `_source:` で発生元、`_session:` で元セッションへのリンクを表示

**他のプロジェクトや普段の会話でも効かせるには**、`CLAUDE.md` の「ai-todo」セクション全体を
グローバル設定にコピーしてください:

- Claude Code: `~/.claude/CLAUDE.md`
- Codex CLI: `~/.codex/AGENTS.md`

(Issue #2 に、貼るだけで済むワンショットコマンドを用意してあります)

ChatGPT(Web)など Issue を直接作れない AI の場合は、カスタム指示に
「私のアクションアイテムが発生したら、レシピ形式(手順チェックリスト+URL+コピペ素材)でまとめて」と
書き、出てきた項目をアプリの入力欄から追加するか、Issue に貼り付けてください。

## 4. (任意)Microsoft To Do に同期する

Power Automate に GitHub と Microsoft To Do の公式コネクタがあるので、ノーコードで橋渡しできます:

1. https://make.powerautomate.com → **作成 → 自動化したクラウド フロー**
2. トリガー: **GitHub — When a new issue is opened**(対象: このリポジトリ)
3. 条件: issue のラベルに `ai-todo` が含まれる場合のみ続行
4. アクション: **Microsoft To Do — Add a to-do**(タイトルに issue タイトルを渡す)

無料プランの範囲で動きます。逆方向(To Do で完了 → Issue close)も
「When a to-do is completed」トリガー + GitHub「Update an issue」で組めますが、まずは片方向で十分です。

## 開発メモ

- ローカル起動: `npm run todo` → http://localhost:4310(PWA機能は https か localhost でのみ有効)
- デプロイ: `.github/workflows/pages.yml` が `todo/` を GitHub Pages に公開(main への push で自動)
- リストは既定で古い順(キュー)。「次にやるべき1件」が常に一番上に来て自動で開く
- 完了 = Issue close(`state_reason: completed`)。履歴は Issues の Closed に残る
- 子ステップのチェックは Issue 本文の `- [ ]` → `- [x]` として同期される
- 別リポジトリに移す場合はアプリの ⚙ 設定で owner/repo を変えるだけ
