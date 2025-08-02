<?php
// CORS対応（開発用）
// $allowed_origin = 'http://localhost:5173';
// header("Access-Control-Allow-Origin: $allowed_origin");
// header("Access-Control-Allow-Credentials: true");
// header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type");

// プリフライトリクエストなら終了
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// JSONヘッダーは本リクエストだけ
header('Content-Type: application/json');

// SQLite接続
try {
  $db = new PDO('sqlite:' . __DIR__ . '/db/database.sqlite');
  $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
  $db->exec("PRAGMA journal_mode = WAL");
  $db->exec("PRAGMA busy_timeout = 5000");
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => 'DB接続失敗: ' . $e->getMessage()]);
  exit;
}

date_default_timezone_set('Asia/Tokyo');