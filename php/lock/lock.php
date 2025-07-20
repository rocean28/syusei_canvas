<?php
require_once __DIR__ . '/../common.php';

// ログイン情報が必要
session_start();
$user = $_SESSION['user_name'] ?? '未ログイン';
if (!isset($_SESSION['user_email'])) {
  http_response_code(401);
  echo json_encode(['error' => '未ログイン']);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  $id = $data['id'] ?? '';
} else {
  $id = $_GET['id'] ?? '';
}
if ($id === '') {
  http_response_code(400);
  echo json_encode(['error' => 'IDが指定されていません']);
  exit;
}

// ロックファイルのパス
$lockDir = __DIR__;
$lockFile = "$lockDir/$id.json";

// すでにロックされてるかチェック
if (file_exists($lockFile)) {
  $json = json_decode(file_get_contents($lockFile), true);
  echo json_encode([
    'locked' => true,
    'locked_by' => $json['user'] ?? '不明',
    'locked_at' => $json['time'] ?? ''
  ]);
  exit;
}

// ロック情報を作成
$lockData = [
  'user' => $user,
  'time' => date('Y-m-d H:i')
];
file_put_contents($lockFile, json_encode($lockData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

// ロック成功を返す
echo json_encode(['locked' => false]);
