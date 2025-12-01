/**
 * 应用主入口
 * 协调各模块的初始化和交互
 */

class App {
    constructor() {
        this.isInitialized = false;
    }

    /**
     * 检查必需的库是否已加载
     */
    checkDependencies() {
        const missing = [];
        
        if (typeof tf === 'undefined') {
            missing.push('TensorFlow.js');
        }
        
        if (typeof Chart === 'undefined') {
            missing.push('Chart.js');
        }
        
        return missing;
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('正在初始化图像分类器应用...');

            // 检查依赖库
            const missingLibs = this.checkDependencies();
            if (missingLibs.length > 0) {
                throw new Error('以下必需库未能加载：' + missingLibs.join('、') + 
                    '。请检查网络连接或刷新页面重试。');
            }

            // 显示加载状态
            this.showLoadingState();

            // 初始化 IndexedDB
            console.log('初始化数据库...');
            await imageDB.init();

            // 初始化 UI
            console.log('初始化用户界面...');
            uiManager.init();

            // 加载已存储的类别
            await this.loadStoredCategories();

            // 更新数据统计
            await uiManager.updateDataStats();

            // 隐藏加载状态
            this.hideLoadingState();

            this.isInitialized = true;
            console.log('应用初始化完成！');

        } catch (error) {
            console.error('应用初始化失败：', error);
            this.showError('应用初始化失败：' + error.message);
        }
    }

    /**
     * 加载已存储的类别
     */
    async loadStoredCategories() {
        const categories = await imageDB.getCategories();
        uiManager.categories = categories;
        uiManager.updateCategoryList();
        uiManager.updateCategorySelect();
    }

    /**
     * 显示加载状态
     */
    showLoadingState() {
        // 可以在这里添加加载遮罩层
        document.body.style.opacity = '0.8';
    }

    /**
     * 隐藏加载状态
     */
    hideLoadingState() {
        document.body.style.opacity = '1';
    }

    /**
     * 显示错误信息
     * @param {string} message - 错误信息
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 20px 40px;
            border-radius: 8px;
            font-size: 16px;
            z-index: 10000;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
    }
}

// 创建应用实例并初始化
const app = new App();

// DOM 加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
