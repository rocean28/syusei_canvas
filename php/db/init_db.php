<?php
// header('Content-Type: application/json');

$dbPath = __DIR__ . '/database.sqlite';

// 既存のDBファイルがあれば削除
if (file_exists($dbPath)) {
  if (!unlink($dbPath)) {
    echo json_encode(['success' => false, 'error' => '既存のDBファイルの削除に失敗しました']);
    exit;
  }
}

try {
  // 新しいDB作成
  $db = new PDO('sqlite:' . $dbPath);
  $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  // テーブル作成
  $db->exec("
    CREATE TABLE posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      created_by TEXT NOT NULL,
      updated_by TEXT NOT NULL
    );

    CREATE TABLE images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      image TEXT NOT NULL,
      title TEXT,
      url TEXT,
      FOREIGN KEY(group_id) REFERENCES posts(id)
    );

    CREATE TABLE instructions (
      id TEXT PRIMARY KEY,
      image_id INTEGER NOT NULL,
      x REAL NOT NULL,
      y REAL NOT NULL,
      width REAL NOT NULL,
      height REAL NOT NULL,
      text TEXT,
      comment TEXT,
      is_fixed INTEGER NOT NULL DEFAULT 0,
      is_ok INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(image_id) REFERENCES images(id)
    );
  ");

  // echo json_encode(['success' => true, 'message' => 'データベースを初期化しました']);
  echo 'データベースを初期化しました';
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
