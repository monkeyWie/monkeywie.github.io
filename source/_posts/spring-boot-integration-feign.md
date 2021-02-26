---
title: Spring Boot整合feign
date: 2021-01-28 15:00:28
tags:
---

## 前言

feign 是一个非常好用的 http 客户端工具，它是一种声明式的 http 客户端，只需要声明好接口即可调用，不需要关注底层的请求细节。
通常情况下都是在 Spring Cloud 项目中使用，这里我把它单独整合到 Spring Boot 中，用来替代`RestTemplate`。

## 整合 feign

### 添加依赖

```xml
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-spring4</artifactId>
    <version>11.0</version>
</dependency>

<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-gson</artifactId>
    <version>11.0</version>
</dependency>
```

### 配置 feign

```java
@Configuration
public class FeignConfig {

    @Value("${depend.server.user}")
    private String userServer;

    @Bean
    public InterFeign interFeign() {
        return Feign.builder()
                .client(new InterFeignClient(null, null))
                .encoder(new GsonEncoder())
                .decoder(new GsonDecoder())
                .contract(new SpringContract())
                .retryer(Retryer.NEVER_RETRY)
                .requestInterceptor(template -> {
                    template.header("Content-Type", "application/json");
                })
                .options(new Request.Options(10, TimeUnit.SECONDS, 60, TimeUnit.SECONDS, true))
                .target(InterFeign.class, interServer);
    }

    public class InterFeignClient extends Client.Default {

        public InterFeignClient(final SSLSocketFactory sslContextFactory, final HostnameVerifier hostnameVerifier) {
            super(sslContextFactory, hostnameVerifier);
        }

        @Override
        public Response execute(final Request request, final Request.Options options) throws IOException {
            Response response = super.execute(request, options);
            if (response.status() == 200) {
                String body = Util.toString(response.body().asReader(Charset.forName("UTF-8")));
                InterFeign.Result result = null;
                try {
                    result = JsonUtils.jsonToObject(body, InterFeign.Result.class);
                } catch (Exception e) {

                }
                if (result == null || result.getCode() == null || result.getCode() != 0) {
                    throw new FeignException.FeignServerException(200, "http request fail", request, body.getBytes());
                }
                response = response.toBuilder()
                        .body(body.getBytes())
                        .build();
            }
            return response;
        }
    }
}
```
