---
title: IndexTTS2 开源语音模型部署教程
titleTemplate: Audio
description: IndexTTS2 开源语音模型部署教程.
---

# IndexTTS2 开源语音模型部署教程

一、项目背景

1. 项目起源：5 月底开源的 IndexTTS 1.5 语音模型引发网络恶搞视频热潮
2. 技术演进：当前已升级至 IndexTTS2 版本，支持更自然的语音合成

二、部署流程

1. 环境准备
   • 创建项目文件夹：D:\IndexTTS

   • 安装必备工具：
   git lfs install
   pip install -U uv

2. 代码获取
   git clone https://github.com/index-tts/index-tts.git
   cd index-tts
   git lfs pull

3. 依赖安装
   • 核心依赖安装：
   uv sync --all-extras

   • 中国大陆用户建议使用镜像：
   uv sync --all-extras --default-index "https://mirrors.aliyun.com/pypi/simple"

4. 模型下载
   • HuggingFace 下载方式：
   hf download IndexTeam/IndexTTS-2 --local-dir checkpoints

   • 模型大小约 30GB，需耐心等待

三、运行演示

1. 启动 Web 界面：
   uv run webui.py

2. 浏览器访问：http://127.0.0.1:7860

四、使用技巧

1. 语音生成优化
   • 推荐上传清晰的参考音频

   • 情感控制建议使用音频参考而非数值调节

   • 首次生成需要加载模型，后续速度会提升

2. 硬件要求
   配置项 最低要求
   显卡显存 ≥8GB
   CUDA 版本 12.8+
   系统内存 16GB+

注意事项
• 部署过程中如遇 CUDA 版本报错，可忽略 DeepSpeed 相关警告

• Windows 系统建议关闭杀毒软件避免误报

• 模型首次加载需时较长属正常现象

该教程完整呈现了从环境配置到实际使用的全流程，重点解决了 Windows 平台部署中的典型问题。通过开源工具链与详细操作指引，使普通用户也能体验前沿语音合成技术。
