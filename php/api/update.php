<?php
require_once __DIR__ . '/../common.php';

ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/update_error.log');

try {
  $json = file_get_contents('php://input');
  $data = json_decode($json, true);
  if (!$data) throw new Exception('JSONが無効です');

  $groupId = $data['id'] ?? null;
  if (!$groupId) throw new Exception('IDが指定されていません');

  $title = trim($data['title'] ?? '');
  if ($title === '') $title = '無題の修正指示';

  $updatedAt = $data['updated_at'] ?? date('Y-m-d H:i:s');
  $updatedBy = $data['updated_by'] ?? 'guest';

  $db->beginTransaction();

  // posts UPDATE（created_xxxは触らない）
  $stmt = $db->prepare('UPDATE posts SET title = ?, updated_at = ?, updated_by = ? WHERE id = ?');
  $stmt->execute([$title, $updatedAt, $updatedBy, $groupId]);

  // 🔍 削除前に旧 instructions の is_fixed / is_ok を退避
  $stmt = $db->prepare('SELECT i.id, i.is_fixed, i.is_ok FROM instructions i INNER JOIN images img ON i.image_id = img.id WHERE img.group_id = ?');
  $stmt->execute([$groupId]);
  $oldStatus = [];
  foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    $oldStatus[$row['id']] = [
      'is_fixed' => (int)$row['is_fixed'],
      'is_ok'    => (int)$row['is_ok'],
    ];
  }

  // 🗑 images / instructions 全削除
  $stmt = $db->prepare('DELETE FROM instructions WHERE image_id IN (SELECT id FROM images WHERE group_id = ?)');
  $stmt->execute([$groupId]);

  $stmt = $db->prepare('DELETE FROM images WHERE group_id = ?');
  $stmt->execute([$groupId]);

  // ➕ 再INSERT（images → instructions）
  $stmtImage = $db->prepare('INSERT INTO images (group_id, image, title, url) VALUES (?, ?, ?, ?)');
  $stmtInst  = $db->prepare('INSERT INTO instructions (id, image_id, x, y, width, height, text, comment, is_fixed, is_ok) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

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
      $id = $inst['id'];
      $old = $oldStatus[$id] ?? ['is_fixed' => 0, 'is_ok' => 0];

      $stmtInst->execute([
        $id,
        $imageId,
        $inst['x'], $inst['y'],
        $inst['width'], $inst['height'],
        $inst['text'] ?? '',
        $inst['comment'] ?? '',
        $old['is_fixed'],
        $old['is_ok'],
      ]);
    }
  }

  // 投稿日時から年・月を取得（なければ現在時刻で代用）
  $createdAt = $data['created_at'] ?? date('Y-m-d H:i:s');
  $datetime = new DateTime($createdAt);
  $Y = $datetime->format('Y');
  $mm = $datetime->format('m');

  // ディレクトリ
  $uploadDir = __DIR__ . "/../../uploads/{$Y}/{$mm}/{$groupId}/";

  // ディレクトリが存在する場合のみ処理
  if (is_dir($uploadDir)) {
    $existingFiles = array_diff(scandir($uploadDir), ['.', '..']);
    $usedFiles = array_map(fn($img) => $img['image'], $data['images']);

    foreach ($existingFiles as $file) {
      if (!in_array($file, $usedFiles, true)) {
        $fullPath = $uploadDir . $file;
        if (is_file($fullPath)) {
          unlink($fullPath);
        }
      }
    }
  }

  $db->commit();
  echo json_encode(['success' => true, 'id' => $groupId]);

} catch (Exception $e) {
  if (isset($db) && $db->inTransaction()) {
    $db->rollBack();
  }

  error_log('更新処理エラー: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
