## 修正手順

**1. ローカルリポジトリを最新の状態にする**  
  ※ローカルリポジトリがない場合は任意のディレクトリで下記を実行。  
  `git clone https://github.com/rWada-coder/syusei_canvas.git`  
  `npm install`

**3. 設置サーバーからgitignoreされている必要ファイルをダウンロード**  
   * `.env`
   * `php/auth/user.php`
   * `php/db/database.sqlite`
   * `uploads/`

**4. 修正**  
  
**5. ローカルで確認**  
   `.env`は開発環境の内容にして、下記コマンドを実行。  
   `npm run dev`

**6. ビルド**  
   .envを本番環境のものにして、下記コマンドを実行。  
   `npm run build`

**7. サーバーにアップロード**  
   `/dist/` の中身と `/php/` ディレクトリをサーバーにアップロード。

**8. ツールにアクセスして確認**  
   `[設置URL]/` にアクセス。

**9. リモートリポジトリに修正内容をcommit & push**  


---

## 画像アップロードのおすすめの方法（Chrome利用）

**1. 拡張機能をインストール**  
   全ページキャプチャのできるChrome拡張機能を追加する。お勧めは下記。
   * [FireShot](https://chromewebstore.google.com/detail/mcbpblocgmgfnpjjppndjkmgjaogfceg?utm_source=item-share-cb)
   * [AUNライブキャプチャ](https://chromewebstore.google.com/detail/nklehcoamlgpnlljogplljnidlciimgo?utm_source=item-share-cb)

**2. 修正したいページにアクセスし、拡張機能でキャプチャ**

**3. 「クリップボードにコピー」をクリック**

**4. 修正Canvasにアクセス**

**5. 画像アップロード画面で以下のいずれかを実行**  
   - 「**クリップボードから貼り付け**」をクリック  
   - または **Ctrl + V** を押して貼り付け
