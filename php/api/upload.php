<?php
// モード切替（'save' | 'light' | 'webp'）
$mode = 'webp';
// 品質（0～100）
$quality = 80;

// ログ設定
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../../logs/php_error.log');
error_reporting(E_ALL);

// メモリ設定
ini_set('memory_limit', '1024M');

require_once __DIR__ . '/../common.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  echo json_encode(['success' => false, 'error' => 'Invalid request', 'filename' => null]);
  exit;
}

if (!isset($_POST['group_id'])) {
  echo json_encode(['success' => false, 'error' => 'IDが指定されていません', 'filename' => null]);
  exit;
}

$groupId = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $_POST['group_id']);
$year = date('Y');
$month = date('m');
$uploadDir = __DIR__ . "/../../uploads/{$year}/{$month}/{$groupId}/";
if (!file_exists($uploadDir)) mkdir($uploadDir, 0777, true);

$result = [];
$finalFilename = null;

foreach ($_FILES as $key => $file) {
  if ($file['error'] !== UPLOAD_ERR_OK) {
    $result[] = ['file' => $key, 'success' => false, 'error' => 'アップロードエラー'];
    continue;
  }

  $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
  $filename = 'img_' . uniqid();
  $originalName = $filename . '.' . $ext;
  $originalPath = $uploadDir . $originalName;

  // WebPファイルは全モード共通でそのまま保存
  if ($ext === 'webp') {
    if (move_uploaded_file($file['tmp_name'], $originalPath)) {
      $result[] = ['file' => $key, 'success' => true, 'filename' => $originalName];
      if (!$finalFilename) $finalFilename = $originalName;
    } else {
      $result[] = ['file' => $key, 'success' => false, 'error' => 'WebPファイルの保存に失敗'];
    }
    continue;
  }

  // save（そのまま保存）
  if ($mode === 'save') {
    if (move_uploaded_file($file['tmp_name'], $originalPath)) {
      $result[] = ['file' => $key, 'success' => true, 'filename' => $originalName];
      if (!$finalFilename) $finalFilename = $originalName;
    } else {
      $result[] = ['file' => $key, 'success' => false, 'error' => '保存に失敗しました'];
    }
    continue;
  }

  // 軽量化またはWebP変換
  $image = null;
  switch ($ext) {
    case 'jpg':
    case 'jpeg':
      $image = imagecreatefromjpeg($file['tmp_name']);
      break;
    case 'png':
      $image = imagecreatefrompng($file['tmp_name']);
      imagepalettetotruecolor($image);
      imagealphablending($image, true);
      imagesavealpha($image, true);
      break;
    default:
      $result[] = ['file' => $key, 'success' => false, 'error' => '非対応の画像形式'];
      continue 2;
  }

  if (!$image) {
    $result[] = ['file' => $key, 'success' => false, 'error' => '画像の読み込みに失敗'];
    continue;
  }

  // 保存先と拡張子を決定
  if ($mode === 'webp') {
    $convertedName = $filename . '.webp';
    $convertedPath = $uploadDir . $convertedName;
    $success = imagewebp($image, $convertedPath, $quality);
  } else {
    $convertedName = $filename . '.' . $ext;
    $convertedPath = $uploadDir . $convertedName;
    if ($ext === 'jpg' || $ext === 'jpeg') {
      $success = imagejpeg($image, $convertedPath, $quality);
    } elseif ($ext === 'png') {
      $success = imagepng($image, $convertedPath, 6);
    }
  }

  imagedestroy($image);

  if ($success) {
    $result[] = ['file' => $key, 'success' => true, 'filename' => $convertedName];
    if (!$finalFilename) $finalFilename = $convertedName;
  } else {
    $result[] = ['file' => $key, 'success' => false, 'error' => '変換・保存に失敗'];
  }
}

echo json_encode([
  'success' => true,
  'results' => $result,
  'filename' => $finalFilename
]);
