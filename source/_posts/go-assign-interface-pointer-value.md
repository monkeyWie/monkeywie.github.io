---
title: Go语言中interface{}指针赋值
date: 2022-09-30 17:45:18
categories: 后端
tags:
  - go
---

## 前言

在 Go 中，可以通过传递指针来改变函数外部变量的值，例如：

```go
func main() {
    var a int = 1
    fmt.Println(a) // 1
    change(&a,2)
    fmt.Println(a) // 2
}

func change(a *int, b int) {
   // 通过解引用来改变外部变量的值
    *a = b
}
```

但是在某些情况下，我们可能需要传递`interface{}`来接收任意的指针变量，这时候就会遇到一个问题，`interface{}`类型声明的变量是不能直接赋值指针的，例如：

```go
func main() {
    var a int = 1
    fmt.Println(a) // 1
    change(&a,2)
    fmt.Println(a) // 2
}

func change(a interface{},b interface{}) {
    // 这一行会报错: invalid operation: cannot indirect a (variable of type interface{})
    *a = b
}
```

<!--more-->

## 解决方案

查阅了一些资料，发现可以通过`reflect`包来解决这个问题，最终代码为：

```go
func main() {
    var a int = 1
    fmt.Println(a) // 1
    change(&a,2)
    fmt.Println(a) // 2
}

func change(a interface{},b interface{}) {
    // 通过反射来获取指针的值
    val := reflect.ValueOf(a)
    val.Elem().Set(reflect.ValueOf(b))
}
```

或者使用新版本范型特性来解决(推荐)：

```go
func main() {
    var a int = 1
    fmt.Println(a) // 1
    // 通过指定范型来获取指针的值
    change[int](&a,2)
    fmt.Println(a) // 2
}

func change[T any](a *T,b T) {
    *a = b
}
```
