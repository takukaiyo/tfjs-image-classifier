# 图像分类器 - TensorFlow.js

基于 TensorFlow.js 的纯前端图像分类网页应用，所有操作在浏览器中完成，无需后端服务器。

## 功能特点

- 🖼️ **数据管理**：支持拖拽/点击上传图片，动态类别管理
- ⚙️ **训练配置**：学习率、批次大小、训练轮次可调节
- 🤖 **模型选择**：简单 CNN 或 MobileNet 迁移学习
- 📊 **实时可视化**：训练过程中的 Loss 和 Accuracy 曲线
- 🔮 **模型推理**：上传测试图片即时预测

## 技术栈

- HTML5 / CSS3 (响应式设计)
- TensorFlow.js (通过 CDN 引入)
- Chart.js (用于绘制训练曲线)
- IndexedDB (本地存储训练数据)

## 文件结构

```
├── index.html          # 主页面结构
├── css/
│   └── style.css       # 样式文件（响应式布局）
├── js/
│   ├── db.js           # IndexedDB 管理逻辑
│   ├── model.js        # TensorFlow.js 模型构建、训练、预测
│   ├── ui.js           # Chart.js 图表初始化、UI 事件绑定
│   └── app.js          # 主入口，协调各模块
└── README.md
```

## 使用方法

1. 直接用浏览器打开 `index.html` 文件，或部署到任意静态网站服务器
2. 添加类别（至少 2 个）
3. 为每个类别上传训练图片
4. 配置训练参数
5. 点击"开始训练"
6. 训练完成后，上传测试图片进行预测

## 截图

![应用界面](https://github.com/user-attachments/assets/62f873c3-511d-4029-86af-921b5cc40f51)

## 注意事项

- 请使用现代浏览器（Chrome、Firefox、Edge 等）
- 首次加载 MobileNet 模型需要下载约 4MB 数据
- 训练数据存储在浏览器的 IndexedDB 中，清除浏览器数据会丢失

## 许可证

MIT License