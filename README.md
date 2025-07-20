## 設置手順

1. リポジトリをクローン  
   `git clone https://github.com/rocean28/syusei_canvas.git`

2. 環境ファイルを作成  
   `.env.example` を `.env` にコピー  
   `cp .env.example .env`

3. `.env` の環境変数を設定

4. 認証ユーザーを設定  
   `php/auth/users.sample.php` を `users.php` にコピー  
   `cp php/auth/users.sample.php php/auth/users.php`  
   `users.php` 内で任意のユーザーを設定

5. 依存パッケージのインストール  
   `npm install`

6. ビルド  
   `npm run build`

7. サーバーにアップロード  
   `/dist/` の中身と `/php/` ディレクトリをサーバーにアップロード

8. 初期化スクリプトにアクセス  
   `[設置URL]/php/db/init_db.php` にブラウザでアクセス

9. ツールにアクセス  
   `[設置URL]/` にアクセス

---

## 画像アップロードのおすすめの方法（Chrome利用）

1. **拡張機能をインストール**  
   以下の拡張機能をChromeに追加します。  
   [AUNライブキャプチャ（Chrome ウェブストア）](https://chromewebstore.google.com/detail/aun%E3%83%A9%E3%82%A4%E3%83%96%E3%82%AD%E3%83%A3%E3%83%97%E3%83%81%E3%83%A3/nklehcoamlgpnlljogplljnidlciimgo?hl=ja)

2. **修正したいページにアクセスし、拡張機能でキャプチャ**

3. **「クリップボードにコピー」をクリック**

4. **修正指示Canvasにアクセス**

5. **画像アップロード画面で以下のいずれかを実行**  
   - 「**クリップボードから貼り付け**」をクリック  
   - または **Ctrl + V** を押して貼り付け

---

## Tips

- **ページ全体のキャプチャが必要ない場合**は、おにぎりこと [Rapture（ラプチャー）](https://freesoft-100.com/review/rapture.html) の使用もおすすめです。

### Raptureを使った手順

1. おにぎりでキャプチャ  

2. キャプチャの上で Ctrl + C を押して、クリップボードにコピー

3. 修正指示Canvasを開いて、Ctrl + V を押して貼り付け