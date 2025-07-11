---
title: "Node.js Expressの基本"
draft: false
tags: ["React", "JavaScript", "Web"]
categories: ["技術"]
months: ["2024-10"]
description: "Node.js Expressフレームワークの基本的な使い方とWebアプリケーションの構築方法について解説します。"
---

Node.js Expressフレームワークの基本的な使い方とWebアプリケーションの構築方法について解説します。

## Expressの基本概念

Expressは軽量で柔軟なNode.js Webアプリケーションフレームワークです。

### 基本的なサーバー構築

```javascript
const express = require('express');
const app = express();
const port = 3000;

// ミドルウェアの設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルートの定義
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## ルーティング

```javascript
// GET リクエスト
app.get('/users', (req, res) => {
  res.json({ users: [] });
});

// POST リクエスト
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  // ユーザー作成処理
  res.status(201).json({ id: 1, name, email });
});

// パラメータ付きルート
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({ id: userId, name: 'John Doe' });
});
```

## ミドルウェアの使用

```javascript
// ログミドルウェア
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
```

## RESTful APIの例

```javascript
const users = [];

// 全ユーザー取得
app.get('/api/users', (req, res) => {
  res.json(users);
});

// ユーザー作成
app.post('/api/users', (req, res) => {
  const user = {
    id: users.length + 1,
    ...req.body,
    createdAt: new Date()
  };
  users.push(user);
  res.status(201).json(user);
});

// ユーザー更新
app.put('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users[index] = { ...users[index], ...req.body };
  res.json(users[index]);
});

// ユーザー削除
app.delete('/api/users/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = users.findIndex(u => u.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  users.splice(index, 1);
  res.status(204).send();
});
```

Expressを使用することで、効率的にWebアプリケーションとAPIを構築できます。