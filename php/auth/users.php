<?php
// 共通パスワード（ハッシュ化済）
$common_password = '$2y$10$XRHw5P/voMmIpK9Xh/Q9ku/e3R6bC9U91dJkzy1kD7qO1krJ5f.pu';

return [
  'admin@syuseicanvas.co.jp' => [
    'password' => $common_password,
    'name' => '管理者'
  ],
  'test@syuseicanvas.co.jp' => [
    'password' => $common_password,
    'name' => 'テスト'
  ],
  'test02@syuseicanvas.co.jp' => [
    'password' => $common_password,
    'name' => 'テスト2号機'
  ],
];
