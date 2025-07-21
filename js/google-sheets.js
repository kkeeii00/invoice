// Google Sheets連携モジュール

class GoogleSheetsConnector {
    constructor() {
        this.webAppUrl = '';
        this.isConfigured = false;
        this.envLoader = new EnvLoader();
        this.initPromise = this.init();
    }

    // 初期化処理
    async init() {
        try {
            // 環境変数を読み込み
            await this.envLoader.loadEnvFile();
            
            // URLを環境変数から取得
            this.webAppUrl = this.envLoader.get('GOOGLE_APPS_SCRIPT_URL');
            
            if (this.webAppUrl && this.webAppUrl !== '') {
                this.isConfigured = true;
                console.log('Google Apps Script URL が環境変数から読み込まれました:', this.webAppUrl);
            } else {
                console.warn('GOOGLE_APPS_SCRIPT_URL が .env.local で設定されていません');
                this.setFallbackUrl();
            }
        } catch (error) {
            console.error('環境変数の初期化に失敗しました:', error);
            this.setFallbackUrl();
        }
    }

    // 初期化の完了を待つ
    async waitForInit() {
        await this.initPromise;
    }

    // フォールバック用のURL設定
    setFallbackUrl() {
        // .env.localが読み込めない場合のデフォルトURL（最新のURL）
        this.webAppUrl = 'https://script.google.com/macros/s/AKfycbwY1OvwBvBdRRoBYxegOzsFN4yuWy6_JgXgHXCx5cPyWDvE7QuIY8NpNWTl4_Y4eSdL/exec';
        this.isConfigured = true;
        console.log('フォールバックURLを使用します:', this.webAppUrl);
    }

    // WebアプリURLを設定
    setWebAppUrl(url) {
        this.webAppUrl = url;
        this.isConfigured = true;
        
        // ローカルストレージに保存
        localStorage.setItem('googleSheetsWebAppUrl', url);
    }

    // 保存されたURLを読み込み
    loadWebAppUrl() {
        const savedUrl = localStorage.getItem('googleSheetsWebAppUrl');
        if (savedUrl) {
            this.webAppUrl = savedUrl;
            this.isConfigured = true;
        }
    }

    // Google Sheetsにデータを送信
    async saveInvoiceData(invoiceData) {
        // 初期化完了を待つ
        await this.waitForInit();
        
        if (!this.isConfigured) {
            throw new Error('Google Apps Script WebアプリURLが設定されていません');
        }

        console.log('=== Google Sheets 送信開始 ===');
        console.log('URL:', this.webAppUrl);

        try {
            // 送信用データの準備
            const validItems = invoiceData.items.filter(item => item.name);
            console.log('有効な商品:', validItems);

            const calculator = new InvoiceCalculator();
            const totals = calculator.calculateAll(validItems, invoiceData.taxRate);
            console.log('計算結果:', totals);

            const dataToSend = {
                companyName: invoiceData.companyName,
                contactPerson: invoiceData.contactPerson,
                invoiceDate: invoiceData.invoiceDate,
                dueDate: invoiceData.dueDate,
                invoiceNumber: invoiceData.invoiceNumber,
                items: validItems,
                notes: invoiceData.notes,
                subtotal: totals.subtotal,
                taxAmount: totals.taxAmount,
                total: totals.total,
                taxRate: invoiceData.taxRate
            };

            console.log('送信データ:', dataToSend);

            // Google Sheets APIに送信
            console.log('fetch開始...');
            
            // URLが正しく設定されているか最終チェック
            if (!this.webAppUrl || this.webAppUrl.trim() === '') {
                throw new Error('WebアプリURLが空です');
            }
            
            // まずno-corsモードで送信（Google Apps Scriptでよく使われる方法）
            const response = await fetch(this.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSend),
                mode: 'no-cors'  // CORS問題を回避
            });

            console.log('fetch完了:', response);
            console.log('response.type:', response.type);
            
