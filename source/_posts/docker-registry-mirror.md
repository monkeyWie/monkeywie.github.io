---
title: docker镜像加速器
date: 2019-12-06 09:03:26
categories: 运维
tags:
  - docker
  - DevOps
---

## 前言

国内从 docker hub 拉取镜像时速度非常慢，这里记录下国内的一些免费加速镜像服务器。

<!-- more -->

## docker bub

docker 官方仓库加速镜像配置：

1. 修改`/etc/docker/daemon.json`文件：

   ```json
   {
     "registry-mirrors": [
       "https://dockerhub.azk8s.cn",
       "https://reg-mirror.qiniu.com"
     ]
   }
   ```

2. 修改后重启 docker 服务：

   ```sh
   systemctl daemon-reload
   systemctl restart docker
   ```

## gcr.io

google 仓库加速镜像，需要手动将前缀改一下，替换为`gcr.azk8s.cn/google_containers/<image-name>:<version>` ,例如：

```
#docker pull k8s.gcr.io/k8s-dns-node-cache:1.15.7
# 通过镜像仓库拉取
docker pull gcr.azk8s.cn/google_containers/k8s-dns-node-cache:1.15.7
# 重新打tag
docker tag gcr.azk8s.cn/google_containers/k8s-dns-node-cache:1.15.7 k8s.gcr.io/k8s-dns-node-cache:1.15.7
```

```
#docker pull gcr.io/kubernetes-e2e-test-images/echoserver:2.2
docker pull gcr.azk8s.cn/kubernetes-e2e-test-images/echoserver:2.2
docker tag gcr.azk8s.cn/kubernetes-e2e-test-images/echoserver:2.2 gcr.io/kubernetes-e2e-test-images/echoserver:2.2
```

## quay.io

```
#docker pull quay.io/deis/go-dev:v1.10.0
docker pull quay.azk8s.cn/deis/go-dev:v1.10.0
docker tag quay.azk8s.cn/deis/go-dev:v1.10.0 quay.io/deis/go-dev:v1.10.0
```

## 参考

[https://github.com/Azure/container-service-for-azure-china/blob/master/aks/README.md](https://github.com/Azure/container-service-for-azure-china/blob/master/aks/README.md)
