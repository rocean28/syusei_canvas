<?php
// 出力関数（CLI / HTML 自動判別）
function output($text) {
  if (php_sapi_name() === 'cli') {
    echo $text . "\n";
  } else {
    echo $text . "<br>\n";
  }
}

// 設定
$dbPath = __DIR__ . '/database.sqlite';
$now = date('Ymd_His');

$backupDir = __DIR__ . "/backup/{$now}";
$backupFileName = "database.sqlite";
$backupPath = $backupDir . "/{$backupFileName}";

// エラーログ出力設定（任意）
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/backup_error.log');

// DB存在確認
if (!file_exists($dbPath)) {
  output("元のDBが存在しません: $dbPath");
  exit;
}

// ディレクトリ作成
if (!is_dir($backupDir)) {
  mkdir($backupDir, 0755, true);
}

// バックアップ用に接続
try {
  $source = new SQLite3($dbPath, SQLITE3_OPEN_READONLY);
  $dest = new SQLite3($backupPath, SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);

  if (!$source) {
    die("SQLite 3データベースに接続できません: " . $source->lastErrorMsg());
  }

  if ($source->backup($dest)) {
    output("バックアップ成功（SQLite3::backup）: $backupPath");
  } else {
    output("バックアップ失敗（SQLite3::backup）");
    exit;
  }

  $source->close();
  $dest->close();

} catch (Exception $e) {
  output("バックアップ中にエラー発生: " . $e->getMessage());
  exit;
}

// 圧縮処理（Zip化）
$zipPath = $backupDir . ".zip";
$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
  $files = glob($backupDir . '/*');
  foreach ($files as $file) {
    $localName = basename($file);
    $zip->addFile($file, $localName);
  }
  $zip->close();
  output("→ 圧縮完了: {$zipPath}");

  // ZIP後に元ファイル削除
  foreach ($files as $file) {
    unlink($file);
  }
  rmdir($backupDir);
} else {
  output("→ ZIPの作成に失敗しました");
}

// 古いバックアップZIP削除（3ヶ月より前）
$expireTime = strtotime('-3 months');
foreach (glob(__DIR__ . '/backup/*.zip') as $zipFile) {
  $basename = basename($zipFile, '.zip');
  if (preg_match('/^(\d{8})_\d{6}$/', $basename, $matches)) {
    $datePart = $matches[1];
    $fileTime = strtotime($datePart);
    if ($fileTime !== false && $fileTime < $expireTime) {
      if (unlink($zipFile)) {
        output("古いバックアップZIP削除済: $zipFile");
      } else {
        output("古いバックアップZIP削除失敗: $zipFile");
      }
    }
  }
}
