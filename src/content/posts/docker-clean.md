---
title: docker清理
published: 2020-02-21 09:42:11
categories: DevOps
tags:
  - docker
---

## 前言

docker 在使用过程中，可能会产生很多冗余无用的数据，这些数据会占用大量硬盘空间，这里记录下如何清理 docker。

### 容器清理

- 删除所有关闭的容器

```sh
docker rm $(docker ps -a -f status=exited -q)
```

- 关闭并删除所有容器

```sh
docker stop $(docker ps -aq)
docker rm $(docker ps -q)
```

### 镜像清理

- 删除 dangling images

```sh
docker image prune
```

- 删除所有镜像

```sh
docker rmi $(docker images -q)
```

### 挂载清理

- 删除 dangling volmue

```
docker volume rm $(docker volume ls -f dangling=true -q)
```
