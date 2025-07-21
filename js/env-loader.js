// 環境変数読み込みモジュール

class EnvLoader {
    constructor() {
        this.envVars = {};
        this.loaded = false;
    }

    // Vercel環境変数を読み込む
    async loadEnvFile() {
        try {
            // Vercelビルド時に埋め込まれた環境変数を使用
            this.envVars = {
                OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
                OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                // 必要に応じて他の環境変数を追加
            };
            this.loaded = true;
            
            console.log('環境変数が正常に読み込まれました');
            return true;
            
        } catch (error) {
            console.warn('環境変数の読み込みに失敗しました:', error.message);
            console.warn('デフォルト値を使用します');
            return false;
        }
    }


    // 環境変数を取得
    get(key, defaultValue = '') {
        return this.envVars[key] || defaultValue;
    }

    // すべての環境変数を取得
    getAll() {
        return { ...this.envVars };
    }

    // 読み込み状態を確認
    isLoaded() {
        return this.loaded;
    }

    // デバッグ用：環境変数を表示
    debug() {
        console.log('読み込まれた環境変数:', this.envVars);
    }
}

// グローバルに利用可能にする
window.EnvLoader = EnvLoader;