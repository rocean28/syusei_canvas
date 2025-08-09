<?php
// 出力関数（CLI / HTML 自動判別）
function output($text) {
  if (php_sapi_name() === 'cli') {
    echo $text . "\n";
  } else {
    echo $text . "<br>\n";
  }
}

// ---- 設定 ----
date_default_timezone_set('Asia/Tokyo'); // サーバ差異をなくす
$dbPath = __DIR__ . '/database.sqlite';
$now = date('Ymd_His');

$backupDir = __DIR__ . "/backup/{$now}";
$backupFileName = 'database.sqlite';
$backupPath = $backupDir . "/{$backupFileName}";

// エラーログ出力設定（任意）
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/backup_error.log');

// ---- 事前チェック ----
if (!file_exists($dbPath)) {
  output("元のDBが存在しません: $dbPath");
  exit;
}

// ---- ディレクトリ作成 ----
if (!is_dir($backupDir) && !mkdir($backupDir, 0755, true)) {
  output("バックアップ用ディレクトリの作成に失敗: $backupDir");
  exit;
}

// ---- SQLite バックアップ ----
try {
  $source = new SQLite3($dbPath, SQLITE3_OPEN_READONLY);
  $dest = new SQLite3($backupPath, SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);

  if (!$source) {
    output("SQLite 3データベースに接続できません: " . SQLite3::lastErrorMsg());
    exit;
  }

  if ($source->backup($dest)) {
    output("バックアップ成功（SQLite3::backup）: $backupPath");
  } else {
    output("バックアップ失敗（SQLite3::backup）");
    $source->close();
    $dest->close();
    exit;
  }

  $source->close();
  $dest->close();

} catch (Exception $e) {
  output("バックアップ中にエラー発生: " . $e->getMessage());
  exit;
}

// ---- 圧縮処理（Zip化） ----
$zipPath = $backupDir . '.zip';
$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) === TRUE) {
  $files = glob($backupDir . '/*') ?: [];
  foreach ($files as $file) {
    $localName = basename($file);
    $zip->addFile($file, $localName);
  }
  $zip->close();
  @chmod($zipPath, 0644);
  output("→ 圧縮完了: {$zipPath}");

  // ZIP後に元ファイル削除
  foreach ($files as $file) {
    @unlink($file);
  }
  @rmdir($backupDir);
} else {
  output("→ ZIPの作成に失敗しました");
  // ZIP失敗時は生ファイルを残して終了（後続のクリーンアップは実施しない）
  exit;
}

// ---- ここから「最新3件だけ残す」クリーンアップ ----
(function (string $dir, int $keep = 3) {
  $paths = glob($dir . '/*.zip') ?: [];
  if (!$paths) {
    output('削除対象ZIPなし。');
    return;
  }

  // [path, ts] に正規化（ファイル名優先で日時解釈、ダメなら filemtime）
  $entries = [];
  foreach ($paths as $path) {
    $base = basename($path, '.zip');
    $ts = null;

    if (preg_match('/^(\d{8})_(\d{6})$/', $base, $m)) {
      $dt = DateTime::createFromFormat('Ymd His', "{$m[1]} {$m[2]}", new DateTimeZone('Asia/Tokyo'));
      if ($dt !== false) {
        $ts = $dt->getTimestamp();
      }
    }
    if ($ts === null) {
      $ts = @filemtime($path) ?: 0;
    }

    $entries[] = ['path' => $path, 'ts' => $ts];
  }

  // 新しい順（降順）に並べる。タイはパス名降順で安定化
  usort($entries, function ($a, $b) {
    if ($a['ts'] === $b['ts']) {
      return strcmp($b['path'], $a['path']) * -1;
    }
    return $b['ts'] <=> $a['ts'];
  });

  // 先頭から$keep件を残し、それ以外を削除
  $toDelete = array_slice($entries, $keep);
  foreach ($toDelete as $e) {
    $zipFile = $e['path'];
    if (@unlink($zipFile)) {
      output("古いバックアップZIP削除済: {$zipFile}");
    } else {
      output("古いバックアップZIP削除失敗: {$zipFile}");
    }
  }

  output(sprintf('最新%d件を残して %d 件削除（合計 %d 件）', $keep, count($toDelete), count($entries)));
})(__DIR__ . '/backup', 3);
