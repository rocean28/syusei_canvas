<?php
session_start();
header('Content-Type: application/json');

// 認証チェック
if (!isset($_SESSION['user_email'])) {
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

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

// タイムゾーン設定
date_default_timezone_set('Asia/Tokyo');