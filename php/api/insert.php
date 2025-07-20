<?php
require_once __DIR__ . '/../common.php';

try {
  $json = file_get_contents('php://input');
  $data = json_decode($json, true);

  if (!$data) throw new Exception('JSONが無効です');

  $groupId = $data['id'] ?? null;
  if (!$groupId) throw new Exception('IDが指定されていません');

  $title = trim($data['title'] ?? '');
  if ($title === '') $title = '無題の修正指示';

  $createdAt = $data['created_at'] ?? date('Y-m-d H:i:s');
  $createdBy = $data['created_by'] ?? 'guest';
  $updatedAt = $data['updated_at'] ?? $createdAt;
  $updatedBy = $data['updated_by'] ?? $createdBy;

  // posts 挿入（INSERTのみ）
  $stmt = $db->prepare('INSERT INTO posts (id, title, created_at, updated_at, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)');
  $stmt->execute([$groupId, $title, $createdAt, $updatedAt, $createdBy, $updatedBy]);

  // images 挿入
  $stmtImage = $db->prepare('INSERT INTO images (group_id, image, title, url) VALUES (?, ?, ?, ?)');
  $stmtInst = $db->prepare('INSERT INTO instructions (id, image_id, x, y, width, height, text, comment, is_fixed, is_ok) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

  foreach ($data['images'] as $img) {
    if (empty($img['image'])) throw new Exception('画像ファイル名が指定されていません');

    $stmtImage->execute([
      $groupId,
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

  echo json_encode(['success' => true, 'id' => $groupId]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
