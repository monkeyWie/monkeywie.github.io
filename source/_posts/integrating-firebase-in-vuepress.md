---
title: 在vuepress整合firebase analytics
date: 2023-06-30 20:24:27
categories: 前端
tags:
  - js
  - vuepress
  - firebase
---

## 前言

最近想给`gopeed`的文档网站添加一个统计用户的访问量的功能，所以就想到了 firebase 的 analytics，但是在 vuepress 中整合 firebase 的 analytics 并不是很简单，所以就有了这篇文章。

<!--more-->

## 问题和解决

firebase 官方给出的文档是通过`esm`模块化的方式进行引入，但是 vuepress 是不支持引入`esm`文件并打包的的，所以需要通过`script`标签的方式引入，然而官方给的 js 文件也是`esm`的，官方代码示例如下：

```html
<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-analytics.js";

  const firebaseConfig = {
    // ...
  };

  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
```

这里可以通过 vuepress 中 head 的配置来引入，例如：

```js
module.exports = {
  head: [
    [
      "script",
      {
        type: "module",
      },
      `
  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-analytics.js";

  const firebaseConfig = {
    // ...
  };

  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
      `,
    ],
  ],
};
```

但是我觉得这种 cdn 方式引入对国内用户不太友好，gstatic 在国内的访问速度很慢，所以我选择了把两个 js 文件下载到本地，然后通过`script`标签引入，这样就不会有 cdn 的问题了，于是改造后的代码如下：

```js
module.exports = {
  head: [
    [
      "script",
      {
        type: "module",
      },
      `
  import { initializeApp } from "/js/firebase-app.js";
  import { getAnalytics } from "/js/firebase-analytics.js";

  const firebaseConfig = {
    // ...
  };

  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
      `,
    ],
  ],
};
```

然而这样 js 是加载到了，但是执行的时候会报错：

```
component analytics has not been registered yet
```

google 了一番也没找到什么有用的信息，最后在看`firebase-analytics.js`代码的时候发现了代码里有这么一段：

```js
import {
  registerVersion as e,
  _registerComponent as t,
  _getProvider as n,
  getApp as a,
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
```

我猜可能就是因为这里引入的路径不是本地路径导致的，于是把这段 js 改成了：

```js
import {
  registerVersion as e,
  _registerComponent as t,
  _getProvider as n,
  getApp as a,
} from "/js/firebase-app.js";
```

然后就可以正常使用了。

## 后记

不得不说 firebase 的 sdk 还是挺激进的，直接用上了 esm，根本不考虑老旧浏览器的兼容性，好歹给个 UMD 版本吧，这样就不用我自己改代码了。
