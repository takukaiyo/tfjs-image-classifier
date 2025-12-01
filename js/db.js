/**
 * IndexedDB 数据库管理模块
 * 用于本地存储训练数据（图片和标签）
 */

class ImageDB {
    constructor() {
        this.dbName = 'ImageClassifierDB';
        this.dbVersion = 1;
        this.storeName = 'images';
        this.db = null;
    }

    /**
     * 初始化数据库
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('无法打开数据库'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 创建图片存储对象
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    // 创建索引以便按类别查询
                    store.createIndex('category', 'category', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * 添加图片到数据库
     * @param {string} category - 类别名称
     * @param {string} imageData - Base64 编码的图片数据
     * @returns {Promise<number>} - 返回新记录的 ID
     */
    async addImage(category, imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            const record = {
                category: category,
                imageData: imageData,
                timestamp: Date.now()
            };

            const request = store.add(record);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('添加图片失败'));
            };
        });
    }

    /**
     * 批量添加图片
     * @param {string} category - 类别名称
     * @param {string[]} imagesData - Base64 编码的图片数据数组
     * @returns {Promise<number[]>} - 返回新记录的 ID 数组
     */
    async addImages(category, imagesData) {
        const ids = [];
        for (const imageData of imagesData) {
            const id = await this.addImage(category, imageData);
            ids.push(id);
        }
        return ids;
    }

    /**
     * 获取指定类别的所有图片
     * @param {string} category - 类别名称
     * @returns {Promise<Array>}
     */
    async getImagesByCategory(category) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('category');
            const request = index.getAll(category);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('获取图片失败'));
            };
        });
    }

    /**
     * 获取所有图片
     * @returns {Promise<Array>}
     */
    async getAllImages() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(new Error('获取所有图片失败'));
            };
        });
    }

    /**
     * 获取所有类别及其图片数量
     * @returns {Promise<Object>}
     */
    async getCategoryStats() {
        const images = await this.getAllImages();
        const stats = {};
        
        for (const image of images) {
            if (!stats[image.category]) {
                stats[image.category] = 0;
            }
            stats[image.category]++;
        }
        
        return stats;
    }

    /**
     * 获取所有唯一的类别名称
     * @returns {Promise<string[]>}
     */
    async getCategories() {
        const stats = await this.getCategoryStats();
        return Object.keys(stats);
    }

    /**
     * 删除指定 ID 的图片
     * @param {number} id - 图片 ID
     * @returns {Promise<void>}
     */
    async deleteImage(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error('删除图片失败'));
            };
        });
    }

    /**
     * 删除指定类别的所有图片
     * @param {string} category - 类别名称
     * @returns {Promise<void>}
     */
    async deleteCategory(category) {
        const images = await this.getImagesByCategory(category);
        for (const image of images) {
            await this.deleteImage(image.id);
        }
    }

    /**
     * 清空所有数据
     * @returns {Promise<void>}
     */
    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(new Error('清空数据失败'));
            };
        });
    }

    /**
     * 获取训练数据（格式化为模型训练所需格式）
     * @returns {Promise<{images: Array, labels: Array, categories: string[]}>}
     */
    async getTrainingData() {
        const allImages = await this.getAllImages();
        const categories = [...new Set(allImages.map(img => img.category))].sort();
        
        const images = [];
        const labels = [];
        
        for (const image of allImages) {
            images.push(image.imageData);
            labels.push(categories.indexOf(image.category));
        }
        
        return { images, labels, categories };
    }
}

// 创建全局实例
const imageDB = new ImageDB();
