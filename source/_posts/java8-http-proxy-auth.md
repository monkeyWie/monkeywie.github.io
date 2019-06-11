---
title: java8下HTTP代理身份验证设置
date: 2019-06-11 17:13:12
categories: HTTP代理
tags:
  - JAVA
  - HTTP
  - proxy
---

### 前言

由于公司内部应用要调用钉钉的 API，但是钉钉 API 有一个 `IP 白名单`限制，而公司的外网 IP 经常变动，每次变动都需要在钉钉的后台配置一个 IP，在开发环境调试非常的麻烦，于是就让运维在一台外网服务器上搭建了一个`HTTP代理服务`，通过代理服务器转发，只需要设置`代理服务器`的外网 IP 就可以避免之前的问题了。

但是好景不长，用着用着发现`代理服务器`越来越卡，接口请求经常超时，后来运维通过日志发现`代理服务器`已经被别人扫描到并大量的在使用了(多半用于爬虫的 IP 池)，因为之前`代理服务器`没有开启`身份验证`，然后运维加上了`身份验证`之后问题就解决了。

这里主要是记录一下 JAVA 8 中使用 HTTP 代理并启用`身份验证`的方法，在网上搜了好多资料才搞定(_很多都是过时的办法不适用 JAVA 8，差点就准备自己去看 JDK 源码了_)。

### 全局设置

全局设置会影响所有由 JDK 中`HttpURLConnection`发起的请求，很多 HTTP 客户端类库都是封装的此类，所以在类库没有暴露 HTTP 代理设置的就可以基于此方案来设置(_比如我用的钉钉 SDK_)。

```java
// 启用http代理
System.setProperty("http.proxySet", "true");
// 发起http请求时使用的代理服务器配置
System.setProperty("http.proxyHost", "ip");
System.setProperty("http.proxyPort", "port");
// 发起https请求时使用的代理服务器配置
System.setProperty("https.proxyHost", "ip");
System.setProperty("https.proxyPort", "port");
// 这行代码是身份验证的关键配置，不然身份验证不起作用
System.setProperty("jdk.http.auth.tunneling.disabledSchemes", "");
// 身份验证
Authenticator.setDefault(
        new Authenticator() {
            @Override
            public PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(
                        "user", "password".toCharArray());
            }
        }
);

// 构造HTTP请求
URL url = new URL("https://www.baidu.com");
HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
```

### 局部设置
针对某次请求来进行代理设置。
```java
// 这行代码是身份验证的关键配置，不然身份验证不起作用
System.setProperty("jdk.http.auth.tunneling.disabledSchemes", "");
// 身份验证
Authenticator.setDefault(
        new Authenticator() {
            @Override
            public PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(
                        "user", "password".toCharArray());
            }
        }
);
// 设置代理服务器
Proxy proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress("ip", port));

// 构造HTTP请求
URL url = new URL("https://www.baidu.com");
HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection(proxy);
```