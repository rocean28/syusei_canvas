<?php
// ログ出力
// ini_set('display_errors', 0);
// ini_set('log_errors', 1);
// ini_set('error_log', __DIR__ . '/../../logs/php_error.log');
// error_reporting(E_ALL);

require_once __DIR__ . '/../common.php';

/* 処理
------------------------------*/
try {
  $json = file_get_contents('php://input');
  $data = json_decode($json, true);
  if (!$data || !isset($data['id'])) {
    throw new Exception('IDが指定されていません');
  }

  $id = $data['id'];

  // 画像削除
  $createdAt = $data['created_at'];
  $datetime = new DateTime($createdAt);
  $Y = $datetime->format('Y');
  $mm = $datetime->format('m');
  $uploadDir = __DIR__ . "/../../uploads/{$Y}/{$mm}/{$id}/";
  if (is_dir($uploadDir)) {
    deleteDirRecursive($uploadDir);
  }

  // instructions 削除
  $stmt = $db->prepare('DELETE FROM instructions WHERE image_id IN (SELECT id FROM images WHERE group_id = ?)');
  $stmt->execute([$id]);

  // images 削除
  $stmt = $db->prepare('DELETE FROM images WHERE group_id = ?');
  $stmt->execute([$id]);

  // posts 削除
  $stmt = $db->prepare('DELETE FROM posts WHERE id = ?');
  $stmt->execute([$id]);

  echo json_encode(['success' => true]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
  exit;
}

/**
 * 再帰的にディレクトリ削除
 */
function deleteDirRecursive($dir) {
  $items = array_diff(scandir($dir), ['.', '..']);
  foreach ($items as $item) {
    $path = $dir . DIRECTORY_SEPARATOR . $item;
    if (is_dir($path)) {
      deleteDirRecursive($path);
    } else {
      unlink($path);
    }
  }
  rmdir($dir);
}
