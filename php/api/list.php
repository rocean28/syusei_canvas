<?php
require_once __DIR__ . '/../common.php';

try {
  // パラメータ取得
  $page     = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
  $perPage  = isset($_GET['per_page']) ? max(1, (int)$_GET['per_page']) : 15;
  $offset   = ($page - 1) * $perPage;
  $author   = trim($_GET['author'] ?? '');
  $month    = trim($_GET['month'] ?? '');
  $title    = trim($_GET['title'] ?? '');
  $keyword  = trim($_GET['keyword'] ?? '');
  $sort     = ($_GET['sort'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC';

  // WHERE句構築
  $where = [];
  $params = [];
  $needsJoin = false;

  if ($author !== '') {
    $where[] = 'posts.created_by = ?';
    $params[] = $author;
  }

  if ($month !== '') {
    $where[] = 'strftime("%Y-%m", posts.created_at) = ?';
    $params[] = $month;
  }

  if ($title !== '') {
    $titleWords = preg_split('/[ 　]+/u', $title, -1, PREG_SPLIT_NO_EMPTY);
    foreach ($titleWords as $word) {
      $where[] = 'posts.title LIKE ?';
      $params[] = '%' . $word . '%';
    }
  }

  if ($keyword !== '') {
    $keywordWords = preg_split('/[ 　]+/u', $keyword, -1, PREG_SPLIT_NO_EMPTY);
    foreach ($keywordWords as $word) {
      $where[] = 'merged.fulltext LIKE ?';
      $params[] = '%' . $word . '%';
      $needsJoin = true;
    }
  }
  // print_r($params);

  $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
  $joinSql = <<<SQL
  LEFT JOIN tabs ON tabs.post_id = posts.id
  LEFT JOIN instructions ON instructions.tab_id = tabs.id
  LEFT JOIN (
    SELECT tab_id, GROUP_CONCAT(text, ' ') AS fulltext
    FROM instructions
    GROUP BY tab_id
  ) AS merged ON merged.tab_id = instructions.tab_id
  SQL;

  // 件数取得
  $countSql = "SELECT COUNT(DISTINCT posts.id) FROM posts $joinSql $whereSql";
  $countStmt = $db->prepare($countSql);
  $countStmt->execute($params);
  $total = (int)$countStmt->fetchColumn();

  // 一覧取得
  $listSql = "SELECT DISTINCT posts.* FROM posts $joinSql $whereSql
              ORDER BY posts.created_at $sort
              LIMIT :limit OFFSET :offset";
  $stmt = $db->prepare($listSql);

  foreach ($params as $i => $val) {
    $stmt->bindValue($i + 1, $val);
  }
  $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
  $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);

  $stmt->execute();
  $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // 画像・日付整形
  foreach ($posts as &$group) {
    $imgStmt = $db->prepare("SELECT image_filename FROM tabs WHERE post_id = ? ORDER BY id ASC LIMIT 1");
    $imgStmt->execute([$group['id']]);
    $image = $imgStmt->fetchColumn();
    $group['image'] = $image ?: null;

    $group['created_at'] = formatDate($group['created_at']);
    $group['updated_at'] = formatDate($group['updated_at']);
  }

  echo json_encode([
    'success' => true,
    'page' => $page,
    'per_page' => $perPage,
    'total' => $total,
    'items' => $posts,
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// 日付整形
function formatDate($datetime) {
  $timestamp = strtotime($datetime);
  return date('Y-m-d H:i', $timestamp);
}
