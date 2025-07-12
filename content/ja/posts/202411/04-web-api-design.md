---
title: "Web API設計のベストプラクティス"
tags: ["React", "JavaScript", "Web"]
description: "RESTful APIの設計原則とベストプラクティスについて解説します。"
---

RESTful APIの設計原則とベストプラクティスについて解説します。

## RESTful API設計原則

RESTは代表的なWebAPI設計アーキテクチャです。

### 基本的なHTTPメソッド

```http
# リソースの取得
GET /api/users
GET /api/users/123

# リソースの作成
POST /api/users
Content-Type: application/json

{
  "name": "田中太郎",
  "email": "tanaka@example.com"
}

# リソースの更新
PUT /api/users/123
Content-Type: application/json

{
  "name": "田中太郎",
  "email": "tanaka-new@example.com"
}

# リソースの削除
DELETE /api/users/123
```

## URL設計

```http
# 良い例
GET /api/users              # ユーザー一覧
GET /api/users/123          # 特定のユーザー
GET /api/users/123/orders   # ユーザーの注文一覧
POST /api/users             # ユーザー作成
PUT /api/users/123          # ユーザー更新
DELETE /api/users/123       # ユーザー削除

# 悪い例
GET /api/getUsers
POST /api/createUser
GET /api/user?action=delete
```

## レスポンス設計

```json
// 成功レスポンス
{
  "success": true,
  "data": {
    "id": 123,
    "name": "田中太郎",
    "email": "tanaka@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}

// リスト取得レスポンス
{
  "success": true,
  "data": [
    {
      "id": 123,
      "name": "田中太郎",
      "email": "tanaka@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 100,
    "total_pages": 10
  }
}

// エラーレスポンス
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "email",
        "message": "メールアドレスの形式が不正です"
      }
    ]
  }
}
```

## ステータスコード

```http
# 成功
200 OK          # 取得成功
201 Created     # 作成成功
204 No Content  # 削除成功（レスポンスボディなし）

# クライアントエラー
400 Bad Request       # リクエストが不正
401 Unauthorized      # 認証が必要
403 Forbidden         # 権限がない
404 Not Found         # リソースが見つからない
422 Unprocessable Entity  # バリデーションエラー

# サーバーエラー
500 Internal Server Error  # サーバー内部エラー
503 Service Unavailable   # サービス利用不可
```

## 認証とセキュリティ

```http
# JWT認証
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Key認証
X-API-Key: your-api-key-here

# Basic認証
Authorization: Basic dXNlcm5hbWU6cGFzc3dvcmQ=
```

## バージョニング

```http
# URLパスでのバージョニング
GET /api/v1/users
GET /api/v2/users

# ヘッダーでのバージョニング
GET /api/users
Accept: application/vnd.api+json;version=1

# クエリパラメータでのバージョニング
GET /api/users?version=1
```

## フィルタリングとソート

```http
# フィルタリング
GET /api/users?status=active&age_min=18

# ソート
GET /api/users?sort=created_at&order=desc

# ページネーション
GET /api/users?page=2&per_page=20

# フィールド指定
GET /api/users?fields=id,name,email
```

## 実装例（Node.js/Express）

```javascript
const express = require('express');
const app = express();

// ミドルウェア
app.use(express.json());

// エラーハンドリング
const handleError = (res, error, statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR'
    }
  });
};

// ユーザー一覧取得
app.get('/api/users', async (req, res) => {
  try {
    const { page = 1, per_page = 10, sort = 'created_at' } = req.query;
    
    const users = await User.findAll({
      limit: per_page,
      offset: (page - 1) * per_page,
      order: [[sort, 'DESC']]
    });
    
    const total = await User.count();
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        total,
        total_pages: Math.ceil(total / per_page)
      }
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ユーザー作成
app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // バリデーション
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '名前とメールアドレスは必須です'
        }
      });
    }
    
    const user = await User.create({ name, email });
    
    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ユーザー更新
app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません'
        }
      });
    }
    
    await user.update({ name, email });
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    handleError(res, error);
  }
});

// ユーザー削除
app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'ユーザーが見つかりません'
        }
      });
    }
    
    await user.destroy();
    
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
});

app.listen(3000, () => {
  console.log('API Server running on port 3000');
});
```

適切なAPI設計により、使いやすく保守性の高いWebAPIを構築できます。