            // no-corsモードでは成功時に opaque レスポンスになる
            if (response.type === 'opaque') {
                console.log('no-corsモードで送信成功（レスポンス内容は確認不可）');
                
                // 成功の可能性が高いので、スプレッドシートを確認するよう促す
                return {
                    success: true,
                    message: 'データを送信しました。Google Sheetsでデータが保存されているか確認してください。'
                };
            }
            
            // 他のケースでもエラーにしない（no-corsモードでは詳細がわからないため）
            console.log('no-corsモードで送信完了（結果不明）');
            return {
                success: true,
                message: 'データを送信しました（結果確認不可）。Google Sheetsでデータを確認してください。'
            };

        } catch (error) {
            console.error('=== Google Sheets保存エラー ===');
            console.error('エラータイプ:', error.constructor.name);
            console.error('エラーメッセージ:', error.message);
            console.error('スタックトレース:', error.stack);
            
            // 具体的なエラー内容を判定
            let errorMessage = `Google Sheetsへの保存に失敗しました: ${error.message}`;
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = 'ネットワーク接続エラー: インターネット接続またはURLを確認してください';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'CORS エラー: Google Apps Scriptの設定を確認してください';
            }
            
            throw new Error(errorMessage);
        }
    }

    // Google Sheetsからデータを取得
    async getInvoiceData() {
        if (!this.isConfigured) {
            throw new Error('Google Apps Script WebアプリURLが設定されていません');
        }

        try {
            const response = await fetch(this.webAppUrl, {
                method: 'GET',
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.message || 'データ取得に失敗しました');
            }

        } catch (error) {
            console.error('Google Sheetsデータ取得エラー:', error);
            throw new Error(`Google Sheetsからのデータ取得に失敗しました: ${error.message}`);
        }
    }

    // 設定ダイアログを表示
    showConfigDialog() {
        const modal = document.createElement('div');
        modal.className = 'google-sheets-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>Google Sheets連携設定</h3>
                    <p>Google Apps Script WebアプリのURLを入力してください：</p>
                    <input type="url" id="webAppUrlInput" value="${this.webAppUrl !== 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE' ? this.webAppUrl : ''}" placeholder="https://script.google.com/macros/s/...">
                    <div class="modal-actions">
                        <button id="cancelConfig">キャンセル</button>
                        <button id="saveConfig" class="primary-btn">保存</button>
                    </div>
                    <div class="config-help">
                        <details>
                            <summary>設定方法を見る</summary>
                            <ol>
                                <li>Google Spreadsheetを開く</li>
                                <li>「拡張機能」→「Apps Script」</li>
                                <li>提供されたコードをコピー＆ペースト</li>
                                <li>「デプロイ」→「新しいデプロイ」</li>
                                <li>WebアプリURLをコピーしてここに貼り付け</li>
                            </ol>
                        </details>
                    </div>
                </div>
            </div>
        `;

        // スタイルを追加
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
        `;

        document.body.appendChild(modal);

        // イベントリスナー
        const cancelBtn = modal.querySelector('#cancelConfig');
        const saveBtn = modal.querySelector('#saveConfig');
        const urlInput = modal.querySelector('#webAppUrlInput');

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        saveBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            if (url) {
                this.setWebAppUrl(url);
                document.body.removeChild(modal);
                this.showMessage('設定が保存されました', 'success');
            } else {
                this.showMessage('URLを入力してください', 'error');
            }
        });

        // Enterキーで保存
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            }
        });

        urlInput.focus();
    }

    // メッセージ表示
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `sheets-message sheets-message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transition: opacity 0.3s ease;
            ${type === 'success' ? 'background-color: #059669;' : ''}
            ${type === 'error' ? 'background-color: #dc2626;' : ''}
            ${type === 'info' ? 'background-color: #2563eb;' : ''}
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }
}

// グローバルに利用可能にする
window.GoogleSheetsConnector = GoogleSheetsConnector;