/**
 * UI 模块
 * 负责 Chart.js 图表初始化、UI 事件绑定和 DOM 更新
 */

class UIManager {
    constructor() {
        // DOM 元素引用
        this.elements = {};
        
        // Chart.js 图表实例
        this.lossChart = null;
        this.accuracyChart = null;
        this.predictionChart = null;
        
        // 图表数据
        this.lossData = [];
        this.accuracyData = [];
        this.valLossData = [];
        this.valAccuracyData = [];
        
        // 类别列表
        this.categories = [];
    }

    /**
     * 初始化 UI
     */
    init() {
        this.cacheElements();
        this.initCharts();
        this.bindEvents();
    }

    /**
     * 缓存 DOM 元素引用
     */
    cacheElements() {
        this.elements = {
            // 类别管理
            newCategoryInput: document.getElementById('newCategoryInput'),
            addCategoryBtn: document.getElementById('addCategoryBtn'),
            categoryList: document.getElementById('categoryList'),
            categorySelect: document.getElementById('categorySelect'),
            
            // 图片上传
            dropZone: document.getElementById('dropZone'),
            imageInput: document.getElementById('imageInput'),
            
            // 数据统计
            dataStats: document.getElementById('dataStats'),
            clearDataBtn: document.getElementById('clearDataBtn'),
            
            // 训练参数
            modelTypeRadios: document.querySelectorAll('input[name="modelType"]'),
            learningRate: document.getElementById('learningRate'),
            lrValue: document.getElementById('lrValue'),
            batchSize: document.getElementById('batchSize'),
            epochs: document.getElementById('epochs'),
            
            // 训练控制
            startTrainingBtn: document.getElementById('startTrainingBtn'),
            stopTrainingBtn: document.getElementById('stopTrainingBtn'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            currentEpoch: document.getElementById('currentEpoch'),
            totalEpochs: document.getElementById('totalEpochs'),
            currentLoss: document.getElementById('currentLoss'),
            currentAccuracy: document.getElementById('currentAccuracy'),
            
            // 图表
            lossChart: document.getElementById('lossChart'),
            accuracyChart: document.getElementById('accuracyChart'),
            
            // 预测
            predictionDropZone: document.getElementById('predictionDropZone'),
            testImageInput: document.getElementById('testImageInput'),
            predictionResult: document.getElementById('predictionResult'),
            testPreview: document.getElementById('testPreview'),
            predictionChart: document.getElementById('predictionChart')
        };
    }

    /**
     * 初始化 Chart.js 图表
     */
    initCharts() {
        // 损失曲线图表配置
        this.lossChart = new Chart(this.elements.lossChart, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '训练损失',
                        data: [],
                        borderColor: '#dc3545',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: '验证损失',
                        data: [],
                        borderColor: '#fd7e14',
                        backgroundColor: 'rgba(253, 126, 20, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '轮次'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '损失值'
                        },
                        beginAtZero: true
                    }
                }
            }
        });

        // 准确率曲线图表配置
        this.accuracyChart = new Chart(this.elements.accuracyChart, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '训练准确率',
                        data: [],
                        borderColor: '#28a745',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: '验证准确率',
                        data: [],
                        borderColor: '#20c997',
                        backgroundColor: 'rgba(32, 201, 151, 0.1)',
                        tension: 0.3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '轮次'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '准确率'
                        },
                        beginAtZero: true,
                        max: 1
                    }
                }
            }
        });

        // 预测结果条形图
        this.predictionChart = new Chart(this.elements.predictionChart, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: '预测概率',
                    data: [],
                    backgroundColor: [
                        '#4a90d9',
                        '#28a745',
                        '#ffc107',
                        '#dc3545',
                        '#6f42c1',
                        '#17a2b8',
                        '#fd7e14',
                        '#20c997',
                        '#e83e8c',
                        '#6c757d'
                    ]
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 1,
                        title: {
                            display: true,
                            text: '概率'
                        }
                    }
                }
            }
        });
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 类别管理事件
        this.elements.addCategoryBtn.addEventListener('click', () => this.handleAddCategory());
        this.elements.newCategoryInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddCategory();
            }
        });

        // 图片上传拖放事件
        this.setupDropZone(this.elements.dropZone, this.elements.imageInput, this.handleImageUpload.bind(this));
        
        // 预测图片拖放事件
        this.setupDropZone(this.elements.predictionDropZone, this.elements.testImageInput, this.handleTestImageUpload.bind(this));

        // 学习率滑动条
        this.elements.learningRate.addEventListener('input', (e) => {
            this.elements.lrValue.textContent = parseFloat(e.target.value).toFixed(4);
        });

        // 清空数据按钮
        this.elements.clearDataBtn.addEventListener('click', () => this.handleClearData());

        // 训练按钮
        this.elements.startTrainingBtn.addEventListener('click', () => this.handleStartTraining());
        this.elements.stopTrainingBtn.addEventListener('click', () => this.handleStopTraining());
    }

    /**
     * 设置拖放区域
     * @param {HTMLElement} dropZone - 拖放区域元素
     * @param {HTMLInputElement} input - 文件输入元素
     * @param {Function} handler - 文件处理函数
     */
    setupDropZone(dropZone, input, handler) {
        // 点击触发文件选择
        dropZone.addEventListener('click', () => input.click());

        // 文件选择事件
        input.addEventListener('change', (e) => handler(e.target.files));

        // 拖拽事件
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            handler(e.dataTransfer.files);
        });
    }

    /**
     * 处理添加类别
     */
    handleAddCategory() {
        const categoryName = this.elements.newCategoryInput.value.trim();
        
        if (!categoryName) {
            this.showToast('请输入类别名称', 'warning');
            return;
        }

        if (this.categories.includes(categoryName)) {
            this.showToast('该类别已存在', 'warning');
            return;
        }

        this.categories.push(categoryName);
        this.elements.newCategoryInput.value = '';
        
        this.updateCategoryList();
        this.updateCategorySelect();
        this.showToast(`类别 "${categoryName}" 已添加`, 'success');
    }

    /**
     * 处理删除类别
     * @param {string} category - 类别名称
     */
    async handleDeleteCategory(category) {
        if (!confirm(`确定要删除类别 "${category}" 及其所有图片吗？`)) {
            return;
        }

        // 从数据库删除该类别的图片
        await imageDB.deleteCategory(category);
        
        // 从类别列表中移除
        this.categories = this.categories.filter(c => c !== category);
        
        this.updateCategoryList();
        this.updateCategorySelect();
        this.updateDataStats();
        this.showToast(`类别 "${category}" 已删除`, 'success');
    }

    /**
     * 更新类别列表显示
     */
    async updateCategoryList() {
        const stats = await imageDB.getCategoryStats();
        
        if (this.categories.length === 0) {
            this.elements.categoryList.innerHTML = '<p class="empty-message">暂无类别</p>';
            return;
        }

        this.elements.categoryList.innerHTML = this.categories.map(category => `
            <div class="category-item">
                <span class="category-name">${category}</span>
                <span class="category-count">(${stats[category] || 0} 张)</span>
                <button class="delete-btn" data-category="${category}" title="删除类别">×</button>
            </div>
        `).join('');

        // 绑定删除按钮事件
        this.elements.categoryList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeleteCategory(btn.dataset.category);
            });
        });
    }

    /**
     * 更新类别下拉选择器
     */
    updateCategorySelect() {
        if (this.categories.length === 0) {
            this.elements.categorySelect.innerHTML = '<option value="">-- 请先添加类别 --</option>';
        } else {
            this.elements.categorySelect.innerHTML = 
                '<option value="">-- 请选择类别 --</option>' +
                this.categories.map(c => `<option value="${c}">${c}</option>`).join('');
        }
    }

    /**
     * 处理图片上传
     * @param {FileList} files - 文件列表
     */
    async handleImageUpload(files) {
        const category = this.elements.categorySelect.value;
        
        if (!category) {
            this.showToast('请先选择一个类别', 'warning');
            return;
        }

        if (files.length === 0) {
            return;
        }

        let count = 0;
        
        for (const file of files) {
            if (!file.type.startsWith('image/')) {
                continue;
            }

            const base64 = await this.fileToBase64(file);
            await imageDB.addImage(category, base64);
            count++;
        }

        if (count > 0) {
            this.showToast(`已上传 ${count} 张图片到 "${category}"`, 'success');
            this.updateCategoryList();
            this.updateDataStats();
        }

        // 清空文件输入
        this.elements.imageInput.value = '';
    }

    /**
     * 处理测试图片上传
     * @param {FileList} files - 文件列表
     */
    async handleTestImageUpload(files) {
        if (files.length === 0) {
            return;
        }

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            this.showToast('请上传图片文件', 'warning');
            return;
        }

        const base64 = await this.fileToBase64(file);
        
        // 显示预览图片
        this.elements.testPreview.src = base64;
        this.elements.predictionResult.style.display = 'grid';

        // 进行预测
        try {
            const results = await classifierModel.predict(base64);
            this.updatePredictionChart(results);
        } catch (error) {
            this.showToast('预测失败：' + error.message, 'error');
        }

        // 清空文件输入
        this.elements.testImageInput.value = '';
    }

    /**
     * 将文件转换为 Base64
     * @param {File} file - 文件对象
     * @returns {Promise<string>}
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * 更新数据统计显示
     */
    async updateDataStats() {
        const stats = await imageDB.getCategoryStats();
        const categories = Object.keys(stats);
        
        if (categories.length === 0) {
            this.elements.dataStats.innerHTML = '<p class="empty-message">暂无数据</p>';
            return;
        }

        let totalImages = 0;
        const statsHtml = categories.map(category => {
            totalImages += stats[category];
            return `
                <div class="stat-item">
                    <div class="stat-label">${category}</div>
                    <div class="stat-value">${stats[category]}</div>
                </div>
            `;
        }).join('');

        this.elements.dataStats.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">总计</div>
                <div class="stat-value">${totalImages}</div>
            </div>
            ${statsHtml}
        `;
    }

    /**
     * 处理清空数据
     */
    async handleClearData() {
        if (!confirm('确定要清空所有数据吗？此操作不可撤销。')) {
            return;
        }

        await imageDB.clearAll();
        this.categories = [];
        this.updateCategoryList();
        this.updateCategorySelect();
        this.updateDataStats();
        this.showToast('所有数据已清空', 'success');
    }

    /**
     * 处理开始训练
     */
    async handleStartTraining() {
        // 获取训练数据
        const trainingData = await imageDB.getTrainingData();
        
        if (trainingData.images.length === 0) {
            this.showToast('请先上传训练数据', 'warning');
            return;
        }

        if (trainingData.categories.length < 2) {
            this.showToast('至少需要 2 个类别才能训练', 'warning');
            return;
        }

        // 获取训练参数
        const config = {
            modelType: document.querySelector('input[name="modelType"]:checked').value,
            learningRate: parseFloat(this.elements.learningRate.value),
            batchSize: parseInt(this.elements.batchSize.value),
            epochs: parseInt(this.elements.epochs.value)
        };

        // 更新 UI
        this.elements.startTrainingBtn.disabled = true;
        this.elements.stopTrainingBtn.disabled = false;
        this.elements.totalEpochs.textContent = config.epochs;
        this.elements.progressText.textContent = '正在加载模型...';
        
        // 重置图表数据
        this.resetCharts();

        // 设置训练回调
        classifierModel.onEpochEnd = (epoch, logs) => {
            this.updateTrainingProgress(epoch + 1, config.epochs, logs);
        };

        classifierModel.onTrainingEnd = (success, errorMessage) => {
            this.onTrainingComplete(success, errorMessage);
        };

        // 开始训练
        try {
            await classifierModel.train(trainingData, config);
        } catch (error) {
            this.showToast('训练失败：' + error.message, 'error');
            this.onTrainingComplete(false, error.message);
        }
    }

    /**
     * 处理停止训练
     */
    handleStopTraining() {
        classifierModel.stopTraining();
        this.elements.stopTrainingBtn.disabled = true;
        this.elements.progressText.textContent = '正在停止...';
    }

    /**
     * 更新训练进度
     * @param {number} epoch - 当前轮次
     * @param {number} totalEpochs - 总轮次
     * @param {Object} logs - 训练日志
     */
    updateTrainingProgress(epoch, totalEpochs, logs) {
        const progress = (epoch / totalEpochs) * 100;
        
        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.progressText.textContent = `${progress.toFixed(1)}%`;
        this.elements.currentEpoch.textContent = epoch;
        this.elements.currentLoss.textContent = logs.loss.toFixed(4);
        this.elements.currentAccuracy.textContent = (logs.acc * 100).toFixed(2) + '%';

        // 更新图表
        this.lossData.push(logs.loss);
        this.accuracyData.push(logs.acc);
        
        if (logs.val_loss !== undefined) {
            this.valLossData.push(logs.val_loss);
            this.valAccuracyData.push(logs.val_acc);
        }

        this.updateCharts(epoch);
    }

    /**
     * 更新训练曲线图表
     * @param {number} epoch - 当前轮次
     */
    updateCharts(epoch) {
        // 更新标签
        this.lossChart.data.labels.push(epoch);
        this.accuracyChart.data.labels.push(epoch);

        // 更新损失数据
        this.lossChart.data.datasets[0].data = this.lossData;
        this.lossChart.data.datasets[1].data = this.valLossData;
        
        // 更新准确率数据
        this.accuracyChart.data.datasets[0].data = this.accuracyData;
        this.accuracyChart.data.datasets[1].data = this.valAccuracyData;

        // 刷新图表
        this.lossChart.update('none');
        this.accuracyChart.update('none');
    }

    /**
     * 重置图表数据
     */
    resetCharts() {
        this.lossData = [];
        this.accuracyData = [];
        this.valLossData = [];
        this.valAccuracyData = [];

        this.lossChart.data.labels = [];
        this.lossChart.data.datasets[0].data = [];
        this.lossChart.data.datasets[1].data = [];
        
        this.accuracyChart.data.labels = [];
        this.accuracyChart.data.datasets[0].data = [];
        this.accuracyChart.data.datasets[1].data = [];

        this.lossChart.update();
        this.accuracyChart.update();
    }

    /**
     * 训练完成回调
     * @param {boolean} success - 是否成功
     * @param {string} errorMessage - 错误信息
     */
    onTrainingComplete(success, errorMessage) {
        this.elements.startTrainingBtn.disabled = false;
        this.elements.stopTrainingBtn.disabled = true;

        if (success) {
            this.elements.progressText.textContent = '训练完成';
            this.showToast('模型训练完成！', 'success');
        } else {
            this.elements.progressText.textContent = '训练已停止';
            if (errorMessage) {
                this.showToast('训练失败：' + errorMessage, 'error');
            }
        }
    }

    /**
     * 更新预测结果图表
     * @param {Array} results - 预测结果
     */
    updatePredictionChart(results) {
        this.predictionChart.data.labels = results.map(r => r.category);
        this.predictionChart.data.datasets[0].data = results.map(r => r.probability);
        this.predictionChart.update();
    }

    /**
     * 显示提示消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('success', 'error', 'warning')
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// 创建全局 UI 管理器实例
const uiManager = new UIManager();
