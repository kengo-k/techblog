---
title: "パフォーマンス最適化のためのReactメモ化戦略"
tags: ["React", "JavaScript", "Web"]
description: "Reactアプリケーションのパフォーマンス最適化について、useMemo、useCallback、React.memoの適切な使用方法..."
---

Reactアプリケーションのパフォーマンス最適化について、useMemo、useCallback、React.memoの適切な使用方法を解説します。

## メモ化の基本概念

メモ化（Memoization）は、計算結果をキャッシュして再計算を避ける最適化技術です。Reactでは以下のツールが提供されています：

- `React.memo`: コンポーネントのメモ化
- `useMemo`: 値の計算結果をメモ化
- `useCallback`: 関数をメモ化

## React.memoの使用

```tsx
// components/UserItem.tsx
import { memo } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserItemProps {
  user: User;
  onEdit: (user: User) => void;
}

const UserItem = memo(({ user, onEdit }: UserItemProps) => {
  console.log('UserItem rendered:', user.name);
  
  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">{user.name}</h3>
      <p className="text-gray-600">{user.email}</p>
      <button
        onClick={() => onEdit(user)}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
      >
        編集
      </button>
    </div>
  );
});

UserItem.displayName = 'UserItem';

export default UserItem;
```

## useMemoの活用

```tsx
// hooks/useFilteredUsers.ts
import { useMemo } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
}

export function useFilteredUsers(users: User[], searchQuery: string, department: string) {
  return useMemo(() => {
    console.log('Filtering users...');
    
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = department === '' || user.department === department;
      
      return matchesSearch && matchesDepartment;
    });
  }, [users, searchQuery, department]);
}
```

## useCallbackの実装

```tsx
// components/UserList.tsx
import { useState, useCallback } from 'react';
import UserItem from './UserItem';
import { useFilteredUsers } from '@/hooks/useFilteredUsers';

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
}

interface UserListProps {
  users: User[];
}

export default function UserList({ users }: UserListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = useFilteredUsers(users, searchQuery, selectedDepartment);

  // useCallbackで関数をメモ化
  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
  }, []);

  const handleSave = useCallback((user: User) => {
    // 保存処理
    setEditingUser(null);
  }, []);

  const handleCancel = useCallback(() => {
    setEditingUser(null);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="ユーザー検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">全部門</option>
          <option value="engineering">エンジニアリング</option>
          <option value="design">デザイン</option>
          <option value="marketing">マーケティング</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map(user => (
          <UserItem
            key={user.id}
            user={user}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
```

## 重い計算の最適化

```tsx
// components/DataVisualization.tsx
import { useMemo } from 'react';

interface DataPoint {
  id: string;
  value: number;
  category: string;
  timestamp: Date;
}

interface DataVisualizationProps {
  data: DataPoint[];
  timeRange: { start: Date; end: Date };
}

export default function DataVisualization({ data, timeRange }: DataVisualizationProps) {
  // 重い計算をメモ化
  const processedData = useMemo(() => {
    console.log('Processing data...');
    
    const filteredData = data.filter(
      point => point.timestamp >= timeRange.start && point.timestamp <= timeRange.end
    );
    
    const aggregatedData = filteredData.reduce((acc, point) => {
      const category = point.category;
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0, average: 0 };
      }
      acc[category].total += point.value;
      acc[category].count += 1;
      acc[category].average = acc[category].total / acc[category].count;
      return acc;
    }, {} as Record<string, { total: number; count: number; average: number }>);
    
    return Object.entries(aggregatedData).map(([category, stats]) => ({
      category,
      ...stats,
    }));
  }, [data, timeRange]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">データ可視化</h2>
      <div className="grid gap-4">
        {processedData.map(({ category, total, count, average }) => (
          <div key={category} className="p-4 border rounded-lg">
            <h3 className="font-medium">{category}</h3>
            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
              <div>合計: {total.toLocaleString()}</div>
              <div>件数: {count}</div>
              <div>平均: {average.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## パフォーマンス測定

```tsx
// hooks/usePerformanceMonitor.ts
import { useEffect, useRef } from 'react';

export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>();
  
  useEffect(() => {
    renderStartTime.current = performance.now();
  });
  
  useEffect(() => {
    if (renderStartTime.current) {
      const renderTime = performance.now() - renderStartTime.current;
      console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
  });
}
```

## 最適化のベストプラクティス

1. **測定してから最適化する**: パフォーマンスの問題を特定してから最適化を行う
2. **適切なメモ化**: 必要な箇所でのみメモ化を使用し、過度なメモ化は避ける
3. **依存配列の管理**: useMemoやuseCallbackの依存配列を適切に管理する
4. **コンポーネントの分割**: 大きなコンポーネントを小さく分割して再レンダリングを局所化する

適切なメモ化戦略により、Reactアプリケーションのパフォーマンスを大幅に向上させることができます。