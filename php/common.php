<?php
session_start();

// CORS対応（Originチェックはここで早めにやる）
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
  'http://localhost:5173',
  'https://syusei.lk-dev.net',
];
if (in_array($origin, $allowedOrigins, true)) {
  header("Access-Control-Allow-Origin: $origin");
  header("Access-Control-Allow-Credentials: true");
  header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
  header("Access-Control-Allow-Headers: Content-Type");
}

// プリフライトリクエストはここで即終了（OPTIONSの前に認証チェック入れるな）
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

// 認証チェック（OPTIONSでないと確定した後でやる）
// if (!isset($_SESSION['user_email'])) {
//   http_response_code(401);
//   echo json_encode(['error' => 'Unauthorized']);
//   exit;
// }

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