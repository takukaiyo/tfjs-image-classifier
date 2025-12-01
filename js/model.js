/**
 * TensorFlow.js 模型模块
 * 包含 CNN 和 MobileNet 迁移学习模型的构建、训练和预测
 */

class ImageClassifierModel {
    constructor() {
        this.model = null;
        this.mobilenetBase = null;
        this.isTraining = false;
        this.categories = [];
        this.imageSize = 128; // CNN 使用的图片尺寸
        this.mobilenetSize = 224; // MobileNet 使用的图片尺寸
        this.currentModelType = 'cnn';
        
        // 训练回调
        this.onEpochEnd = null;
        this.onBatchEnd = null;
        this.onTrainingEnd = null;
    }

    /**
     * 构建简单 CNN 模型
     * @param {number} numClasses - 类别数量
     * @returns {tf.LayersModel}
     */
    buildCNNModel(numClasses) {
        const model = tf.sequential();

        // 第一个卷积层
        model.add(tf.layers.conv2d({
            inputShape: [this.imageSize, this.imageSize, 3],
            filters: 32,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
        model.add(tf.layers.batchNormalization());

        // 第二个卷积层
        model.add(tf.layers.conv2d({
            filters: 64,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
        model.add(tf.layers.batchNormalization());

        // 第三个卷积层
        model.add(tf.layers.conv2d({
            filters: 128,
            kernelSize: 3,
            activation: 'relu',
            padding: 'same'
        }));
        model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
        model.add(tf.layers.batchNormalization());

        // 展平层
        model.add(tf.layers.flatten());
        model.add(tf.layers.dropout({ rate: 0.5 }));

        // 全连接层
        model.add(tf.layers.dense({
            units: 256,
            activation: 'relu'
        }));
        model.add(tf.layers.dropout({ rate: 0.3 }));

        // 输出层
        model.add(tf.layers.dense({
            units: numClasses,
            activation: 'softmax'
        }));

        return model;
    }

    /**
     * 加载 MobileNet 基础模型
     * @returns {Promise<tf.LayersModel>}
     */
    async loadMobileNetBase() {
        if (this.mobilenetBase) {
            return this.mobilenetBase;
        }

        // 加载 MobileNet V2 模型
        const mobilenet = await tf.loadLayersModel(
            'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json'
        );

        // 获取中间层作为特征提取器
        const layer = mobilenet.getLayer('conv_pw_13_relu');
        this.mobilenetBase = tf.model({
            inputs: mobilenet.inputs,
            outputs: layer.output
        });

        // 冻结基础模型的权重
        this.mobilenetBase.trainable = false;

        return this.mobilenetBase;
    }

    /**
     * 构建 MobileNet 迁移学习模型
     * 使用函数式 API 创建一个完整的模型，将冻结的 MobileNet 基础模型
     * 与可训练的分类头连接在一起
     * @param {number} numClasses - 类别数量
     * @returns {Promise<tf.LayersModel>}
     */
    async buildMobileNetModel(numClasses) {
        await this.loadMobileNetBase();

        // 使用函数式 API 创建完整模型
        // 输入层：接收原始图片 (224, 224, 3)
        const input = tf.input({ shape: [this.mobilenetSize, this.mobilenetSize, 3] });

        // 通过冻结的 MobileNet 基础模型提取特征
        const baseOutput = this.mobilenetBase.apply(input);

        // 构建分类头
        let x = tf.layers.globalAveragePooling2d().apply(baseOutput);

        x = tf.layers.dense({
            units: 128,
            activation: 'relu'
        }).apply(x);

        x = tf.layers.dropout({ rate: 0.5 }).apply(x);

        const output = tf.layers.dense({
            units: numClasses,
            activation: 'softmax'
        }).apply(x);

        // 创建完整模型
        const model = tf.model({ inputs: input, outputs: output });

        return model;
    }

    /**
     * 初始化模型
     * @param {string} modelType - 模型类型 ('cnn' 或 'mobilenet')
     * @param {number} numClasses - 类别数量
     * @param {number} learningRate - 学习率
     */
    async initModel(modelType, numClasses, learningRate) {
        this.currentModelType = modelType;

        if (modelType === 'mobilenet') {
            this.model = await this.buildMobileNetModel(numClasses);
        } else {
            this.model = this.buildCNNModel(numClasses);
        }

        // 编译模型
        this.model.compile({
            optimizer: tf.train.adam(learningRate),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        console.log('模型初始化完成：', modelType);
        this.model.summary();
    }

    /**
     * 将 Base64 图片转换为张量
     * @param {string} base64Image - Base64 编码的图片
     * @param {number} targetSize - 目标尺寸
     * @returns {Promise<tf.Tensor3D>}
     */
    async imageToTensor(base64Image, targetSize) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    const tensor = tf.tidy(() => {
                        // 将图片转换为张量
                        let imgTensor = tf.browser.fromPixels(img);
                        
                        // 调整大小
                        imgTensor = tf.image.resizeBilinear(imgTensor, [targetSize, targetSize]);
                        
                        // 归一化到 [0, 1]
                        imgTensor = imgTensor.div(255.0);
                        
                        return imgTensor;
                    });
                    resolve(tensor);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => {
                reject(new Error('图片加载失败'));
            };
            
            img.src = base64Image;
        });
    }

    /**
     * 准备训练数据
     * @param {string[]} images - Base64 图片数组
     * @param {number[]} labels - 标签数组
     * @param {number} numClasses - 类别数量
     * @returns {Promise<{xs: tf.Tensor, ys: tf.Tensor}>}
     */
    async prepareData(images, labels, numClasses) {
        const targetSize = this.currentModelType === 'mobilenet' 
            ? this.mobilenetSize 
            : this.imageSize;

        // 转换所有图片为张量
        const tensors = [];
        for (const imageData of images) {
            const tensor = await this.imageToTensor(imageData, targetSize);
            tensors.push(tensor);
        }

        // 堆叠为批次张量
        const xs = tf.stack(tensors);

        // 清理单个张量
        tensors.forEach(t => t.dispose());

        // 创建 one-hot 编码的标签
        const ys = tf.oneHot(labels, numClasses);

        return { xs, ys };
    }

    /**
     * 训练模型
     * @param {Object} trainingData - 训练数据
     * @param {Object} config - 训练配置
     */
    async train(trainingData, config) {
        const { images, labels, categories } = trainingData;
        const { epochs, batchSize, learningRate, modelType } = config;

        this.categories = categories;
        this.isTraining = true;

        // 初始化模型
        await this.initModel(modelType, categories.length, learningRate);

        // 准备数据
        console.log('准备训练数据...');
        const { xs, ys } = await this.prepareData(images, labels, categories.length);

        console.log('开始训练...');
        console.log('数据形状:', xs.shape, ys.shape);

        try {
            // 训练模型
            await this.model.fit(xs, ys, {
                epochs: epochs,
                batchSize: batchSize,
                shuffle: true,
                validationSplit: 0.2,
                callbacks: {
                    onEpochBegin: async () => {
                        // 在每个 epoch 开始时检查是否应该停止
                        if (!this.isTraining) {
                            this.model.stopTraining = true;
                        }
                    },
                    onEpochEnd: async (epoch, logs) => {
                        if (!this.isTraining) {
                            this.model.stopTraining = true;
                            return;
                        }
                        
                        if (this.onEpochEnd) {
                            this.onEpochEnd(epoch, logs);
                        }
                    },
                    onBatchEnd: async (batch, logs) => {
                        // 在每个批次结束时检查是否应该停止
                        if (!this.isTraining) {
                            this.model.stopTraining = true;
                            return;
                        }
                        
                        if (this.onBatchEnd) {
                            this.onBatchEnd(batch, logs);
                        }
                    }
                }
            });

            console.log('训练完成');
            
            if (this.onTrainingEnd) {
                this.onTrainingEnd(true);
            }
        } catch (error) {
            console.error('训练错误:', error);
            if (this.onTrainingEnd) {
                this.onTrainingEnd(false, error.message);
            }
        } finally {
            // 清理数据
            xs.dispose();
            ys.dispose();
            this.isTraining = false;
        }
    }

    /**
     * 停止训练
     */
    stopTraining() {
        this.isTraining = false;
        if (this.model) {
            this.model.stopTraining = true;
        }
    }

    /**
     * 预测图片类别
     * @param {string} base64Image - Base64 编码的图片
     * @returns {Promise<Array<{category: string, probability: number}>>}
     */
    async predict(base64Image) {
        if (!this.model) {
            throw new Error('模型尚未训练');
        }

        const targetSize = this.currentModelType === 'mobilenet' 
            ? this.mobilenetSize 
            : this.imageSize;

        // 转换图片为张量
        const tensor = await this.imageToTensor(base64Image, targetSize);
        
        // 添加批次维度
        const batch = tensor.expandDims(0);
        tensor.dispose();

        // 进行预测
        const predictions = this.model.predict(batch);
        const probabilities = await predictions.data();

        // 清理
        batch.dispose();
        predictions.dispose();

        // 格式化结果
        const results = this.categories.map((category, index) => ({
            category: category,
            probability: probabilities[index]
        }));

        // 按概率降序排序
        results.sort((a, b) => b.probability - a.probability);

        return results;
    }

    /**
     * 获取模型信息
     * @returns {Object}
     */
    getModelInfo() {
        if (!this.model) {
            return null;
        }

        return {
            type: this.currentModelType,
            categories: this.categories,
            inputShape: this.currentModelType === 'mobilenet' 
                ? [this.mobilenetSize, this.mobilenetSize, 3]
                : [this.imageSize, this.imageSize, 3]
        };
    }

    /**
     * 释放模型资源
     */
    dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
    }
}

// 创建全局实例
const classifierModel = new ImageClassifierModel();
