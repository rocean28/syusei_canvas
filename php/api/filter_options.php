<?php
require_once __DIR__ . '/../common.php';

try {
  // 作成者一覧（空・NULLは除外、昇順）
  $authorStmt = $db->query("
    SELECT DISTINCT created_by
    FROM posts
    WHERE created_by IS NOT NULL AND created_by <> ''
    ORDER BY created_by ASC
  ");
  $authors = $authorStmt->fetchAll(PDO::FETCH_COLUMN);

  // 作成年（YYYY）一覧：降順
  $yearStmt = $db->query("
    SELECT DISTINCT strftime('%Y', created_at) AS year
    FROM posts
    WHERE created_at IS NOT NULL AND created_at <> ''
    ORDER BY year DESC
  ");
  $years = $yearStmt->fetchAll(PDO::FETCH_COLUMN);

  // 作成年月（YYYY-MM）一覧：降順
  $monthStmt = $db->query("
    SELECT DISTINCT strftime('%Y-%m', created_at) AS month
    FROM posts
    WHERE created_at IS NOT NULL AND created_at <> ''
    ORDER BY month DESC
  ");
  $months = $monthStmt->fetchAll(PDO::FETCH_COLUMN);

  echo json_encode([
    'success' => true,
    'authors' => $authors,
    'years'   => $years,   // ← 追加（"2025","2024",...）
    'months'  => $months,  // ← 既存（"2025-08","2025-07",...）
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'error' => $e->getMessage(),
  ]);
}
