<?php
require_once __DIR__ . '/../common.php';

try {
  // パラメータ取得
  $page     = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
  $perPage  = isset($_GET['per_page']) ? max(1, (int)$_GET['per_page']) : 15;
  $offset   = ($page - 1) * $perPage;

  $author   = trim($_GET['author'] ?? '');
  $year     = trim($_GET['year'] ?? '');   // ← 追加：年（"2025"）
  $month    = trim($_GET['month'] ?? '');  // ← 月（"01"〜"12" or ''）

  // 互換: month=YYYY-MM が来たら自動分割（旧フロント対策）
  if ($year === '' && preg_match('/^\d{4}-\d{2}$/', $month)) {
    $year  = substr($month, 0, 4);
    $month = substr($month, 5, 2);
  }

  $title    = trim($_GET['title'] ?? '');
  $keyword  = trim($_GET['keyword'] ?? '');
  $sort     = (($_GET['sort'] ?? 'desc') === 'asc') ? 'ASC' : 'DESC';

  // WHERE句
  $where   = [];
  $params  = [];
  $needsJoin = false;

  if ($author !== '') {
    $where[]  = 'posts.created_by = ?';
    $params[] = $author;
  }
  if ($year !== '') {
    $where[]  = "strftime('%Y', posts.created_at) = ?";
    $params[] = $year;
  }
  if ($month !== '') {
    $where[]  = "strftime('%m', posts.created_at) = ?";
    $params[] = $month; // "01"〜"12"
  }

  if ($title !== '') {
    $titleWords = preg_split('/[ 　]+/u', $title, -1, PREG_SPLIT_NO_EMPTY);
    foreach ($titleWords as $word) {
      $where[]  = 'posts.title LIKE ?';
      $params[] = '%' . $word . '%';
    }
  }

  if ($keyword !== '') {
    $keywordWords = preg_split('/[ 　]+/u', $keyword, -1, PREG_SPLIT_NO_EMPTY);
    foreach ($keywordWords as $word) {
      $where[]  = 'merged.fulltext LIKE ?';
      $params[] = '%' . $word . '%';
      $needsJoin = true;
    }
  }

  $whereSql = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

  // JOIN句（keyword検索時のみ有効化）
  $joinSql = '';
  if ($needsJoin) {
    // post単位で instructions.text を集約してから posts に紐付ける
    $joinSql = <<<SQL
      LEFT JOIN (
        SELECT t.post_id, GROUP_CONCAT(i.text, ' ') AS fulltext
        FROM tabs t
        JOIN instructions i ON i.tab_id = t.id
        GROUP BY t.post_id
      ) AS merged ON merged.post_id = posts.id
    SQL;
  }

  // 件数取得
  $countSql = "SELECT COUNT(DISTINCT posts.id) FROM posts {$joinSql} {$whereSql}";
  $countStmt = $db->prepare($countSql);
  $countStmt->execute($params);
  $total = (int)$countStmt->fetchColumn();

  // 一覧取得
  $listSql = "
    SELECT DISTINCT posts.*
    FROM posts
    {$joinSql}
    {$whereSql}
    ORDER BY posts.created_at {$sort}
    LIMIT :limit OFFSET :offset
  ";
  $stmt = $db->prepare($listSql);

  // 位置パラメータを順にバインド
  foreach ($params as $i => $val) {
    $stmt->bindValue($i + 1, $val, PDO::PARAM_STR);
  }
  $stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
  $stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);

  $stmt->execute();
  $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);

  // 代表画像と日付整形
  foreach ($posts as &$group) {
    $imgStmt = $db->prepare("SELECT image_filename FROM tabs WHERE post_id = ? ORDER BY id ASC LIMIT 1");
    $imgStmt->execute([$group['id']]);
    $image = $imgStmt->fetchColumn();
    $group['image'] = $image ?: null;

    $group['created_at'] = formatDate($group['created_at']);
    $group['updated_at'] = formatDate($group['updated_at']);
  }
  unset($group);

  echo json_encode([
    'success'   => true,
    'page'      => $page,
    'per_page'  => $perPage,
    'total'     => $total,
    'items'     => $posts,
  ]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

// 日付整形
function formatDate($datetime) {
  $ts = strtotime($datetime);
  return $ts ? date('Y-m-d H:i', $ts) : '';
}
