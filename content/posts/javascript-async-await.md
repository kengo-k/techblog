---
title: "JavaScript async/awaitの基本"
date: 2024-10-03T09:30:00+09:00
draft: false
tags: ["React", "JavaScript", "Web"]
categories: ["技術"]
months: ["2024-10"]
description: "JavaScript async/awaitの基本的な使い方と非同期処理について解説します。"
---

JavaScript async/awaitの基本的な使い方と非同期処理について解説します。

## async/awaitの基本概念

async/awaitは非同期処理を同期的に書けるシンタックスシュガーです。

### 基本的な使用方法

```javascript
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('エラー:', error);
    throw error;
  }
}
```

## 複数の非同期処理

```javascript
async function fetchMultipleData() {
  try {
    // 並列実行
    const [users, posts] = await Promise.all([
      fetch('/api/users').then(res => res.json()),
      fetch('/api/posts').then(res => res.json())
    ]);
    
    return { users, posts };
  } catch (error) {
    console.error('データ取得エラー:', error);
  }
}
```

## Reactでの使用例

```javascript
import React, { useState, useEffect } from 'react';

function DataComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      try {
        const result = await fetchData();
        setData(result);
      } catch (error) {
        console.error('データ読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  if (loading) return <div>読み込み中...</div>;
  
  return (
    <div>
      <h1>データ一覧</h1>
      {data && data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

async/awaitを使用することで、非同期処理をより読みやすく書くことができます。