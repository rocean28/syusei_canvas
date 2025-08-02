<?php
// エラーログ出力設定（必要に応じてON）
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/delete_error.log');

require_once __DIR__ . '/../common.php';

try {
  $json = file_get_contents('php://input');
  $data = json_decode($json, true);
  if (!$data || !isset($data['id'])) {
    throw new Exception('IDが指定されていません');
  }

  $id = $data['id'];
  $createdAt = $data['created_at'] ?? null;

  if (!$createdAt) {
    throw new Exception('作成日時が指定されていません');
  }

  $db->beginTransaction();

  // instructions 削除
  $stmt = $db->prepare('DELETE FROM instructions WHERE tab_id IN (SELECT id FROM tabs WHERE post_id = ?)');
  $stmt->execute([$id]);

  // tabs 削除
  $stmt = $db->prepare('DELETE FROM tabs WHERE post_id = ?');
  $stmt->execute([$id]);

  // posts 削除
  $stmt = $db->prepare('DELETE FROM posts WHERE id = ?');
  $stmt->execute([$id]);

  // トランザクション確定
  $db->commit();

  // 画像ディレクトリ削除（DBと切り離して別処理として扱う）
  $datetime = new DateTime($createdAt);
  $Y = $datetime->format('Y');
  $mm = $datetime->format('m');
  $uploadDir = __DIR__ . "/../../uploads/{$Y}/{$mm}/{$id}/";

  if (is_dir($uploadDir)) {
    deleteDirRecursive($uploadDir);
  }

  echo json_encode(['success' => true]);
} catch (Exception $e) {
  if (isset($db) && $db->inTransaction()) {
    $db->rollBack();
  }

  error_log('削除処理エラー: ' . $e->getMessage());
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
      if (!unlink($path)) {
        error_log("ファイル削除失敗: $path");
      }
    }
  }
  if (!rmdir($dir)) {
    error_log("ディレクトリ削除失敗: $dir");
  }
}
