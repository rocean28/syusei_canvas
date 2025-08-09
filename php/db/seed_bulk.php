<?php
// seed_bulk.php
// 使い方: seed_bulk.php?count=100&truncate=0
// posts N件を追加し、各postに tabs 1件 + instructions 3件を自動生成して紐づける。

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

// ======== 環境に合わせて調整するならここ =========
$dbPath = __DIR__ . '/database.sqlite';
// ================================================

header('Content-Type: text/plain; charset=UTF-8');

$count    = isset($_GET['count']) ? max(1, (int)$_GET['count']) : 100;
$truncate = isset($_GET['truncate']) ? (int)$_GET['truncate'] : 0;

// 乱数ヘルパ
function randStr(int $len = 8): string {
  $pool = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  $s = '';
  for ($i=0; $i<$len; $i++) $s .= $pool[random_int(0, strlen($pool)-1)];
  return $s;
}
function idLike(): string {
  // 日付っぽく見えないID（base36の時刻＋ランダム）
  $t = base_convert((string)time(), 10, 36);
  return strtoupper($t . randStr(6));
}

/**
 * 2020〜2025年の中でランダムな日時を返す（YYYY-MM-DD HH:ii:ss）
 */
function randomDateInRange2020to2025(): string {
  $year  = random_int(2020, 2025);
  $month = random_int(1, 12);
  $day   = random_int(1, cal_days_in_month(CAL_GREGORIAN, $month, $year));
  $hour  = random_int(0, 23);
  $min   = random_int(0, 59);
  $sec   = random_int(0, 59);
  return sprintf('%04d-%02d-%02d %02d:%02d:%02d', $year, $month, $day, $hour, $min, $sec);
}

/**
 * 指定日時（$from）以降〜2025-12-31 23:59:59 の範囲でランダム日時
 */
function randomDateAfter(string $from): string {
  $start = strtotime($from) ?: time();
  $end   = strtotime('2025-12-31 23:59:59');
  if ($start >= $end) return date('Y-m-d H:i:s', $end);
  $ts = random_int($start, $end);
  return date('Y-m-d H:i:s', $ts);
}

try {
  if (!file_exists($dbPath)) {
    throw new RuntimeException("DBファイルがない: {$dbPath}");
  }

  $pdo = new PDO('sqlite:' . $dbPath, null, null, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  ]);

  // テーブル存在チェック（最低限）
  $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
  foreach (['posts','tabs','instructions'] as $t) {
    if (!in_array($t, $tables, true)) {
      throw new RuntimeException("テーブル {$t} が見つからない。先に初期化スクリプトを実行してくれ。");
    }
  }

  if ($truncate === 1) {
    $pdo->beginTransaction();
    $pdo->exec('DELETE FROM instructions');
    $pdo->exec('DELETE FROM tabs');
    $pdo->exec('DELETE FROM posts');
    $pdo->commit();
    echo "INFO: 既存データを全削除した。\n";
  }

  $pdo->beginTransaction();

  $postStmt = $pdo->prepare('
    INSERT INTO posts (id, title, category, created_at, updated_at, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  ');
  $tabStmt = $pdo->prepare('
    INSERT INTO tabs (post_id, image_filename, title, url, image_src)
    VALUES (?, ?, ?, ?, ?)
  ');
  $instStmt = $pdo->prepare('
    INSERT INTO instructions (id, tab_id, x, y, width, height, text, comment, is_fixed, is_ok)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ');

  $insertedPosts = 0;
  $insertedTabs = 0;
  $insertedInst = 0;

  for ($i = 1; $i <= $count; $i++) {
    // posts
    $postId = 'P_' . idLike();
    $title  = "ダミー案件 {$i}";
    $category = ['no_category','LP','EC','Corporate','Blog'][array_rand([0,1,2,3,4])];

    // 作成日は 2020〜2025 のランダム、更新日は必ず作成日以降
    $created = randomDateInRange2020to2025();
    $updated = randomDateAfter($created);

    $postStmt->execute([
      $postId,
      $title,
      $category,
      $created,
      $updated,
      'guest',
      'guest'
    ]);
    $insertedPosts++;

    // tabs（1件）
    $imgIndex = random_int(1, 9);
    $imageFilename = "dummy_{$imgIndex}.webp";
    $tabTitle = "画像 {$imgIndex}";
    $url = "https://example.com/page/" . strtolower(randStr(6));
    $imageSrc = "/uploads/".date('Y')."/".date('m')."/{$postId}/{$imageFilename}"; // 使わないならNULLでもOK

    $tabStmt->execute([
      $postId, $imageFilename, $tabTitle, $url, $imageSrc
    ]);
    $tabId = (int)$pdo->lastInsertId();
    $insertedTabs++;

    // instructions（3件）
    $w = 1280; $h = 800; // 想定キャンバス
    for ($k = 1; $k <= 3; $k++) {
      $x = random_int(0, $w - 200) + random_int(0, 99) / 100;
      $y = random_int(0, $h - 120) + random_int(0, 99) / 100;
      $rw = random_int(80, 240) + random_int(0, 99) / 100;
      $rh = random_int(60, 180) + random_int(0, 99) / 100;

      $instStmt->execute([
        'I_' . idLike(),
        $tabId,
        $x, $y, $rw, $rh,
        "テキスト例 {$i}-{$k}",
        (random_int(0,1) ? "コメント例 {$i}-{$k}" : ''),
        random_int(0,1),
        random_int(0,1),
      ]);
      $insertedInst++;
    }
  }

  $pdo->commit();

  echo "OK: posts {$insertedPosts}件, tabs {$insertedTabs}件, instructions {$insertedInst}件 を挿入した。\n";
  echo "完了: " . date('Y-m-d H:i:s') . "\n";

} catch (Throwable $e) {
  if (isset($pdo) && $pdo->inTransaction()) {
    $pdo->rollBack();
  }
  http_response_code(500);
  echo "ERROR: " . $e->getMessage() . "\n";
}
