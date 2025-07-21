// メインアプリケーションロジック

class InvoiceApp {
    constructor() {
        this.calculator = new InvoiceCalculator();
        this.pdfGenerator = new PDFGenerator();
        this.googleSheets = new GoogleSheetsConnector();
        this.itemCount = 1;
        this.invoiceData = {
            companyName: '',
            contactPerson: '',
            invoiceDate: '',
            dueDate: '',
            invoiceNumber: '',
            items: [],
            taxRate: 0.10,
            notes: ''
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultValues();
        this.updatePreview();
        this.googleSheets.loadWebAppUrl();
    }

    // イベントリスナーの設定
    setupEventListeners() {
        // フォーム入力のイベント
        const form = document.getElementById('invoiceForm');
        form.addEventListener('input', (e) => this.handleFormInput(e));
        form.addEventListener('change', (e) => this.handleFormChange(e));

        // 商品追加ボタン
        document.getElementById('addItem').addEventListener('click', () => this.addItem());

        // PDFダウンロードボタン
        document.getElementById('downloadPdf').addEventListener('click', () => this.downloadPDF());

        // Google Sheets保存ボタン
        document.getElementById('saveToSheets').addEventListener('click', () => this.saveToGoogleSheets());

        // リセットボタン
        document.getElementById('resetForm').addEventListener('click', () => this.resetForm());

        // 初期の商品行イベント
        this.setupItemRowEvents(0);
    }

    // デフォルト値の設定
    setDefaultValues() {
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const dueDate = nextMonth.toISOString().split('T')[0];

        document.getElementById('invoiceDate').value = today;
        document.getElementById('dueDate').value = dueDate;
        document.getElementById('invoiceNumber').value = this.generateInvoiceNumber();

        this.invoiceData.invoiceDate = today;
        this.invoiceData.dueDate = dueDate;
        this.invoiceData.invoiceNumber = document.getElementById('invoiceNumber').value;
    }

    // 請求書番号を生成
    generateInvoiceNumber() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        return `INV-${year}${month}${day}-${random}`;
    }

    // フォーム入力の処理
    handleFormInput(e) {
        const target = e.target;
        const name = target.name;
        const value = target.value;

        // 基本情報の更新
        if (name in this.invoiceData) {
            this.invoiceData[name] = value;
        }

        // 商品明細の処理
        if (target.closest('.item-row')) {
            this.handleItemInput(target);
        }

        this.updatePreview();
    }

    // フォーム変更の処理
    handleFormChange(e) {
        // 消費税率は10%固定のため、処理不要
    }

    // 商品明細入力の処理
    handleItemInput(target) {
        const itemRow = target.closest('.item-row');
        const index = parseInt(itemRow.dataset.index);
        const name = target.name;
        const value = target.value;

        // 商品データの初期化
        if (!this.invoiceData.items[index]) {
            this.invoiceData.items[index] = {
                name: '',
                unitPrice: 0,
                quantity: 1,
                total: 0
            };
        }

        // 値の更新
        if (name === 'itemName') {
            this.invoiceData.items[index].name = value;
        } else if (name === 'unitPrice') {
            this.invoiceData.items[index].unitPrice = parseFloat(value) || 0;
        } else if (name === 'quantity') {
            this.invoiceData.items[index].quantity = parseInt(value) || 1;
        }

        // 小計の計算と表示
        if (name === 'unitPrice' || name === 'quantity') {
            const total = this.calculator.calculateItemTotal(
                this.invoiceData.items[index].unitPrice,
                this.invoiceData.items[index].quantity
            );
            this.invoiceData.items[index].total = total;
            
            const totalInput = itemRow.querySelector('input[name="itemTotal"]');
            totalInput.value = this.calculator.formatCurrency(total);
        }
    }

    // 商品行の追加
    addItem() {
        const itemsList = document.getElementById('itemsList');
        const newItemRow = this.createItemRow(this.itemCount);
        itemsList.appendChild(newItemRow);
        this.setupItemRowEvents(this.itemCount);
        this.itemCount++;
    }

    // 商品行のHTML作成
    createItemRow(index) {
        const div = document.createElement('div');
        div.className = 'item-row';
        div.dataset.index = index;
        div.innerHTML = `
            <div class="item-group">
                <label>商品名 *</label>
                <input type="text" name="itemName" required>
            </div>
            <div class="item-group">
                <label>単価 *</label>
                <input type="number" name="unitPrice" min="0" step="1" required>
            </div>
            <div class="item-group">
                <label>数量 *</label>
                <input type="number" name="quantity" min="1" step="1" value="1" required>
            </div>
            <div class="item-group">
                <label>小計</label>
                <input type="text" name="itemTotal" readonly>
            </div>
            <button type="button" class="remove-item" onclick="removeItem(${index})">削除</button>
        `;
        return div;
    }

