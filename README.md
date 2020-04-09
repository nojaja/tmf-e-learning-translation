# tmf-e-learning-translation


## how to use

1. 翻訳する対象の配置
ファイルを/input/配下に配置（サブフォルダOK、複数同時OK)
※\html5\lib\scripts\app.min.jsを配置しないようにしてください

2. 辞書ファイルの作成
直下にdic.csvを配置

3. 文章抽出の実行
cmdで`npm start`もしくは`chcp 65001 && webvtt-translator.exe`


4. フレーズの翻訳
特定の文言にしたいフレーズを`dic.csv`に登録します。

1回目の実行で生成されたoutput.csvを
Googleスプレットシートにインポートします。
CSVオプションとして、区切り文字の種類はカンマ、テキストを数値、日付、数式に変換は「いいえ」を選択

A列に英文、Bにも同じ英文が表示されます。

この中で切り出したいフレーズのみに絞り込んで翻訳後のフレーズをB列に記載してください

例
`
Wrap up and review	仕上げとレビュー
Further Study	さらなる学習
`

ダウンロード→カンマ区切りの値としてdic.csvに保存します。

5. 文章抽出の実行
cmdで`npm start`もしくは`chcp 65001 && webvtt-translator.exe`

6. 文章の翻訳
翻訳作業を行います。
2回目の実行で生成されたoutput.csvを
Googleスプレットシートにインポートします。
CSVオプションとして、区切り文字の種類はカンマ、テキストを数値、日付、数式に変換は「いいえ」を選択

A列に英文、Bにはdicに登録されたフレーズのみ日本語になった英文が表示されます。

このB列をDeepL翻訳やGoogle翻訳で翻訳してください。
カンマやクォータについては変換時にCSVで構文エラーとなる可能性があるので注意してください。

ダウンロード→カンマ区切りの値としてinput.csvに保存します。

7. 文章翻訳の実行
cmdで`npm start`もしくは`chcp 65001 && webvtt-translator.exe`

outputフォルダに翻訳後のデータが作成されます。

