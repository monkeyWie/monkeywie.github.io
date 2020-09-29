---
title: linux中访问运行中程序的输出
date: 2020-09-29 09:07:32
categories: linux
tags:
  - shell
---

![](linux-access-running-process-output/2020-09-29-09-09-26.png)

## 前言

在 linux 中我们经常会使用`&`符号让进程在后台运行，例如：

```sh
nohup java -jar app.jar &
```

但是这样的话在终端就看不到输出了，有时候临时需要排查问题看不到输出就 GG 了。

## 解决办法

其实可以利用`proc`系统文件来访问程序对应的输出：

1. 首先获取到进程对应的`PID`
2. 通过`tail`命令读取输出：

```sh
#获取标准输出
tail -f /proc/<PID>/fd/1
#获取错误输出
tail -f /proc/<PID>/fd/2
```
