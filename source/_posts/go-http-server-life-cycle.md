---
title: Go语言HTTP服务生命周期
date: 2020-10-21 09:59:45
categories: 后端
tags:
  - go
---

在 go 语言里启动一个 http 服务非常简单，只需要一行代码`http.ListenAndServe()`就可以搞定，这个方法会一直阻塞着直到进程关闭，如果这个时候来了些特殊的需求比如：

- 监听服务启动
- 手动关闭服务
- 监听服务关闭

那么在 go 中应该怎么实现呢？下面来一一举例。

<!--more-->

## 监听服务启动

### 方法一（推荐）

将`Listen`步骤拆分出来，先监听端口，再绑定到`server`上，代码示例：

```go
l, _ := net.Listen("tcp", ":8080")
// 服务启动成功，进行初始化
doInit()
// 绑定到server上
http.Serve(l, nil)
```

### 方法二

通过一个`协程`去轮询监听服务启动状态，代码示例：

```go
go func() {
    for {
        if _, err := net.Dial("tcp", "127.0.0.1:8080"); err == nil {
            // 服务启动成功，进行初始化
            doInit()
            //退出协程
            break
        }
        // 每隔一秒检查一次服务是否启动成功
        time.Sleep(time.Second)
    }
}()
http.ListenAndServe(":8080", nil)
```

## 手动关闭服务

### 优雅关闭（推荐）

在`http`包中并没有暴露服务的关闭方法，通过`http.ListenAndServe()`方法启动的 http 服务默认帮我们创建了一个`*http.Server`对象，源码如下：

```go
func ListenAndServe(addr string, handler Handler) error {
    server := &Server{Addr: addr, Handler: handler}
    return server.ListenAndServe()
}
```

实际上在`*http.Server`中是有提供`Shutdown`方法的，所以我们只需要手动构造一个`*http.Server`对象，就可以进行优雅关闭了，代码示例：

```go
srv := &http.Server{Addr: ":8080"}
go func(){
    // 10秒之后关闭服务
    time.Sleep(time.Second * 10)
    srv.Shutdown(context.TODO())
}()
// 启动服务
srv.ListenAndServe()
```

### 强制关闭

强制关闭和上面步骤是一样的，只是调用的方法换成了`srv.Close()`，这会导致所有的请求立即中断，所以需要特别注意。

## 监听服务关闭

在上一步中将服务手动关闭了，那么`srv.ListenAndServe()`方法就会停止阻塞，这里需要注意的是当我们手动关闭服务时，该方法同样会返回一个`error`，当然这个`error`是一个特殊的错误`http.ErrServerClosed`，帮助我们区分是否为正常的服务关闭，所以我们需要对此特殊处理下，代码示例：

```go
if err := server.ListenAndServe(); err != nil {
    // 服务关闭，进行处理
    doShutdown()
    if err != http.ErrServerClosed{
        // 异常宕机，打印错误信息
        log.Fatal(err)
    }
}
```

## 参考资料
- [how-to-stop-http-listenandserve](https://stackoverflow.com/questions/39320025/how-to-stop-http-listenandserve)
- [go-how-can-i-start-the-browser-after-the-server-started-listening](https://stackoverflow.com/questions/32738188/go-how-can-i-start-the-browser-after-the-server-started-listening)