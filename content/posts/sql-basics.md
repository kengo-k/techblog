---
title: "SQL基本操作ガイド"
date: 2024-11-03T16:00:00+09:00
draft: false
tags: ["React", "JavaScript", "Web"]
categories: ["技術"]
months: ["2024-11"]
description: "SQLの基本的な操作方法とデータベースクエリについて解説します。"
---

SQLの基本的な操作方法とデータベースクエリについて解説します。

## SQLの基本概念

SQLはデータベースを操作するための言語です。

### 基本的なSELECT文

```sql
-- 全カラムを取得
SELECT * FROM users;

-- 特定のカラムを取得
SELECT name, email FROM users;

-- 条件付きで取得
SELECT * FROM users WHERE age > 25;

-- 並び替え
SELECT * FROM users ORDER BY created_at DESC;

-- 件数制限
SELECT * FROM users LIMIT 10;
```

## データの操作

```sql
-- データの挿入
INSERT INTO users (name, email, age) 
VALUES ('田中太郎', 'tanaka@example.com', 30);

-- 複数行の挿入
INSERT INTO users (name, email, age) VALUES 
('佐藤花子', 'sato@example.com', 25),
('鈴木次郎', 'suzuki@example.com', 35);

-- データの更新
UPDATE users 
SET email = 'new-email@example.com' 
WHERE id = 1;

-- データの削除
DELETE FROM users WHERE id = 1;
```

## 高度なクエリ

```sql
-- GROUP BY
SELECT department, COUNT(*) as employee_count
FROM employees
GROUP BY department;

-- JOIN
SELECT u.name, o.order_date, o.total
FROM users u
JOIN orders o ON u.id = o.user_id;

-- LEFT JOIN
SELECT u.name, o.order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- サブクエリ
SELECT name FROM users
WHERE id IN (
    SELECT user_id FROM orders 
    WHERE total > 1000
);
```

## 関数の使用

```sql
-- 文字列関数
SELECT UPPER(name) FROM users;
SELECT CONCAT(first_name, ' ', last_name) as full_name FROM users;

-- 日付関数
SELECT * FROM orders 
WHERE order_date >= DATE('2024-01-01');

-- 集約関数
SELECT 
    COUNT(*) as total_users,
    AVG(age) as average_age,
    MAX(age) as max_age,
    MIN(age) as min_age
FROM users;
```

## テーブルの作成

```sql
-- テーブル作成
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2),
    category_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- インデックス作成
CREATE INDEX idx_products_category ON products(category_id);

-- テーブル構造変更
ALTER TABLE products ADD COLUMN description TEXT;
ALTER TABLE products MODIFY COLUMN name VARCHAR(200);
```

## 実践的なクエリ例

```sql
-- 月別売上集計
SELECT 
    DATE_FORMAT(order_date, '%Y-%m') as month,
    SUM(total) as monthly_sales
FROM orders
GROUP BY DATE_FORMAT(order_date, '%Y-%m')
ORDER BY month;

-- ランキング
SELECT 
    name,
    sales,
    RANK() OVER (ORDER BY sales DESC) as ranking
FROM sales_data;

-- 移動平均
SELECT 
    date,
    sales,
    AVG(sales) OVER (
        ORDER BY date 
        ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    ) as moving_average
FROM daily_sales;
```

## パフォーマンスの最適化

```sql
-- EXPLAIN で実行計画を確認
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- インデックスの使用
CREATE INDEX idx_users_email ON users(email);

-- 複合インデックス
CREATE INDEX idx_orders_user_date ON orders(user_id, order_date);
```

SQLを効果的に使用することで、データベースから必要な情報を効率的に取得できます。