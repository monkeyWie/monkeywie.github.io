---
title: docker远程连接
date: 2019-11-15 16:19:32
categories: DevOps
tags:
  - docker
---

## 前言

docker 其实是一个 C/S 程序，执行`docker`命令行其实就是在与`docker daemon`服务进行通讯，这里主要是记录下`linux`下的 `docker` 如何配置可以被远程访问。

## 服务端配置

在`linux`上 docker 默认是使用`unix socket`进行通讯的，如果要远程访问是不支持的，对此需要开启 `tcp协议`，以支持外部访问。

### 开启 tcp 协议

1. 修改`/lib/systemd/system/docker.service`文件
   ```shell
   vi /lib/systemd/system/docker.service
   ```
2. 找到`ExecStart=/usr/bin/dockerd`这一行，添加命令行参数`-H tcp://0.0.0.0:3272`
   ```ini
   [Service]
   Type=notify
   # the default is not to use systemd for cgroups because the delegate issues still
   # exists and systemd currently does not support the cgroup feature set required
   # for containers run by docker
   ExecStart=/usr/bin/dockerd -H fd:// -H tcp://0.0.0.0:3272 --containerd=/run/containerd/containerd.sock
   ```
3. 重启 docker
   ```shell
   systemctl daemon-reload
   systemctl restart docker
   ```

这样服务端就已经配置好了。

## 客户端配置

首先需要下载一个 docker 客户端，这是一个非常小的可执行文件，不需要为了一个客户端安装整个 docker 应用。

### docker 客户端下载

- linux
  - 通过[https://download.docker.com/linux/static/](https://download.docker.com/linux/static/)下载
  - (Ubuntu/Debian): `apt-get install docker-ce-cli`
  - (Centos): `yum install docker-ce-cli`
- windows
  - 通过[https://download.docker.com/win/static/](https://download.docker.com/win/static/)下载
- mac
  - 通过[https://download.docker.com/mac/static/](https://download.docker.com/mac/static/)下载

下载完之后将`docker`文件加入到`PATH`中,即可在终端使用了。

### 远程访问

可以直接使用命令行参数来指定远程 docker 进行访问：

```shell
docker -H 192.168.1.1:3272 ps
```

如果不想每次都输入命令行参数，可以配置`DOCKER_HOST`环境变量，这样每次运行`docker`命令时，都会自动设定好对应的远程地址。

```shell
export DOCKER_HOST="tcp://192.168.1.1:3272"
```

## 参考

- [Docker connect to remote server.md](https://gist.github.com/kekru/4e6d49b4290a4eebc7b597c07eaf61f2)
