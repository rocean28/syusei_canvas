<?php
require_once __DIR__ . '/../common.php';

$lockDir = __DIR__ . '/editing';
$files = glob("$lockDir/*.json");

$unlocked = [];

foreach ($files as $file) {
  if (is_file($file)) {
    $id = basename($file, '.json');
    unlink($file);
    $unlocked[] = $id;
  }
}

echo json_encode([
  'success' => true,
  'unlocked_ids' => $unlocked
]);
