---
title: spring-cloud-gateway缓存区不够用的解决办法
date: 2021-06-02 14:18:22
categories: 后端
tags:
  - java
  - spring
  - spring-cloud
---

## 前言

最近碰到一个问题，我们的`Spring Cloud Gateway`网关有个接口一直报错，错误堆栈如下：

```log
org.springframework.core.io.buffer.DataBufferLimitException: Exceeded limit on max bytes to buffer : 262144
	at org.springframework.core.io.buffer.LimitedDataBufferList.raiseLimitException(LimitedDataBufferList.java:98) ~[spring-core-5.2.12.RELEASE.jar!/:5.2.12.RELEASE]
	Suppressed: reactor.core.publisher.FluxOnAssembly$OnAssemblyException:
	Error has been observed at the following site(s):
	|_ checkpoint ⇢ Body from UNKNOWN  [DefaultClientResponse]
	|_ checkpoint ⇢ org.springframework.cloud.gateway.filter.WeightCalculatorWebFilter [DefaultWebFilterChain]
```

<!--more-->

看起来应该是有个`DataBuffer`缓冲区不够用，然后确认了下目标接口的响应报文确实有点大，于是乎开始 google 寻找答案。

## 解决办法

1. 通过`spring`配置直接调整对应的内存大小

```yaml
spring:
  codec:
    max-in-memory-size: 16MB
```

2. 通过实现`WebFluxConfigurer`接口来配置

```java
@Configuration
public class WebfluxConfig implements WebFluxConfigurer {

    @Override
    public void configureHttpMessageCodecs(ServerCodecConfigurer configurer) {
        configurer.defaultCodecs().maxInMemorySize(16 * 1024 * 1024);
    }
}
```

如果是使用自定义的`WebClient`，那么需要这样配置：

```java
@Bean
public WebClient getWebClientBuilder(){
    return WebClient.builder()
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(16 * 1024 * 1024))
                .build();
}
```

## 踩坑

通过上面两个办法配置之后，问题还是一直存在，后来发现是因为使用了手动构造的`List<HttpMessageReader<?>>`：

```java
@Bean
public List<HttpMessageReader<?>> messageReaders() {
    return HandlerStrategies.withDefaults().messageReaders();
}
```

这种方式通过 Spring 配置的缓存区大小不会生效，后面改成通过`ServerCodecConfigurer`中来获取就 OK 了：

```java
@Bean
public List<HttpMessageReader<?>> messageReaders(ServerCodecConfigurer codecConfigurer) {
    return codecConfigurer.getReaders();
}
```
