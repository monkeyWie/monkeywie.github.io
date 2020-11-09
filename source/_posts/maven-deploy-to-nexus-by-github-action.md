---
title: 通过GitHub Action自动部署Maven项目至中央仓库
date: 2020-11-06 15:37:47
categories: 后端
tags:
  - github
  - java
  - maven
  - DevOps
---

## 前言

要把自己的 JAVA 项目发布到 Maven 中央仓库上，这个过程非常的麻烦，而且由于 Maven 中央仓库的严谨性，每次发布都需要登录到`Nexus`网站手动进行流程确认，并不支持纯命令行式的部署，导致无法做到真正的`CI/CD`，为了弥补这一点，我抓包分析了一下`Nexus API`并且开发了一个`Github Action`([maven-nexus-release](https://github.com/monkeyWie/maven-nexus-release))用于自动的`Close`和`Release`，从而达到真正的全自动部署。

<!--more-->

- 效果图
  ![](maven-deploy-to-nexus-by-github-action/2020-11-09-10-11-52.png)

> 已经有发布 jar 包到中央仓库的老司机应该都明白发布 jar 包有多麻烦，没有发布过但是想把自己开源项目发布到`Maven`中央仓库的可以先参考下我之前的一篇文章：[发布 jar 包到 maven 中央仓库](https://monkeywie.cn/2018/07/23/publish-jar-to-maven)

## 使用

首先最好是对 Github Action 有一定的了解，如果不了解也没关系，可以通过我之前的文章快速过一遍：[Github Actions 尝鲜](https://monkeywie.cn/2019/10/29/hello-github-actions)

### 准备

#### 托管在 Github 上的 Maven 项目

需要调整`pom.xml`中`maven-gpg-plugin`插件的配置，示例：

```xml
 <plugin>
   <groupId>org.apache.maven.plugins</groupId>
   <artifactId>maven-gpg-plugin</artifactId>
   <executions>
       <execution>
           <id>sign-artifacts</id>
           <phase>verify</phase>
           <goals>
               <goal>sign</goal>
           </goals>
       </execution>
   </executions>
   <configuration>
       <!-- 这个configuration必须配置，用于gpg非交互式密码输入 -->
       <gpgArguments>
           <arg>--pinentry-mode</arg>
           <arg>loopback</arg>
       </gpgArguments>
   </configuration>
 </plugin>
```

#### Nexus 用户名和密码

登录到`https://oss.sonatype.org`的账号和密码。

#### gpg private key

`Base64`编码的 gpg 私钥，通过命令行导出：

- 列出秘钥

```sh
gpg --list-secret-keys --keyid-format LONG
------------------------------------------------
sec   rsa4096/2A6B618785DD7899 2020-11-05 [SC]
      992BB9305698C72B846EF4982A6B618785DD7899
uid                 [ultimate] monkeyWie <liwei-8466@qq.com>
ssb   rsa4096/F8E9F8CBD90028C5 2020-11-05 [E]
```

找到用于发布 jar 包的 key，这里示例中的是`2A6B618785DD7899`。

- 导出私钥

```sh
gpg --armo --export-secret-keys 2A6B618785DD7899
```

注意私钥是从`-----BEGIN PGP PRIVATE KEY BLOCK-----`一直到`-----END PGP PRIVATE KEY BLOCK-----`，而不是仅仅是中间这一段文本。

#### gpg passphrase

在生成 gpg 秘钥的时候会需要输入一个短密码，应该还记得吧。

### 将秘钥配置到 Github Secrets 中

1. 进入 Github 项目主页，然后找到 Settings 选项。
   ![](maven-deploy-to-nexus-by-github-action/2020-11-09-10-55-56.png)

2. 进入`Secrets`菜单
   ![](maven-deploy-to-nexus-by-github-action/2020-11-09-10-56-53.png)

3. 把刚刚准备好的秘钥一一创建
   在右边有`New secret`按钮用于创建秘钥，将刚刚的秘钥内容创建并给定对应的名称，示例：
   ![](maven-deploy-to-nexus-by-github-action/2020-11-09-11-01-06.png)

最终 Secrets 如下：
![](maven-deploy-to-nexus-by-github-action/2020-11-09-10-59-17.png)

### 编写 Github Action 配置文件

在项目根目录下新建`.github/workflows/deploy.yml`文件，内容如下：

```yaml
name: deploy

on:
  # 支持手动触发构建
  workflow_dispatch:
  release:
    # 创建release的时候触发
    types: [published]
jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # 拉取源码
      - uses: actions/checkout@v2
      # 安装JDK环境
      - name: Set up JDK 1.8
        uses: actions/setup-java@v1
        with:
          java-version: 1.8
      # 设置Maven中央仓库配置
      - name: Set up Apache Maven Central
        uses: actions/setup-java@v1
        with:
          java-version: 1.8
          server-id: releases
          # Nexus用户名环境变量
          server-username: MAVEN_USERNAME
          # Nexus密码环境变量
          server-password: MAVEN_CENTRAL_TOKEN
          # gpg短密码环境变量
          gpg-passphrase: MAVEN_GPG_PASSPHRASE
          # gpg私钥
          gpg-private-key: ${{ secrets.MAVEN_GPG_PRIVATE_KEY }}
      # 推送jar包至maven中央仓库
      - name: Publish to Apache Maven Central
        # 执行maven deploy命令
        run: mvn clean deploy
        # 环境变量设置
        env:
          # Nexus用户名,如果觉得不想暴露也可以配置到secrets中
          MAVEN_USERNAME: xxx
          # Nexus密码
          MAVEN_CENTRAL_TOKEN: ${{ secrets.MAVEN_CENTRAL_TOKEN }}
          # gpg短密码
          MAVEN_GPG_PASSPHRASE: ${{ secrets.MAVEN_GPG_PASSPHRASE }}
      # Nexus自动部署
      - name: Release on nexus
        uses: monkeyWie/maven-nexus-release@v1
        with:
          # Nexus用户名
          maven-repo-server-username: xxx
          # Nexus密码
          maven-repo-server-password: ${{ secrets.MAVEN_CENTRAL_TOKEN }}
```

把代码推送到 Github 上，就可以看到对应的`Action`了，上面示例中有两种方式来触发构建：

- 手动触发
  通过 Github 可以手动的触发构建，方便测试，操作如下图：
  ![](maven-deploy-to-nexus-by-github-action/2020-11-09-11-15-45.png)

- 发布 release 时自动触发
  在 Github 项目中创建 release，会自动的触发构建，适用于项目稳定之后。

## 后记

以上步骤都在我的项目[proxyee](https://github.com/monkeyWie/proxyee)中通过验证，另外[maven-nexus-release](https://github.com/monkeyWie/maven-nexus-release)项目还是刚起步，功能可能不够完善，大家如果有什么好的想法和建议欢迎提出 issue 和 pr。

顺便小小的安利下`proxyee`，它是基于`netty`编写的 HTTP 代理服务器，支持代理`HTTP`+`HTTPS`+`WebSocket`，并且支持`HTTP`和`HTTPS`抓包，感兴趣的可以 Star 一下。
