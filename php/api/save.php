<?php
require_once __DIR__ . '/../common.php';

/* 処理
------------------------------*/
try {
  $json = file_get_contents('php://input');
  $data = json_decode($json, true);

  if (!$data) throw new Exception('JSONが無効です');

  $id = $data['id'];
  $title = trim($data['title'] ?? '');
  $category = trim($data['category'] ?? 'no_category');
  if ($title === '') $title = '無題の修正指示';

  // posts テーブル保存
  $stmt = $db->prepare('INSERT OR REPLACE INTO posts (id, title, category, created_at, updated_at, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)');
  $stmt->execute([
    $id,
    $title,
    $category,
    $data['created_at'] ?? '',
    $data['updated_at'] ?? '',
    $data['created_by'] ?? 'guest',
    $data['updated_by'] ?? 'guest'
  ]);

  // 旧 instructions 削除
  $stmt = $db->prepare('DELETE FROM instructions WHERE image_id IN (SELECT id FROM images WHERE group_id = ?)');
  $stmt->execute([$id]);

  // 旧 images 削除
  $stmt = $db->prepare('DELETE FROM images WHERE group_id = ?');
  $stmt->execute([$id]);

  // images・instructions 挿入
  $stmtImage = $db->prepare('INSERT INTO images (group_id, image, title, url) VALUES (?, ?, ?, ?)');
  $stmtInst = $db->prepare('INSERT INTO instructions (id, image_id, x, y, width, height, text, comment, is_fixed, is_ok) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

  foreach ($data['images'] as $img) {
    if (empty($img['image'])) throw new Exception('画像ファイル名が指定されていません');

    $stmtImage->execute([
      $id,
      $img['image'],
      $img['title'] ?? '',
      $img['url'] ?? ''
    ]);

    $imageId = $db->lastInsertId();

    foreach ($img['instructions'] as $inst) {
      $stmtInst->execute([
        $inst['id'],
        $imageId,
        $inst['x'], $inst['y'],
        $inst['width'], $inst['height'],
        $inst['text'] ?? '',
        $inst['comment'] ?? '',
        $inst['is_fixed'] ? 1 : 0,
        $inst['is_ok'] ? 1 : 0,
      ]);
    }
  }

  echo json_encode(['success' => true, 'id' => $id]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
