---
title: 准备搞波大的！Gopeed 即将迎来重大升级
published: 2026-04-04 11:20:32
categories: 独立开发
tags:
  - gopeed
---

这段时间 Gopeed 没怎么更新，但其实我一直在憋一个大的: 增强扩展系统。

目前的扩展系统确实能让 Gopeed 能覆盖很多普通下载器做不到的下载场景，最早的设计其实很简单，就是让扩展负责把资源解析出一个标准的 `HTTP` 下载链接，然后交给 Gopeed 去下，但用到现在，暴露出来的问题也越来越多了。

## 目前暴露出来的问题

最明显的问题有四个:

1. **扩展只支持下载标准的链接**: 很多时候我们真正想下载的并不是一个链接，而是字幕、弹幕、网页文本，甚至是多个接口响应拼出来的一份结果，比如想把`YouTube` 视频的字幕文件下载，这件事现在是完全做不了的。
2. **反爬限制越来越多**: 现在很多站点不是逆向个接口就能搞定了，必须拿到页面执行后的状态、Token，甚至用浏览器去模拟用户交互，才能把资源真正解析出来。
3. **纯 JavaScript 有能力上限**: 在一些复杂解析、解密或者性能敏感的场景里，单靠 `JavaScript` 很快就会碰到瓶颈。
4. **媒体下载缺少闭环**: 很多视频站点给到的是音视频分离流，下载完还得用户自己用 `ffmpeg` 合并，体验始终不完整。

最典型的例子就是 `YouTube`，目前它已经全量切到 `SABR` 协议了，这是一种`Google`私有的一种流媒体协议，现有的 `YouTube 扩展` 针对这种情况完全束手无策。

