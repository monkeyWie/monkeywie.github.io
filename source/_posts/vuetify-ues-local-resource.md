---
title: vuetify使用本地图标和字体文件
date: 2022-02-22 14:11:53
categories: 前端
tags:
  - js
  - vue
---

为了开发公司的一些效率工具 UI，我选择了 Vuetify，它是一个基于 Vue 的 UI 框架，它提供了一个简单的组件库，可以让我们快速开发出一些简单并且好看的 material design 的 UI。

但是通过官方脚手架生成的项目，默认是通过引入外网 cdn 的方式导入图标以及字体文件，然而国内的网络访问这些资源比较慢，所以就想把这些资源放到本地，提高访问速度。

<!--more-->

## 安装步骤

首先修改项目根目录下的 `public/index.html`文件，删除如下代码：

```
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900"/>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css">
```

然后安装 npm 包

```
npm install typeface-roboto -D
npm install @mdi/font -D
```

再通过修改`main.js`进行引用

```js
import "typeface-roboto/index.css";
import "@mdi/font/css/materialdesignicons.css";
import Vue from "vue";
```

然后`npm run serve`一下就可以看到，所有的资源都是通过本地服务来访问了。
