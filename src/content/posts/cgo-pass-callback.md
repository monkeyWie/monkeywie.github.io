---
title: cgo传递回调函数
published: 2021-04-26 16:10:47
categories: 后端
tags:
  - go
---

## 前言

cgo 是个好东西，可以很方便的和 c、c++交互，这篇文章主要是记录下 cgo 声明回调函数入参，然后在 c 中进行实现并传递。

<!--more-->

## go 代码

在 go 里面每秒调用一次回调函数，回调函数由 c 来实现。

```go
package main

/*
typedef void (*EventCb)(char* event);
static void bridge_event_cb(EventCb cb,char* event)
{
	cb(event);
}
*/
import "C"
import (
	"time"
)

func main() {}

//export SetListener
func SetListener(cb C.EventCb) {
	for i := 0; i < 100; i++ {
		time.Sleep(time.Second)
		C.bridge_event_cb(cb, C.CString(fmt.Sprintf("event:%d", i)))
	}
}
```

编译成动态库：

```
go build -buildmode=c-shared -o main.dll main.go
```

## C 代码

```c
#include <stdio.h>
#include "./main.h"

// 实现回调函数
void cb(char* event){
    printf("%s\n",event);
}

int main(int argc, char const *argv[])
{
    SetListener(cb);
    return 0;
}

```

编译：

```
gcc main.c main.dll -o main.exe
```

## 踩坑过程

在 go 里面声明的`C.EventCb`入参，不能直接进行调用，比如：

```
func SetListener(cb C.EventCb) {
	cb(C.CString("test"))
}
```

这样编译的时候直接会报错，要通过 C 代码桥接来进行回调函数的调用才能通过编译。
