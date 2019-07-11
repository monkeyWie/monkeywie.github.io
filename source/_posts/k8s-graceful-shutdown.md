---
title: Kubernetes之优雅停止pod
date: 2019-07-11 10:22:46
categories: 运维
tags:
  - k8s
  - DevOps
---

每个`pod`代表一个集群中节点，在 k8s 做`rolling-update`的时候默认会向旧的`pod`发生一个`SIGTERM`信号，如果应用没有对`SIGTERM`信号做处理的话，会立即强制退出程序，这样的话会导致有些请求还没处理完，前端应用请求错误。

### 滚动升级步骤

先来回顾下 k8s 的滚动升级步骤：

1. 启动一个新的 pod
2. 等待新的 pod 进入 Ready 状态
3. 创建 Endpoint，将新的 pod 纳入负载均衡
4. 移除与老 pod 相关的 Endpoint，并且将老 pod 状态设置为 Terminating，此时将不会有新的请求到达老 pod
5. 给老 pod 发送 SIGTERM 信号，并且等待 terminationGracePeriodSeconds 这么长的时间。(默认为 30 秒)
6. 超过 terminationGracePeriodSeconds 等待时间直接强制 kill 进程并关闭旧的 pod

这里要注意，`SIGTERM信号如果进程没有处理的话也其实也就会导致进程被强杀`，如果处理了但是超过`terminationGracePeriodSeconds`配置的时间也一样会被强杀，所以这个时间可以根据具体的情况去设置。

<!-- more -->

### SpringBoot 处理 SIGTERM 信号

在`SpringBoot`中处理 SIGTERM 信号非常简单，只需要一个`@PreDestroy`注解就可以监听到：

```java
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

    @PreDestroy
    public void shutdown() {
       System.out.println("shutdown")
    }
}
```

### 通过容器生命周期 hook 来优雅停止

在 pod 中容器将停止前，会执行`PreStop hook`，hook 可以执行一个`HTTP GET`请求或者`exec`命令，并且它们执行是阻塞的，可以利用这个特性来做优雅停止。

- 调用`HTTP GET`

  ```json
  "lifecycle": {
      "preStop": {
      "httpGet": {
              "path": "/shutdown",
              "port": 3000,
              "scheme": "HTTP"
          }
      }
  }
  ```

- 调用`exec`
  ```json
  "lifecycle": {
      "preStop": {
          "exec": {
              "command": ["/bin/sh", "-c", "sleep 30"]
          }
      }
  }
  ```

这样的好处是可以在 k8s 层面来解决优雅停机的问题，而不需要应用程序对`SIGTERM`信号做处理。

### 关于 PreStop 和 terminationGracePeriodSeconds

1. 如果有`PreStop hook`会执行`PreStop hook`。
2. `PreStop hook`执行完成后会向 pod 发送`SIGTERM`信号。
3. 如果在`terminationGracePeriodSeconds`时间限制内，`PreStop hook`没有执行完的话，一样会直接发送`SIGTERM`信号，并且时间延长 2 秒。

即在有`PreStop hook`的情况下，也是在`terminationGracePeriodSeconds`时间限制内，在超过这个时间点之后，还会给出 2 秒进程处理`SIGTERM`信号的时间，最后直接强杀。

以上情况已经过 k8s 上验证过，参考：[https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods](https://kubernetes.io/docs/concepts/workloads/pods/pod/#termination-of-pods)