    // 商品行のイベント設定
    setupItemRowEvents(index) {
        const itemRow = document.querySelector(`[data-index="${index}"]`);
        if (itemRow) {
            const inputs = itemRow.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('input', (e) => this.handleFormInput(e));
            });
        }
    }

    // 商品行の削除
    removeItem(index) {
        const itemRow = document.querySelector(`[data-index="${index}"]`);
        if (itemRow) {
            itemRow.remove();
            // 配列からも削除
            this.invoiceData.items.splice(index, 1);
            this.updatePreview();
        }
    }

    // プレビューの更新
    updatePreview() {
        this.updateBasicInfo();
        this.updateItemsList();
        this.updateTotals();
    }

    // 基本情報の更新
    updateBasicInfo() {
        document.getElementById('previewCompanyName').textContent = this.invoiceData.companyName || '会社名';
        document.getElementById('previewContactPerson').textContent = this.invoiceData.contactPerson || '-';
        document.getElementById('previewInvoiceNumber').textContent = this.invoiceData.invoiceNumber || '-';
        document.getElementById('previewInvoiceDate').textContent = this.formatDate(this.invoiceData.invoiceDate) || '-';
        document.getElementById('previewDueDate').textContent = this.formatDate(this.invoiceData.dueDate) || '-';
        document.getElementById('previewNotes').textContent = this.invoiceData.notes || '-';
    }

    // 商品リストの更新
    updateItemsList() {
        const tbody = document.getElementById('previewItemsList');
        
        if (this.invoiceData.items.length === 0 || this.invoiceData.items.every(item => !item.name)) {
            tbody.innerHTML = '<tr><td colspan="4" class="no-items">商品が入力されていません</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        this.invoiceData.items.forEach((item, index) => {
            if (item.name) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.name}</td>
                    <td>${this.calculator.formatCurrency(item.unitPrice)}</td>
                    <td>${item.quantity}</td>
                    <td>${this.calculator.formatCurrency(item.total)}</td>
                `;
                tbody.appendChild(row);
            }
        });
    }

    // 合計の更新
    updateTotals() {
        const validItems = this.invoiceData.items.filter(item => item.name);
        const result = this.calculator.calculateAll(validItems, this.invoiceData.taxRate);

        document.getElementById('previewSubtotal').textContent = result.formattedSubtotal;
        document.getElementById('previewTaxAmount').textContent = result.formattedTaxAmount;
        document.getElementById('previewTotal').textContent = result.formattedTotal;
        document.getElementById('previewTaxRate').textContent = result.formattedTaxRate;
    }

    // 日付のフォーマット
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    // PDFダウンロード
    async downloadPDF() {
        if (!this.validateForm()) {
            alert('必須項目を入力してください');
            return;
        }

        await this.pdfGenerator.generatePDF('invoicePreview', this.invoiceData);
    }

    // フォームバリデーション
    validateForm() {
        const required = ['companyName', 'contactPerson', 'invoiceDate', 'dueDate', 'invoiceNumber'];
        
        for (const field of required) {
            if (!this.invoiceData[field]) {
                return false;
            }
        }

        // 商品が1つ以上入力されているかチェック
        const validItems = this.invoiceData.items.filter(item => item.name && item.unitPrice > 0);
        return validItems.length > 0;
    }

    // フォームリセット
    resetForm() {
        if (confirm('入力内容をリセットしますか？')) {
            document.getElementById('invoiceForm').reset();
            this.invoiceData = {
                companyName: '',
                contactPerson: '',
                invoiceDate: '',
                dueDate: '',
                invoiceNumber: '',
                items: [],
                taxRate: 0.10,
                notes: ''
            };
            this.itemCount = 1;
            
            // 商品行を初期状態に戻す
            const itemsList = document.getElementById('itemsList');
            itemsList.innerHTML = '';
            const firstRow = this.createItemRow(0);
            itemsList.appendChild(firstRow);
            this.setupItemRowEvents(0);
            
            this.setDefaultValues();
            this.updatePreview();
        }
    }

    // Google Sheetsに保存
    async saveToGoogleSheets() {
        try {
            // バリデーション
            if (!this.validateForm()) {
                alert('必須項目を入力してください');
                return;
            }

            // 設定確認
            if (!this.googleSheets.isConfigured) {
                this.googleSheets.showConfigDialog();
                return;
            }

            // ローディング表示
            const button = document.getElementById('saveToSheets');
            button.disabled = true;
            button.textContent = '保存中...';

            // データ保存
            const result = await this.googleSheets.saveInvoiceData(this.invoiceData);
            
            if (result.success) {
                this.googleSheets.showMessage(result.message, 'success');
            }

        } catch (error) {
            console.error('Google Sheets保存エラー:', error);
            
            // 設定エラーの場合は設定ダイアログを表示
            if (error.message.includes('WebアプリURL')) {
                this.googleSheets.showConfigDialog();
            } else {
                this.googleSheets.showMessage(error.message, 'error');
            }
        } finally {
            // ボタンを元に戻す
            const button = document.getElementById('saveToSheets');
            button.disabled = false;
            button.textContent = 'Google Sheetsに保存';
        }
    }
}

// 商品削除関数（グローバル）
function removeItem(index) {
    if (window.invoiceApp) {
        window.invoiceApp.removeItem(index);
    }
}

// アプリケーション開始
document.addEventListener('DOMContentLoaded', () => {
    window.invoiceApp = new InvoiceApp();
});