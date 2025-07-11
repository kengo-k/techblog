---
title: "Next.js App Routerでの認証実装パターン"
draft: false
tags: ["React", "JavaScript", "Web"]
categories: ["技術"]
months: ["2024-09"]
description: "Next.js App Routerを使用した認証システムの実装について、NextAuthやSupabaseを活用したパターンを紹介..."
---

Next.js App Routerを使用した認証システムの実装について、NextAuthやSupabaseを活用したパターンを紹介します。

## App Routerでの認証の特徴

App Routerでは以下の特徴があります：

- Server Componentsでの認証状態管理
- Middlewareによる認証チェック
- Route Handlerでの認証API
- クライアントサイドの状態管理

## NextAuthを使用した実装

### 基本設定

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub,
      },
    }),
  },
});

export { handler as GET, handler as POST };
```

### Middlewareでの認証チェック

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // 認証後の処理
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

### Server Componentでの認証状態取得

```typescript
// app/dashboard/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/api/auth/signin');
  }
  
  return (
    <div>
      <h1>ダッシュボード</h1>
      <p>ようこそ、{session.user?.name}さん</p>
    </div>
  );
}
```

## ログイン/ログアウト機能

```typescript
// components/AuthButton.tsx
'use client';

import { signIn, signOut, useSession } from 'next-auth/react';

export default function AuthButton() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div>読み込み中...</div>;
  }
  
  if (session) {
    return (
      <div>
        <span>ログイン済み: {session.user?.email}</span>
        <button onClick={() => signOut()}>ログアウト</button>
      </div>
    );
  }
  
  return (
    <button onClick={() => signIn()}>ログイン</button>
  );
}
```

## 保護されたルートの実装

```typescript
// app/protected/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/api/auth/signin');
  }
  
  return (
    <div>
      <h1>保護されたページ</h1>
      <p>認証されたユーザーのみアクセス可能</p>
    </div>
  );
}
```

App Routerでの認証実装により、セキュアで使いやすいアプリケーションを構築できます。