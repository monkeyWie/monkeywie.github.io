---
title: wsl终端运行命令提示‘bash\r’: No such file or directory
date: 2023-05-22 15:05:39
categories: linux
tags:
  - wsl
---

## 前言

想在 wsl 上安装 flutter 跑一跑我的`gopeed`项目，在安装完 flutter 并设置好环境变量后，运行`flutter doctor`提示`bash\r: No such file or directory`，搜索了一番发现没有找到解决方案，于是自己摸索了一番，记录下来。

<!--more-->

## 解决方案

通过之前搜索的结果，大部分都是说是换行符的问题，可是我安装的明明是 linux 版本的 flutter，不可能是换行符的问题，怀疑是调用到了 windows 宿主机上的 flutter，于是输入`which flutter`一看：

```bash
which flutter
/mnt/d/flutter/bin/flutter
```

果然是调用到了 windows 上的 flutter，明明在`~/.bashrc`配置好了 flutter 的`PATH`，为什么还是调用到了 windows 上的呢？输入`echo $PATH`一看：

```bash
echo $PATH
/mnt/d/flutter/bin:...:/home/levi/flutter/bin
```

两个 flutter 的路径都在，这就是问题所在了，因为`/mnt/d/flutter/bin`在`/home/levi/flutter/bin`前面，所以会优先调用 windows 上的 flutter，解决方案就是把`/mnt/d/flutter/bin`放到`/home/levi/flutter/bin`后面，这样就不会调用到 windows 上的 flutter 了，修改`~/.bashrc`文件：

```bash
# 修改前
export PATH="$PATH:home/levi/flutter/bin"
# 修改后
export PATH="/home/levi/flutter/bin:$PATH"
```

然后重新打开终端，输入`flutter doctor`，问题解决。