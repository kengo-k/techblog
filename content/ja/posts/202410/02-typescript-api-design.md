---
title: "TypeScriptの型安全性を活用したAPI設計"
tags: ["React", "JavaScript", "Web"]
description: "TypeScriptを使用したAPI設計を行う際の型安全性の確保について、zodやtRPCなどのツールを活用した実装方法..."
---

TypeScriptを使用したAPI設計を行う際の型安全性の確保について、zodやtRPCなどのツールを活用した実装方法を解説します。

## 型安全なAPI設計の重要性

API設計において型安全性を確保することで、以下の利点があります：

- 実行時エラーの削減
- 開発者体験の向上
- APIドキュメントの自動生成
- 型推論による生産性向上

## Zodを使用したスキーマ定義

```typescript
import { z } from 'zod';

// リクエストスキーマ
const CreatePostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  published: z.boolean().default(false),
});

// レスポンススキーマ
const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  published: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

type CreatePostRequest = z.infer<typeof CreatePostSchema>;
type Post = z.infer<typeof PostSchema>;
```

## tRPCを使用したエンドツーエンドの型安全性

```typescript
import { router, procedure } from './trpc';

export const postRouter = router({
  create: procedure
    .input(CreatePostSchema)
    .mutation(async ({ input }) => {
      // データベース操作
      const post = await db.post.create({
        data: input,
      });
      return PostSchema.parse(post);
    }),
  
  getAll: procedure
    .query(async () => {
      const posts = await db.post.findMany();
      return posts.map(post => PostSchema.parse(post));
    }),
});
```

## バリデーションの実装

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreatePostSchema.parse(body);
    
    // データベース操作
    const post = await createPost(validatedData);
    
    return NextResponse.json(post);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

型安全性を確保することで、より堅牢で保守性の高いAPIを構築できます。