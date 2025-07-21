# Google Sheets連携 完全セットアップガイド

## 🎯 概要
請求書アプリとGoogle Sheetsを連携し、縦型フォーマットでデータを保存する方法を説明します。

## 📊 スプレッドシートの準備

### 1. 新しいスプレッドシートを作成
1. [Google Sheets](https://sheets.google.com) を開く
2. 「新しいスプレッドシートを作成」をクリック
3. 名前を「請求書データ」に変更

### 2. A列に項目名を設定
以下をA列に縦に入力してください：

```
A1: 会社名
A2: 担当者名
A3: 請求日
A4: 支払期日
A5: 請求番号
A6: 商品名
A7: 単価
A8: 数量
A9: 小計
A10: 消費税
A11: 合計
A12: 備考
```

## ⚙️ Google Apps Script設定

### 1. Apps Scriptエディタを開く
1. スプレッドシートで「拡張機能」→「Apps Script」をクリック
2. 新しいプロジェクトが開かれる
3. プロジェクト名を「請求書API」に変更

### 2. コードを貼り付け
`Code.gs`ファイルの内容を全て削除し、以下のコードを貼り付けてください：

```javascript
function doPost(e) {
  try {
    // スプレッドシートを取得
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // POSTデータを解析
    const data = JSON.parse(e.postData.contents);
    
    // 次の空いている列を見つける（B列から開始）
    const lastColumn = sheet.getLastColumn();
    const nextColumn = Math.max(2, lastColumn + 1); // B列（2）から開始
    
    // A列に項目名がない場合は設定
    if (sheet.getRange('A1').getValue() === '') {
      const itemNames = [
        '会社名',
        '担当者名', 
        '請求日',
        '支払期日',
        '請求番号',
        '商品名',
        '単価',
        '数量',
        '小計',
        '消費税',
        '合計',
        '備考'
      ];
      
      // A列に項目名を縦に設定
      for (let i = 0; i < itemNames.length; i++) {
        sheet.getRange(i + 1, 1).setValue(itemNames[i]);
      }
    }
    
    // 商品データを文字列に変換
    const itemNames = data.items.map(item => item.name).join(', ');
    const itemPrices = data.items.map(item => item.unitPrice).join(', ');
    const itemQuantities = data.items.map(item => item.quantity).join(', ');
    
    // 縦型データを作成
    const verticalData = [
      data.companyName,           // 会社名
      data.contactPerson,         // 担当者名
      data.invoiceDate,           // 請求日
      data.dueDate,               // 支払期日
      data.invoiceNumber,         // 請求番号
      itemNames,                  // 商品名
      itemPrices,                 // 単価
      itemQuantities,             // 数量
      data.subtotal,              // 小計
      data.taxAmount,             // 消費税
      data.total,                 // 合計
      data.notes || ''            // 備考
    ];
    
    // データを縦に配置（nextColumn列に）
    for (let i = 0; i < verticalData.length; i++) {
      sheet.getRange(i + 1, nextColumn).setValue(verticalData[i]);
    }
    
    // 成功レスポンス
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'データが正常に保存されました'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // エラーレスポンス
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'エラーが発生しました: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 3. 保存とテスト
1. 💾 保存ボタンをクリック
2. 「testFunction」を「doPost」に変更
3. ▶️ 実行ボタンでテスト実行
4. 権限を求められたら「承認」

## 🚀 Webアプリとして公開

### 1. デプロイ設定
1. 「デプロイ」→「新しいデプロイ」をクリック
2. 種類：「ウェブアプリ」を選択
3. 説明：「請求書データAPI」と入力
4. 実行者：「自分」を選択
5. アクセスできるユーザー：「全員」を選択

### 2. デプロイ実行
1. 「デプロイ」ボタンをクリック
2. 権限の承認を行う
3. **WebアプリURL をコピー** (重要！)
   - 例：`https://script.google.com/macros/s/ABC123.../exec`

## 🔗 アプリとの連携

### 1. URLの設定
1. 請求書アプリを開く
2. 「Google Sheetsに保存」ボタンをクリック
3. コピーしたWebアプリURLを入力
4. 「保存」をクリック

### 2. テスト実行
1. 請求書フォームに適当なデータを入力
2. 「Google Sheetsに保存」ボタンをクリック
3. スプレッドシートにデータが縦型で保存されることを確認

## 📋 データの確認

保存後、スプレッドシートは以下のようになります：

| A列 | B列（1件目） | C列（2件目） | D列（3件目）... |
|-----|-------------|-------------|----------------|
| 会社名 | 株式会社ABC | 合同会社XYZ | ... |
| 担当者名 | 田中太郎 | 佐藤花子 | ... |
| 請求日 | 2025-07-21 | 2025-07-22 | ... |
| 支払期日 | 2025-08-20 | 2025-08-21 | ... |
| ... | ... | ... | ... |

## ❗ トラブルシューティング

### エラー: 403 Forbidden
- アクセス権限の設定を「全員」に変更してください

### データが保存されない
- WebアプリURLが正しいか確認
- Apps Scriptのログを確認（実行トランスクリプト）

### 項目名が表示されない
- A列に手動で項目名を入力してください