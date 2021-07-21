---
title: vitrual-box-installation-on-ubuntu
date: 2021-07-21 12:43:58
categories: 虚拟机
tags:
  - ubuntu
---

使用`VitrualBox`安装 ubuntu 之后，需要启用`VitrualBox`增强功能，发现一直装不上，这里记录下解决方案：

<!--more-->

## 问题

安装时错误日志如下：

Please install the gcc make perl packages from your distribution。

![](vitrual-box-installation-on-ubuntu/2021-07-21-12-47-21.png)

## 解决办法

```sh
sudo apt install -y build-essential linux-kernel-headers
```

然后重新安装，完成后重启虚拟机即可。
