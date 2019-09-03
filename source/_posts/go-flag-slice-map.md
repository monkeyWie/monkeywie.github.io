---
title: Go语言flag接收slice和map类型参数
date: 2019-09-03 15:22:27
categories: 后端
tags:
  - Go
---

## 前言

go 自带的`flag`包可以很容易的实现一个命令行程序的参数解析，但是`flag`包默认只支持几个基本类型的参数解析，如果需要传递`slice`或者`map`类型时就要自定义了，这里记录一下。

## 原理

通过`flag.Var()`方法传递一个`Value`接口，即可自定义命令行参数的解析，`flag.Value`接口：

```
type Value interface {
	String() string
	Set(string) error
}
```

<!-- more -->

接下来通过自定义类型来实现这个接口即可满足需求。

## slice 传递

```go
type sliceFlag []string

func (f *sliceFlag) String() string {
	return fmt.Sprintf("%v", []string(*f))
}

func (f *sliceFlag) Set(value string) error {
	*f = append(*f, value)
	return nil
}

func main() {
    var hostsFlag sliceFlag
    flag.Var(&hostsFlag, "host", "Application hosts,for example: -host=a.com -host=b.com")
}
```

这里需要注意的是数组的扩容需要使用`*f = append(*f, value)`，来修改原本的数组

## map 传递

```go

func (f mapFlag) String() string {
	return fmt.Sprintf("%v", map[string]string(f))
}

func (f mapFlag) Set(value string) error {
	split := strings.SplitN(value, "=", 2)
	f[split[0]] = split[1]
	return nil
}

func main() {
    var hostsFlag sliceFlag
    flag.Var(&hostsFlag, "env", "env list,for example: -env key1=value1 -env key2=value2")
}
```
