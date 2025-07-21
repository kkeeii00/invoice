// PDF生成を担当するモジュール

class PDFGenerator {
    constructor() {
        this.options = {
            margin: [10, 10, 10, 10],
            filename: '請求書.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                useCORS: true,
                letterRendering: true
            },
            jsPDF: { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'portrait' 
            }
        };
    }

    // PDF生成の設定を更新
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
    }

    // ファイル名を生成（請求書番号と日付を含む）
    generateFilename(invoiceNumber, invoiceDate) {
        const date = invoiceDate || new Date().toISOString().split('T')[0];
        const number = invoiceNumber || '00001';
        return `請求書_${number}_${date}.pdf`;
    }

    // PDF生成を実行
    async generatePDF(elementId, invoiceData = {}) {
        try {
            // ローディング表示
            this.showLoading();

            // プレビュー要素を取得
            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error('プレビュー要素が見つかりません');
            }

            // ファイル名を設定
            const filename = this.generateFilename(
                invoiceData.invoiceNumber,
                invoiceData.invoiceDate
            );
            
            this.options.filename = filename;

            // html2pdfを使用してPDF生成
            await html2pdf()
                .set(this.options)
                .from(element)
                .save();

            // 成功メッセージ
            this.showSuccess('PDFが正常にダウンロードされました');

        } catch (error) {
            console.error('PDF生成エラー:', error);
            this.showError('PDF生成中にエラーが発生しました');
        } finally {
            this.hideLoading();
        }
    }

    // プレビュー用PDF生成（新しいタブで開く）
    async previewPDF(elementId) {
        try {
            this.showLoading();

            const element = document.getElementById(elementId);
            if (!element) {
                throw new Error('プレビュー要素が見つかりません');
            }

            // PDFデータを取得
            const pdf = await html2pdf()
                .set({
                    ...this.options,
                    filename: undefined // ダウンロードしない
                })
                .from(element)
                .output('blob');

            // 新しいタブでプレビュー
            const url = URL.createObjectURL(pdf);
            window.open(url, '_blank');

        } catch (error) {
            console.error('PDF プレビューエラー:', error);
            this.showError('PDF プレビュー中にエラーが発生しました');
        } finally {
            this.hideLoading();
        }
    }

    // ローディング表示
    showLoading() {
        const button = document.getElementById('downloadPdf');
        if (button) {
            button.disabled = true;
            button.textContent = 'PDF生成中...';
        }
    }

    // ローディング非表示
    hideLoading() {
        const button = document.getElementById('downloadPdf');
        if (button) {
            button.disabled = false;
            button.textContent = 'PDFダウンロード';
        }
    }

    // 成功メッセージ表示
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    // エラーメッセージ表示
    showError(message) {
        this.showMessage(message, 'error');
    }

    // メッセージ表示
    showMessage(message, type = 'info') {
        // 既存のメッセージを削除
        const existingMessage = document.querySelector('.pdf-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 新しいメッセージを作成
        const messageDiv = document.createElement('div');
        messageDiv.className = `pdf-message pdf-message-${type}`;
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

        // 3秒後に自動で削除
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
window.PDFGenerator = PDFGenerator;