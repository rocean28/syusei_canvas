<?php
require_once __DIR__ . '/../common.php';

/* 処理
------------------------------*/

try {
  $json = file_get_contents('php://input');
  $data = json_decode($json, true);

  if (!isset($data['id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing ID']);
    exit;
  }

  $fields = [];
  $params = [];

  if (isset($data['is_fixed'])) {
    $fields[] = 'is_fixed = ?';
    $params[] = $data['is_fixed'];
  }
  if (isset($data['is_ok'])) {
    $fields[] = 'is_ok = ?';
    $params[] = $data['is_ok'];
  }

  if (empty($fields)) {
    echo json_encode(['success' => false, 'error' => 'No fields to update']);
    exit;
  }

  $params[] = $data['id'];

  $stmt = $db->prepare("UPDATE instructions SET " . implode(', ', $fields) . " WHERE id = ?");
  $stmt->execute($params);

  echo json_encode(['success' => true]);
} catch (Exception $e) {
  echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
