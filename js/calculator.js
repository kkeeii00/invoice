// 計算処理を担当するモジュール

class InvoiceCalculator {
    constructor() {
        this.subtotal = 0;
        this.taxAmount = 0;
        this.total = 0;
        this.taxRate = 0.10;
    }

    // 商品明細の小計を計算
    calculateItemTotal(unitPrice, quantity) {
        const price = parseFloat(unitPrice) || 0;
        const qty = parseInt(quantity) || 0;
        return price * qty;
    }

    // 全体の小計を計算
    calculateSubtotal(items) {
        this.subtotal = items.reduce((sum, item) => {
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const quantity = parseInt(item.quantity) || 0;
            return sum + (unitPrice * quantity);
        }, 0);
        return this.subtotal;
    }

    // 消費税額を計算
    calculateTaxAmount(subtotal, taxRate) {
        this.taxRate = parseFloat(taxRate) || 0;
        this.taxAmount = Math.floor(subtotal * this.taxRate);
        return this.taxAmount;
    }

    // 合計金額を計算
    calculateTotal(subtotal, taxAmount) {
        this.total = subtotal + taxAmount;
        return this.total;
    }

    // 金額をフォーマット（カンマ区切り）
    formatCurrency(amount) {
        return `¥${amount.toLocaleString('ja-JP')}`;
    }

    // 税率をパーセンテージ表示
    formatTaxRate(rate) {
        return `${Math.round(rate * 100)}`;
    }

    // 全計算を実行
    calculateAll(items, taxRate) {
        const subtotal = this.calculateSubtotal(items);
        const taxAmount = this.calculateTaxAmount(subtotal, taxRate);
        const total = this.calculateTotal(subtotal, taxAmount);

        return {
            subtotal,
            taxAmount,
            total,
            formattedSubtotal: this.formatCurrency(subtotal),
            formattedTaxAmount: this.formatCurrency(taxAmount),
            formattedTotal: this.formatCurrency(total),
            formattedTaxRate: this.formatTaxRate(taxRate)
        };
    }
}

// グローバルに利用可能にする
window.InvoiceCalculator = InvoiceCalculator;