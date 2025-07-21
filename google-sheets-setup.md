# Google Sheets連携セットアップガイド

## 1. Google Spreadsheet準備

### スプレッドシート作成
1. Google Driveで新しいスプレッドシートを作成
2. 名前を「請求書データ」に変更
3. 以下の縦型フォーマットでA列に項目名を設定：

| A列 | B列以降（各請求書のデータ） |
|-----|---------------------------|
| 会社名 | 株式会社○○ |
| 担当者名 | 山田太郎 |
| 請求日 | 2025-07-21 |
| 支払期日 | 2025-08-20 |
| 請求番号 | INV-20250721-001 |
| 商品名 | 商品A, 商品B |
| 単価 | 1000, 2000 |
| 数量 | 2, 1 |
| 小計 | 4000 |
| 消費税 | 400 |
| 合計 | 4400 |
| 備考 | 振込手数料はご負担ください |

## 2. Google Apps Script設定

### Apps Scriptエディタを開く
1. スプレッドシートで「拡張機能」→「Apps Script」をクリック
2. 新しいプロジェクトが開かれる

### 以下のコードをコピー＆ペースト：

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

// データ取得用の関数（オプション）
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    // ヘッダー行を除いてデータを返す
    const invoices = data.slice(1).map(row => ({
      timestamp: row[0],
      companyName: row[1],
      contactPerson: row[2],
      invoiceDate: row[3],
      dueDate: row[4],
      invoiceNumber: row[5],
      items: JSON.parse(row[6] || '[]'),
      subtotal: row[7],
      taxAmount: row[8],
      total: row[9]
    }));
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: invoices
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: 'データ取得エラー: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 3. Webアプリとして公開

1. 「デプロイ」→「新しいデプロイ」をクリック
2. 種類：「ウェブアプリ」を選択
3. 説明：「請求書データAPI」
4. 実行者：「自分」
5. アクセスできるユーザー：「全員」
6. 「デプロイ」をクリック
7. **Webアプリ URL をコピーして保存**

## 4. セキュリティ設定

### 権限の承認
1. 初回実行時に権限を求められる
2. 「詳細」→「安全ではないページに移動」
3. 必要な権限を許可

### アクセス制限（推奨）
- 「アクセスできるユーザー」を「Googleアカウントを持つユーザー」に変更
- または特定のドメインに制限

## 5. フロントエンド実装

WebアプリのURLを使用してJavaScriptからデータを送信します。
次のステップでクライアント側のコードを更新します。

## ❗ トラブルシューティング

### エラー: Failed to fetch
**最も一般的なエラー - 必ずこの手順で解決してください**

1. **新しいデプロイを作成**
   - 既存のデプロイを編集するのではなく、「新しいデプロイ」を作成
   - 毎回新しいバージョンを作成する
   
2. **アクセス権限を確認**
   - 「アクセスできるユーザー」: **「全員」** を選択
   - 「実行者」: **「自分」** を選択

3. **WebアプリURLをテスト**
   - 新しいURLをブラウザで直接開く
   - 以下のようなJSONが表示されるか確認：
   ```json
   {"success":true,"message":"Google Apps Script API は正常に動作しています"}
   ```

4. **環境変数を更新**
   - `.env.local` に新しいURLを設定
   - ブラウザのキャッシュをクリア（Ctrl+F5）

### エラー: 403 Forbidden
- アクセス権限の設定を「全員」に変更してください
- Google アカウントでログインしているか確認

### データが保存されない
- WebアプリURLが正しいか確認
- Apps Scriptのログを確認（実行トランスクリプト）
- ブラウザの開発者ツール（F12）でネットワークエラーを確認

### 項目名が表示されない
- A列に手動で項目名を入力してください

### 重要な注意点
- **必ず「新しいデプロイ」を作成**（既存の編集は避ける）
- URLが変わるため、`.env.local` の更新を忘れずに
- デプロイ後、最初のリクエストは少し時間がかかる場合があります