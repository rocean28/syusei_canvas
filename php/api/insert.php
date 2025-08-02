<?php
require_once __DIR__ . '/../common.php';

try {
  $json = file_get_contents('php://input');
  $data = json_decode($json, true);

  if (!$data) throw new Exception('JSONが無効です');

  $postId = $data['id'] ?? null;
  if (!$postId) throw new Exception('IDが指定されていません');

  $title = trim($data['title'] ?? '');
  if ($title === '') $title = '無題の修正指示';

  $createdAt = $data['created_at'] ?? date('Y-m-d H:i:s');
  $createdBy = $data['created_by'] ?? 'guest';
  $updatedAt = $data['updated_at'] ?? $createdAt;
  $updatedBy = $data['updated_by'] ?? $createdBy;

  // posts 挿入（INSERTのみ）
  $stmt = $db->prepare('INSERT INTO posts (id, title, created_at, updated_at, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)');
  $stmt->execute([$postId, $title, $createdAt, $updatedAt, $createdBy, $updatedBy]);

  // tabs 挿入
  $stmtImage = $db->prepare('INSERT INTO tabs (post_id, image_filename, title, url) VALUES (?, ?, ?, ?)');
  $stmtInst = $db->prepare('INSERT INTO instructions (id, tab_id, x, y, width, height, text, comment, is_fixed, is_ok) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

  foreach ($data['tabs'] as $img) {
    if (empty($img['image_filename'])) throw new Exception('画像ファイル名が指定されていません');

    $stmtImage->execute([
      $postId,
      $img['image_filename'],
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

  echo json_encode(['success' => true, 'id' => $postId]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
