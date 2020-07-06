---
title: linux下的全局代理工具proxychain
date: 2020-07-06 11:52:35
categories: linux
tags:
  - proxy
---

## proxychain 介绍

> 本文介绍的是[proxychains-ng](https://github.com/rofl0r/proxychains-ng)项目

在 linux 上运行一些命令的时候，经常访问到国外的网站，速度非常的慢，例如用`git`、`wget`等等，这个时候就可以通过`proxychain`工具来使用代理进行网络访问，使用教程如下：

```sh
proxychains4 git clone git@github.com:rofl0r/proxychains-ng.git
```

在所有要运行的命令行之前加上`proxychains4`就可以通过代理进行网络访问了。

<!--more-->

## 安装

### Ubuntu

直接通过 apt 包管理工具就可以安装

```sh
sudo apt-get install -y proxychains4
```

### 源码构建

```
git clone git@github.com:rofl0r/proxychains-ng.git
sudo make
sudo make install
sudo make install-config
```

## 配置

安装完之后可以找到`/etc/proxychains.conf`文件进行修改，一般请求下翻到最后一段修改代理服务器配置即可。

```conf
[ProxyList]
# add proxy here ...
# meanwile
# defaults set to "tor"
socks5  192.168.56.1 1080
```

这里我设置的 socks5 代理，还支持`http`、`socks4`协议的代理，示例：

```conf
#        Examples:
#
#               socks5  192.168.67.78   1080    lamer   secret
#               http    192.168.89.3    8080    justu   hidden
#               socks4  192.168.1.49    1080
#               http    192.168.39.93   8080
```

当然以上内容在`/etc/proxychains.conf`中都可以看到。

## 设置别名

`proxychains4`这个命令比较长不太好记，我通过`alias`给它设置了一个别名`pc`，修改`~/.profile`：

```sh
alias pc=proxychains4
```

刷新 profile

```sh
source ~/.profile
```

测试

```sh
pc curl -I https://www.google.com
[proxychains] config file found: /etc/proxychains.conf
[proxychains] preloading /usr/lib/libproxychains4.so
[proxychains] DLL init: proxychains-ng 4.14-git-8-gb8fa2a7
[proxychains] Strict chain  ...  192.168.56.1:1080  ...  www.google.com:443  ...  OK
HTTP/2 200
```

可以看到已经能够成功访问`google`了。
