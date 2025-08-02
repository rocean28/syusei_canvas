<?php
require_once __DIR__ . '/../common.php';

// エラーログ出力先（必要に応じて調整）
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/save_error.log');

try {
  $json = file_get_contents('php://input');
  $data = json_decode($json, true);

  if (!$data) throw new Exception('JSONが無効です');

  $id = $data['id'];
  $title = trim($data['title'] ?? '');
  $category = trim($data['category'] ?? 'no_category');
  if ($title === '') $title = '無題の修正指示';

  $db->beginTransaction();

  // posts テーブル保存
  $stmt = $db->prepare('INSERT OR REPLACE INTO posts (id, title, category, created_at, updated_at, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
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
  $stmt = $db->prepare('DELETE FROM instructions WHERE tab_id IN (SELECT id FROM tabs WHERE post_id = ?)');
  $stmt->execute([$id]);

  // 旧 tab 削除
  $stmt = $db->prepare('DELETE FROM tabs WHERE post_id = ?');
  $stmt->execute([$id]);

  // tabs・instructions 挿入
  $stmtImage = $db->prepare('INSERT INTO tabs (post_id, image_filename, title, url) VALUES (?, ?, ?, ?)');
  $stmtInst = $db->prepare('INSERT INTO instructions (id, tab_id, x, y, width, height, text, comment, is_fixed, is_ok) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

  foreach ($data['tabs'] as $img) {
    if (empty($img['image_filename'])) throw new Exception('画像ファイル名が指定されていません');

    $stmtImage->execute([
      $id,
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
        !empty($inst['is_fixed']) ? 1 : 0,
        !empty($inst['is_ok']) ? 1 : 0,
      ]);
    }
  }

  $db->commit();
  echo json_encode(['success' => true, 'id' => $id]);
} catch (Exception $e) {
  if ($db->inTransaction()) {
    $db->rollBack();
  }

  // ログ出力
  error_log("保存処理エラー: " . $e->getMessage());

  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
