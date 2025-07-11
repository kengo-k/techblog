---
title: "Git基本ワークフロー"
date: 2024-11-02T08:00:00+09:00
draft: false
tags: ["React", "JavaScript", "Web"]
categories: ["技術"]
months: ["2024-11"]
description: "Gitの基本的なワークフローとバージョン管理について解説します。。"
---

Git の基本的なワークフローとバージョン管理について解説します。

## Git 基本操作

Git は分散型バージョン管理システムです。

### 基本的なコマンド

```bash
# リポジトリの初期化
git init

# ファイルの追加
git add .
git add filename.txt

# コミット
git commit -m "コミットメッセージ"

# 状態確認
git status

# 履歴確認
git log --oneline

# リモートリポジトリの追加
git remote add origin https://github.com/user/repo.git

# プッシュ
git push origin main
```

## ブランチ操作

```bash
# ブランチの作成
git branch feature/new-feature

# ブランチの切り替え
git checkout feature/new-feature

# ブランチの作成と切り替え
git checkout -b feature/new-feature

# ブランチ一覧
git branch

# リモートブランチも含めて一覧
git branch -a

# ブランチの削除
git branch -d feature/new-feature
```

## マージとリベース

```bash
# マージ
git checkout main
git merge feature/new-feature

# リベース
git checkout feature/new-feature
git rebase main

# インタラクティブリベース
git rebase -i HEAD~3
```

## チーム開発ワークフロー

```bash
# リモートの最新を取得
git fetch origin

# プル（フェッチ + マージ）
git pull origin main

# コンフリクトの解決後
git add .
git commit -m "コンフリクト解決"

# プッシュ
git push origin feature/new-feature
```

## よく使用する Git コマンド

```bash
# 変更の取り消し
git checkout -- filename.txt

# コミットの取り消し
git reset HEAD~1

# 強制的にリセット
git reset --hard HEAD~1

# 特定のコミットに戻る
git reset --hard commit-hash

# 作業ディレクトリの一時保存
git stash

# 一時保存の復元
git stash pop

# リモートブランチの削除
git push origin --delete feature/old-feature
```

## GitHub でのプルリクエストワークフロー

```bash
# 1. フォーク・クローン
git clone https://github.com/your-username/repo.git

# 2. ブランチ作成
git checkout -b feature/improvement

# 3. 変更・コミット
git add .
git commit -m "機能追加: 新機能の実装"

# 4. プッシュ
git push origin feature/improvement

# 5. GitHub上でプルリクエスト作成
# 6. レビュー・マージ
```

## 実用的な設定

```bash
# ユーザー設定
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# エディタ設定
git config --global core.editor vim

# エイリアス設定
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status

# .gitignoreファイルの例
node_modules/
.env
*.log
dist/
.DS_Store
```

Git を効果的に使用することで、チーム開発をスムーズに進めることができます。
