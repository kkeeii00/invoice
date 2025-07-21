// 環境変数読み込みモジュール

class EnvLoader {
    constructor() {
        this.envVars = {};
        this.loaded = false;
    }

    // .env.localファイルを読み込む
    async loadEnvFile() {
        try {
            const response = await fetch('.env.local');
            if (!response.ok) {
                throw new Error('.env.localファイルが見つかりません');
            }
            
            const envContent = await response.text();
            this.parseEnvContent(envContent);
            this.loaded = true;
            
            console.log('環境変数が正常に読み込まれました');
            return true;
            
        } catch (error) {
            console.warn('環境変数の読み込みに失敗しました:', error.message);
            console.warn('デフォルト値を使用します');
            return false;
        }
    }

    // env形式の文字列を解析
    parseEnvContent(content) {
        const lines = content.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            
            // コメント行や空行をスキップ
            if (line.startsWith('#') || line === '') {
                return;
            }
            
            // KEY=VALUE 形式を解析
            const equalIndex = line.indexOf('=');
            if (equalIndex !== -1) {
                const key = line.substring(0, equalIndex).trim();
                const value = line.substring(equalIndex + 1).trim();
                
                // クォートを削除（もしあれば）
                const cleanValue = value.replace(/^["']|["']$/g, '');
                
                this.envVars[key] = cleanValue;
            }
        });
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