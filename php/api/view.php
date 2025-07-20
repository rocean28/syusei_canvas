<?php
require_once __DIR__ . '/../common.php';

try {

  // ID指定の取得チェック
  if (!isset($_GET['id']) || empty($_GET['id'])) {
    throw new Exception('IDが指定されていません');
  }

  $groupId = $_GET['id'];

  // グループ取得
  $stmt = $db->prepare("SELECT * FROM posts WHERE id = ?");
  $stmt->execute([$groupId]);
  $group = $stmt->fetch(PDO::FETCH_ASSOC);
  if (!$group) {
    throw new Exception('指定されたデータが存在しません');
  }

  // 画像一覧取得
  $stmt = $db->prepare("SELECT * FROM images WHERE group_id = ? ORDER BY id ASC");
  $stmt->execute([$groupId]);
  $images = $stmt->fetchAll(PDO::FETCH_ASSOC);

  foreach ($images as &$image) {
    $stmt = $db->prepare("SELECT * FROM instructions WHERE image_id = ? ORDER BY id ASC");
    $stmt->execute([$image['id']]);
    $instructions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $image['instructions'] = $instructions;
  }

  // 最終出力
  echo json_encode([
    'success' => true,
    'id' => $groupId,
    'title' => $group['title'],
    'created_at' => formatDate($group['created_at']),
    'updated_at' => formatDate($group['updated_at']),
    'created_by' => $group['created_by'],
    'updated_by' => $group['updated_by'],
    'images' => $images,
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// 日付整形関数
function formatDate($datetime) {
  $timestamp = strtotime($datetime);
  return date('Y-m-d H:i:s', $timestamp);
}
