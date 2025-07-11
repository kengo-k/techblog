---
title: "Understanding React Server Components"
draft: false
tags: ["React", "JavaScript", "Web"]
categories: ["技術"]
months: ["2024-09"]
description: "React Server Components are components rendered on the server. Unlike traditional client-side rendering, they run on the server, reducing initial load times and improving SEO."
---

React Server Components are components rendered on the server. Unlike traditional client-side rendering, they run on the server, reducing initial load times and improving SEO.

## 基本的な概念

Server Components は以下の特徴を持ちます：

- サーバー上でレンダリングされる
- データベース直接アクセスが可能
- バンドルサイズの削減
- SEO 対策に有効

## 実装例

```jsx
// app/page.jsx
async function fetchPosts() {
  const res = await fetch("https://api.example.com/posts");
  return res.json();
}

export default async function HomePage() {
  const posts = await fetchPosts();

  return (
    <div>
      <h1>ブログ記事一覧</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

## 注意点

- クライアントサイドの状態管理は使用できない
- ユーザーインタラクションには制限がある
- Client Components との使い分けが重要

Server Components を適切に活用することで、React アプリケーションのパフォーマンスを大幅に向上させることができます。
