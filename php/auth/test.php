<?php
require_once __DIR__ . '/../common.php';

$expire_seconds = 60 * 60 * 24 * 30;

$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
  || $_SERVER['SERVER_PORT'] == 443;
$isLocal = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1', '127.0.0.4:32778']);

$useSecureCookie = !$isLocal && $isHttps;
var_dump($isHttps);

