<?php
require_once __DIR__ . '/../common.php';

try {
  // 作成者一覧
  $authorStmt = $db->query("
    SELECT DISTINCT created_by
    FROM posts
    WHERE created_by IS NOT NULL AND created_by != ''
    ORDER BY created_by ASC
  ");
  $authors = $authorStmt->fetchAll(PDO::FETCH_COLUMN);

  // 作成年月一覧（YYYY-MM）
  $monthStmt = $db->query("
    SELECT DISTINCT strftime('%Y-%m', created_at) AS month
    FROM posts
    ORDER BY month DESC
  ");
  $months = $monthStmt->fetchAll(PDO::FETCH_COLUMN);

  echo json_encode([
    'success' => true,
    'authors' => $authors,
    'months' => $months,
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'error' => $e->getMessage(),
  ]);
}
