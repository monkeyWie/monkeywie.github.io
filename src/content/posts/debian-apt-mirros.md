---
title: debian快速设置apt源
published: 2020-09-02 15:50:18
categories: linux
tags:
  - docker
  - nginx
---

## 前言

使用 docker 的时候为了排查问题经常需要下载一些软件包，但是一般镜像中都没有`vim`，如果直接用`apt`官方源去下载，基本上就是下面这样：
![](debian-apt-mirros/2020-09-02-15-54-53.png)

这是因为没有更新源，需要通过`apt-get update`进行更新，但是国内访问官方源的速度实在是太慢，要修改成国内的源镜像去加速，这里记录下没有`vim`的情况下如何快速修改源地址。

## 使用清华大学镜像

```
sed -i 's/deb.debian.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apt/sources.list
sed -i 's|security.debian.org/debian-security|mirrors.tuna.tsinghua.edu.cn/debian-security|g' /etc/apt/sources.list
```

- 更新和安装软件

```
apt-get update
apt-get install -y net-tools
```
