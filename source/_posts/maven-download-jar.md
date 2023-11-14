---
title: maven下载指定依赖jar包
date: 2019-07-25 09:40:16
categories: 后端
tags:
  - maven
---

## 命令格式
```
mvn dependency:get -Dartifact=groupId:artifactId:version:jar:sources
```

### 示例
- 下载jar包
```sh
mvn dependency:get -Dartifact=junit:junit:4.12:jar
```

- 下载源码
```sh
mvn dependency:get -Dartifact=junit:junit:4.12:jar:sources
```
