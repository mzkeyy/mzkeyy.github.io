# 小説書きのホームページ

GitHub Pages で公開する、タブ切り替え式の 1 ページサイトです。
プロフィール／作品／公募・受賞歴／お知らせ（X へのリンク付き）の 4 つのタブがあります。

## 更新のしかた

`data/` フォルダ内の YAML ファイルを編集して push すると、1〜2 分ほどでサイトに反映されます。HTML を触る必要はありません。

| ファイル | 内容 |
|---|---|
| `data/profile.yml` | ペンネーム、自己紹介、ジャンル、なろう・カクヨム・X の URL |
| `data/works.yml` | 作品一覧 |
| `data/contests.yml` | 公募・受賞歴（結果バッジの色は自動で決まります） |
| `data/news.yml` | お知らせ |

書き方はそれぞれのファイル冒頭のコメントに書いてあります。

**YAML を書くときの注意**
- 字下げ（行頭のスペース）はそろえてください。タブ文字ではなく半角スペースを使います
- `: `（コロンと半角スペース）の後ろに値を書きます
- 値の中に `: ` や `#` を含めたいときは、全体を `"` で囲みます。例: `contest: "賞名: 副題"`

### アイコン画像
`assets/img/icon.png` などに画像を置き、`profile.yml` の `icon:` にそのパスを書いてください。

### SNS でシェアしたときの表示
`index.html` 冒頭の `<title>` と `og:...` の行を直接書き換えてください。
X などのシェアカードは JavaScript を実行しないので、YAML の内容は反映されません。

## 手元で確認する

ブラウザで `index.html` をダブルクリックして開くと、データを読み込めません（ブラウザのセキュリティ制限によるものです）。
次のコマンドで簡易サーバーを起動してから http://localhost:8000 を開いてください。

```bash
python3 -m http.server 8000
```

## 公開手順（初回のみ）

1. GitHub で **`mzkeyy.github.io`** という名前の public リポジトリを作成します。名前はこのとおりにする必要があります
2. このフォルダで次を実行します
   ```bash
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/mzkeyy/mzkeyy.github.io.git
   git push -u origin main
   ```
3. リポジトリの **Settings → Pages** を開き、Source を「Deploy from a branch」、Branch を `main` / `(root)` にして保存します
4. 数分後に `https://mzkeyy.github.io/` で公開されます

## 構成

```
index.html            ページの枠組み（タイトル・OGP はここ）
assets/css/style.css  デザイン
assets/js/main.js     YAML を読み込んで表示する処理
assets/img/           ファビコン・アイコン画像
data/*.yml            掲載内容
.nojekyll             GitHub Pages の Jekyll 処理を無効にするためのファイル
```
