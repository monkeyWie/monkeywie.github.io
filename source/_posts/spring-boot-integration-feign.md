---
title: Spring Boot整合feign
date: 2021-01-28 15:00:28
categories: 后端
tags:
  - java
  - spring
  - feign
---

## 前言

feign 是一个非常好用的 http 客户端工具，它是一种声明式的 http 客户端，只需要声明好接口即可调用，不需要关注底层的请求细节。
通常情况下都是在 Spring Cloud 项目中使用，这里我把它单独整合到 Spring Boot 中，用来替代`RestTemplate`，提高项目可维护性。

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

### 声明接口

通过`feign-spring4`这个依赖，可以支持使用 SpringMVC 的注解来声明接口，示例：

```java
public interface UserFeign {
    @PostMapping("/users")
    Result<Void> add(@RequestBody UserAddDTO dto);

    @GetMapping("/users")
    Result<UserVO> find(@RequestParam("name") String name);

    @GetMapping("/test/404")
    Result<UserVO> error404();
}
```

可以看到代码和`controller`方法声明基本一致，非常的清晰易懂。

### 配置 feign

```java
@Configuration
public class FeignConfig {

    @Autowired
    private Environment environment;
    @Autowired
    private ObjectMapper objectMapper;

    // 构造user服务的feign客户端
    @Bean
    public UserFeign userFeign() {
        // 这里是因为方便演示，直接调用自身服务的接口
        String userServer = "http://127.0.0.1:" + environment.getProperty("server.port");
        return Feign.builder()
                .client(new FeignClient(null, null))
                .encoder(new GsonEncoder())
                .decoder(new GsonDecoder())
                .contract(new SpringContract()) // 这里很关键，要使用SpringMVC注解必须配置这个contract
                .retryer(Retryer.NEVER_RETRY)
                .requestInterceptor(template -> {
                    template.header("Content-Type", "application/json");
                })
                .options(new Request.Options(10, TimeUnit.SECONDS, 60, TimeUnit.SECONDS, true))
                .target(UserFeign.class, userServer);
    }

    public class FeignClient extends Client.Default {

        public FeignClient(final SSLSocketFactory sslContextFactory, final HostnameVerifier hostnameVerifier) {
            super(sslContextFactory, hostnameVerifier);
        }

        // 重写execute方法，在接口请求失败时抛出异常
        @Override
        public Response execute(final Request request, final Request.Options options) throws IOException {
            Response response = super.execute(request, options);
            if (response.status() == 200) {
                String body = Util.toString(response.body().asReader(Charset.forName("UTF-8")));
                Result result = null;
                try {
                    result = objectMapper.readValue(body, Result.class);
                } catch (Exception e) {

                }
                if (result == null || result.getCode() != 200) {
                    throw new FeignException.FeignServerException(200, "http request fail", request, body.getBytes());
                }
                // 注意这里因为把响应流读完了，所以要重新把body赋值，不然后续后报错
                response = response.toBuilder()
                        .body(body.getBytes())
                        .build();
            }
            return response;
        }
    }
}
```

配置好了之后，后续有新的接口只要去接口上声明新的方法就可以了，维护起来也是非常的方便。

### 调用接口

前面已经将`UserFeign`注册在 spring 容器中了，使用的时候只需要注入到类中，然后和调用本地方法一样使用就行了，示例：

```java
@Autowired
private UserFeign userFeign;

public void query() throws Exception {
    // 调用用户服务查找接口
    Result<UserVO> result = userFeign.find("java");
    System.out.println(result.toString());
}
```

## 附录

本文完整代码放在[github](https://github.com/monkeyWie/spring-boot-best-practices/tree/master/integration-feign)。