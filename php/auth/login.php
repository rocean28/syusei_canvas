<?php
require_once __DIR__ . '/../common.php';

$expire_seconds = 60 * 60 * 24 * 30;

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
  || $_SERVER['SERVER_PORT'] == 443;
$isLocal = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1', '127.0.0.4:32778']);

$useSecureCookie = !$isLocal && $isHttps;

session_set_cookie_params([
  'lifetime' => $expire_seconds,
  'path' => '/',
  'secure' => $useSecureCookie,
  'httponly' => true,
  'samesite' => 'Lax'
]);

session_start();

$users = include __DIR__ . '/users.php';
// print_r($users);

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['username'] ?? '';
$password = $data['password'] ?? '';

// パスワード照合
if (isset($email) && password_verify($password, $users[$email]['password'])) {
  session_regenerate_id(true);
  $_SESSION['user_email'] = $email;
  $_SESSION['user_name'] = $users[$email]['name'] ?? $email;
  $_SESSION['login_time'] = time();

  echo json_encode([
    'success' => true,
    'user' => $_SESSION['user_name']
  ]);
} else {
  http_response_code(401);
  echo json_encode([
    'success' => false,
    'message' => 'ログイン失敗'
  ]);
}