再比如 GitHub 上这个 [docker 镜像下载 issue](https://github.com/GopeedLab/gopeed/issues/1298)，放在目前扩展引擎里也根本实现不了。

所以这次我要大刀阔斧，直接解决上面这些问题，把 Gopeed 的扩展系统做成一个超级牛逼的扩展引擎。

## 对应的解决方案

### 1. 新增 `gblob` 协议

先说最底层这个问题，Gopeed目前只支持下载`HTTP`、`BT`、`ED2K`这些标准的URL资源，但很多资源压根就不是抓到一个URL就能搞定的，所以我参考了浏览器里的 `blob:` 协议，单独设计了一套 `gblob` 协议，专门拿来承载这类非 URL 资源。

如果你熟悉前端，对下面这个写法应该不陌生:

```js
const url = URL.createObjectURL(new Blob(['hello world'], { type: 'text/plain' }))
```

它返回的是一个`blob`链接，但背后对应的不是某个网络地址，而是内存里的一段数据。浏览器下载这个东西的时候，处理的是数据本身，不会再额外发请求。

Gopeed 里的 `gblob` 基本就是照着这个思路来的，API 也尽量和 `Web API` 保持一致，只不过我顺手补了一些下载场景更需要的能力。

目前支持三种模式。

#### 普通二进制数据

```js
const url = URL.createObjectURL(new Blob(['hello world'], { type: 'text/plain' }))
```

这个和浏览器里的用法完全一样，适合字幕、弹幕、网页文本这类资源。

#### 流式数据

```js
const resp = await fetch('https://example.com/video')
const url = URL.createObjectURL(resp.body)
```

这是我加的第一个增强。除了普通文本和二进制数据，`gblob` 还可以接收一个 `ReadableStream`参数。这样一来，一些需要边读边处理的场景就能接住了，比如解密流，或者边拉边拼的数据流。

#### 断点续传支持

```js
const url = URL.createObjectURL(async (offset) => {
  const headers = { Range: `bytes=${offset}-` }
  const resp = await fetch('https://example.com/video', { headers })
  return resp.body
})
```

这部分是第二个增强。`gblob` 也支持直接传一个函数进来，函数接收当前下载偏移量 `offset`，再返回对应的 `ReadableStream`。这样 Gopeed 在续传时就能重新调这个函数，把断点续传一起接上。

说白了，有了`gblob`协议的加持，以后基本上能胜任任何下载场景了。

### 2. 新增 `webview` 核心组件

第二个大坑是浏览器环境。

像 `YouTube` 这种站点，现在很多关键参数必须得靠真实页面跑出来，比如 `PO Token`。这种场景下，光靠逆接口已经不够了，扩展得能调用浏览器环境。

为了尽量让用户无感知，我没选基于 Chrome 那套 `CDP` 的方案，因为那样通常得要求用户自己装 `Chrome`。我更想要的是开箱即用，所以桌面端直接走系统自带的 `WebView`: `Windows` 上是 `WebView2`，`macOS` 上是 `WKWebView`，`Linux` 上是 `WebKitGTK`，当然我是直接用的一个成熟的库 [webview_go](https://github.com/webview/webview_go)，它底层已经帮我把三大平台的 `WebView` 包装好了。

不过在实现的过程中发现的 `webview_go` 还不够满足我的需求，像 `headless`、自定义 `user-agent`、`Cookie 管理`这些能力都没有，所以我直接 fork 了一份自己改。

桌面端搞定之后，移动端又是另一个坑。用 `Go` 是调用不了移动端的系统 `WebView` ，所以我又补了一层 `RPC` 协议，让 Gopeed 能和flutter `WebView` 组件通信，这样只要移动端把这套 `RPC` 实现出来，扩展侧的调用方式就能和桌面端保持一致。

调用方式大概是这样:

```js
const page = await gopeed.runtime.webview.open({
  headless: true,
  title: 'Gopeed WebView',
  width: 960,
  height: 720,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
})

try {
  await page.navigate('https://example.com', {
    timeoutMs: 15000,
  })

  const result = await page.execute(() => ({
    title: document.title || '',
    url: String(location.href || ''),
    userAgent: navigator.userAgent,
    readyState: document.readyState,
  }))

  gopeed.logger.info('WebView Result:', JSON.stringify(result))
} finally {
  await page.close()
}
```

有了这层能力之后，像 `YouTube` 这种必须依赖浏览器环境的情况就可以搞定了。

### 3. 扩展引擎支持 `wasm`

单靠 `JavaScript` 虽然已经能做很多事了，但碰到复杂解析或者性能敏感任务时，还是容易吃力。所以这次我又把 `wasm` 支持加进来了。

Go 生态里有个很成熟的 `wasm` 运行时叫 `wazero`，它是纯 Go 实现，不依赖 `CGO`，跨平台这件事天生就比较省心。这也意味着扩展以后不一定非得写成 `JavaScript`，理论上像 `C/C++`、`Rust`、`Go` 这些能编译到 `wasm` 的语言，都有机会接进来。

### 4. 内置 `ffmpeg`

最后一个老大难了，我在这里的技术选型已经纠结了非常久，现在总算是拍板下来了。

主要是如果 Gopeed 只做桌面端，这事其实很好办，直接把 `ffmpeg` 命令行工具打包进去就完了。但 Gopeed 现在是全平台的，移动端没法像桌面端那样直接跑一个 `ffmpeg` 可执行文件，所以这条路一开始就不成立。

后来我翻到一个 [go-ffmpreg](https://codeberg.org/gruf/go-ffmpreg) 项目，它的思路很巧妙，就是把 `ffmpeg` 编译成 `wasm` 模块，再通过 `wazero` 去跑，我已经在移动端试过，能跑通，这意味着可以在不依赖`cgo`的情况下，在所有平台上都能用上 `ffmpeg` 的能力。

## 改完之后能干什么

对普通用户来说，最直观的感受就是 `YouTube 扩展`又满血复活了。

比如后面它就可以直接下载 `4K` 分辨率视频，而且不用再自己折腾音视频合并，甚至连字幕文件也可以一起下载下来，这样整个下载流程才算真正闭环，极大地提升了用户体验。

## 最后

这次改动非常大，现在其实还在比较早期的阶段，很多细节我还在边做边收。由于涉及的平台很多，后面还有不少测试和验证工作要补，这篇就先当作提前透个底。

另外 `新UI` 也在同步开发中，这段时间我白天摸鱼做`扩展增强`，晚上回家设计和开发`新UI`，虽然有点累，但是还是挺有盼头的，相信很快就能看到一个全新的 Gopeed 了，敬请期待吧！
