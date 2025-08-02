<?php
require_once __DIR__ . '/../common.php';

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? '';

if (!$id) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'IDが指定されていません']);
  exit;
}

$lockFile = __DIR__ . "/editing/$id.json";

if (file_exists($lockFile)) {
  unlink($lockFile);
}

echo json_encode(['success' => true]);
