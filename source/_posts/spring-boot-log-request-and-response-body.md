---
title: Spring Boot记录完整请求响应日志
date: 2021-01-27 10:13:51
categories: 后端
tags:
  - java
  - spring
---

## 前言

在排查错误时通常都需要通过日志来查看接口的请求参数和响应结果来定位和分析问题，一般我们都会使用一个`Filter`来做一些简单的请求日志记录，但是默认情况下 Spring Boot 是不支持记录`请求体`和`响应体`的，因为请求体和响应体都是以流的方式对外提供调用，如果在`Filter`中把请求体和响应体读完了，就会使后续的应用读不到流数据导致异常。

<!--more-->

## 实现思路

如果要记录`请求体`和`响应体`的话，需要将流使用完之后缓存在内存中，以供后续使用，这个实现起来好像还挺复杂，需要包装`HttpServletRequest`、`HttpServletResponse`两个类，然后对其中的`IO`接口做处理，大概代码如下：

```java
@Bean
public OncePerRequestFilter contentCachingRequestFilter() {
    // 配置一个Filter
    return new OncePerRequestFilter() {
        @Override
        protected void doFilterInternal(final HttpServletRequest request, final HttpServletResponse response, final FilterChain filterChain) throws ServletException, IOException {
            // 包装HttpServletRequest，把输入流缓存下来
            CachingRequestWrapper wrappedRequest = new CachingRequestWrapper(request);
            // 包装HttpServletResponse，把输出流缓存下来
            CachingResponseWrapper wrappedResponse = new CachingResponseWrapper(response);
            filterChain.doFilter(wrappedRequest, wrappedResponse);
            LOGGER.info("http request:{}", wrappedRequest.getContent());
            LOGGER.info("http response:{}", wrappedResponse.getContent());
        }
    };
}
```

## 使用 spring 内置包装类

有了上面一步的思路应该可以实现记录`请求体`和`响应体`内容了，然而没必要，`spring`官方已经提供了两个类来做这件事，就是`ContentCachingRequestWrapper`和`ContentCachingResponseWrapper`，使用方法也差不多，代码示例：

```java
@Bean
public OncePerRequestFilter contentCachingRequestFilter() {
    // 配置一个Filter
    return new OncePerRequestFilter() {
        @Override
        protected void doFilterInternal(final HttpServletRequest request, final HttpServletResponse response, final FilterChain filterChain) throws ServletException, IOException {
            // 包装HttpServletRequest，把输入流缓存下来
            ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
            // 包装HttpServletResponse，把输出流缓存下来
            ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);
            filterChain.doFilter(wrappedRequest, wrappedResponse);
            LOGGER.info("http request:{}", new String(wrappedRequest.getContentAsByteArray()));
            LOGGER.info("http response:{}", new String(wrappedResponse.getContentAsByteArray()));
            // 注意这一行代码一定要调用，不然无法返回响应体
            wrappedResponse.copyBodyToResponse();
        }
    };
}
```

## 附录

本文完整代码放在[github](https://github.com/monkeyWie/spring-boot-best-practices/tree/master/log-body)。
