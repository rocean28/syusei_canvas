<?php
require_once __DIR__ . '/../common.php';

try {
  // ページ情報取得（デフォルト：1ページ目、10件表示）
  $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
  $perPage = isset($_GET['per_page']) ? max(1, (int)$_GET['per_page']) : 15;
  $offset = ($page - 1) * $perPage;

  // 総件数取得（ページネーション用）
  $totalStmt = $db->query("SELECT COUNT(*) FROM posts");
  $total = (int) $totalStmt->fetchColumn();

  // postsテーブルから一覧取得（降順 + ページング）
  $stmt = $db->prepare("SELECT * FROM posts ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
  $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
  $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
  $stmt->execute();
  $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // 各グループの最初の画像だけ取得して追加（オプション）
  foreach ($posts as &$group) {
    $stmt = $db->prepare("SELECT image FROM images WHERE group_id = ? ORDER BY id ASC LIMIT 1");
    $stmt->execute([$group['id']]);
    $image = $stmt->fetchColumn();
    $group['image'] = $image ?: null;

    // 日付整形（ここでまとめて処理）
    $group['created_at'] = formatDate($group['created_at']);
    $group['updated_at'] = formatDate($group['updated_at']);
  }

  // JSON出力
  echo json_encode([
    'success' => true,
    'page' => $page,
    'per_page' => $perPage,
    'total' => $total,
    'items' => $posts
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// 日付整形関数（スコープの最後に）
function formatDate($datetime) {
  $timestamp = strtotime($datetime);
  return date('Y-m-d H:i', $timestamp);
}
