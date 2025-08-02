<?php
// CORS対応（Originチェックはここで早めにやる）
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = [
  'http://localhost:5173',
  'https://syusei.lk-dev.net',
];
if (in_array($origin, $allowedOrigins, true)) {
  header("Access-Control-Allow-Origin: $origin");
  header("Access-Control-Allow-Credentials: true");
  header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
  header("Access-Control-Allow-Headers: Content-Type");
}

// プリフライトリクエストはここで即終了（OPTIONSの前に認証チェック入れるな）
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit;
}

$expire_seconds = 60 * 60 * 24 * 30;

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
  || $_SERVER['SERVER_PORT'] == 443;
$isLocal = in_array($_SERVER['HTTP_HOST'], ['localhost']);

$useSecureCookie = !$isLocal && $isHttps;

session_set_cookie_params([
  'lifetime' => $expire_seconds,
  'path' => '/',
  'secure' => $useSecureCookie,
  'httponly' => true,
  'samesite' => 'Lax'
]);

session_start();
header('Content-Type: application/json');

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
  // http_response_code(401);
  echo json_encode([
    'success' => false,
    'message' => 'ログイン失敗'
  ]);
}