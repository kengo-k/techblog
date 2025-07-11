---
title: "Tailwind CSSのカスタムコンポーネント設計"
draft: false
tags: ["React", "JavaScript", "Web"]
categories: ["技術"]
months: ["2024-10"]
description: "Tailwind CSSを使用したコンポーネント設計のベストプラクティス、再利用可能なコンポーネントの作成方法と設計思想..."
---

Tailwind CSSを使用したコンポーネント設計のベストプラクティス、再利用可能なコンポーネントの作成方法と設計思想を解説します。

## Tailwind CSSのコンポーネント設計思想

Tailwind CSSでは以下の原則に基づいてコンポーネントを設計します：

- Utility-firstアプローチ
- 再利用可能な設計
- 一貫性のあるデザインシステム
- レスポンシブ対応

## 基本的なボタンコンポーネント

```tsx
// components/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        // Base styles
        'inline-flex items-center justify-center font-medium rounded-md transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        
        // Variants
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500':
            variant === 'primary',
          'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500':
            variant === 'secondary',
          'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500':
            variant === 'outline',
        },
        
        // Sizes
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

## カードコンポーネント

```tsx
// components/Card.tsx
import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
}

export default function Card({
  title,
  children,
  className,
  padding = 'md',
  shadow = 'md',
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg border border-gray-200',
        {
          'shadow-sm': shadow === 'sm',
          'shadow-md': shadow === 'md',
          'shadow-lg': shadow === 'lg',
        },
        {
          'p-3': padding === 'sm',
          'p-6': padding === 'md',
          'p-8': padding === 'lg',
        },
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
```

## 入力フィールドコンポーネント

```tsx
// components/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helpText,
  className,
  ...props
}, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm',
          'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'disabled:bg-gray-50 disabled:text-gray-500',
          {
            'border-red-500 focus:ring-red-500 focus:border-red-500': error,
          },
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
```

## バッジコンポーネント

```tsx
// components/Badge.tsx
import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        {
          'bg-gray-100 text-gray-800': variant === 'default',
          'bg-green-100 text-green-800': variant === 'success',
          'bg-yellow-100 text-yellow-800': variant === 'warning',
          'bg-red-100 text-red-800': variant === 'error',
        },
        {
          'px-2 py-1 text-xs': size === 'sm',
          'px-3 py-1 text-sm': size === 'md',
        }
      )}
    >
      {children}
    </span>
  );
}
```

## 使用例

```tsx
// pages/example.tsx
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Badge from '@/components/Badge';

export default function ExamplePage() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card title="フォーム例">
        <div className="space-y-4">
          <Input
            label="メールアドレス"
            type="email"
            placeholder="example@example.com"
          />
          <Input
            label="パスワード"
            type="password"
            placeholder="パスワードを入力"
          />
          <div className="flex gap-2">
            <Button variant="primary">送信</Button>
            <Button variant="outline">キャンセル</Button>
          </div>
        </div>
      </Card>
      
      <Card title="バッジ例">
        <div className="flex gap-2">
          <Badge variant="success">成功</Badge>
          <Badge variant="warning">警告</Badge>
          <Badge variant="error">エラー</Badge>
        </div>
      </Card>
    </div>
  );
}
```

Tailwind CSSのUtility-firstアプローチを活用することで、一貫性があり保守性の高いコンポーネントを効率的に作成できます。