---
title: Gopeed 扩展系统 JS 引擎修复小记
published: 2026-01-18 19:37:26
categories: 独立开发
tags:
  - gopeed
---

## 前言

如果你看过我之前写的[为我的开源下载器打造一套扩展系统](/posts/how-to-develop-a-cross-platform-extension-system)，应该对 Gopeed 的扩展体系有点印象：为了让扩展在 `Windows/macOS/Linux/Android/iOS/Web` 上都能跑，我选择了纯 Go 实现的 JavaScript 引擎 [goja](https://github.com/dop251/goja) 作为运行时，并在上层 `inject`/`polyfill` 了一部分常用浏览器 API，尽量让扩展开发体验贴近“写前端”。

最近 [油管扩展](https://github.com/monkeyWie/gopeed-extension-youtube) 有用户反馈：解析失败，没法正常下载。第一反应当然是“油管又更新反爬了”，于是把上游库 [YouTube.js](https://github.com/LuanRT/YouTube.js) 升级到最新版——结果：依然不行。

再往下追，才发现这次锅不在油管，也不在 YouTube.js，而是在 goja：某些 JavaScript 行为在规范里是允许的，但 goja 的实现踩了坑，直接把扩展脚本干崩了。

<!--more-->

## 问题排查

新版本的 `YouTube.js` 在需要执行 `signature` 解密逻辑时，会要求调用方提供一个“JS 解释器”去执行一段动态脚本，核心逻辑大概是这样：

```js
Platform.shim.eval = async (data, env) => {
  const properties = []

  if (env.n) {
    properties.push(`n: exportedVars.nFunction("${env.n}")`)
  }

  if (env.sig) {
    properties.push(`sig: exportedVars.sigFunction("${env.sig}")`)
  }

  const code = `${data.output}\nreturn { ${properties.join(', ')} }`

  return new Function(code)()
}
```

> 都是 JS 运行时了还要多此一举提供一个 `js解释器` 来执行脚本，这就非常的幽默。

这段代码本质就是`动态运行js脚本`。但在 goja 里跑的时候会直接 `panic`，报一个看起来很奇怪的 `Stack overflow` 异常。

同样的代码我丢到浏览器里执行完全 OK，那基本就可以确认：问题出在 goja。

去 GitHub issues 搜了一圈，很快找到了高度相关的讨论：[Issue #275](https://github.com/dop251/goja/issues/275)。核心原因是：当对象/数组存在 `circular reference（循环引用）`，某些隐式类型转换（例如触发 `toPrimitive -> toString`）会导致 goja 递归爆栈。

更麻烦的是：作者在 issue 里提到这种行为在 `ECMAScript` 规范里是允许的，因此当时并没有打算修。

这个 issue 我在 2023 年就看过，还在下面问过“有没有修复计划”。没想到 2026 年了还是老样子——那就只能自己动手了。

我对 `PL（Programming Languages）` 这块属于门外汉，但现在有 AI 了我觉得应该可以试着解决一下。于是我让 AI 根据报错现象整理出了一个最小可复现用例：

```golang
package main

import (
	"fmt"
	"github.com/dop251/goja"
)

func main() {
	vm := goja.New()

	code := `
		var T = [1, 2, 3];
		T[42] = T;       // Create circular reference
		var x = T % 2;   // Modulo operation triggers toPrimitive -> toString
	`

	_, err := vm.RunString(code)
	if err != nil {
		fmt.Printf("ERROR: %v\n", err)
	}
}
```

这个例子可以稳定复现同样的爆栈问题，接下来就好办了：让 AI 阅读 goja 源码，把递归链路找出来，然后补上对循环引用场景的处理。

最终我给 goja 提了一个修复：[PR #695](https://github.com/dop251/goja/pull/695)，目前已经合并到主分支。

## 写在最后

不得不感叹 AI 的进化速度：2023 年我还只能在 issue 底下“蹲作者”，现在已经可以借助 AI 把自己不擅长的领域搞定了，等 Gopeed 下个版本发布后，油管扩展也就能正常工作了。
