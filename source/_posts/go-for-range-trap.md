---
title: Go语言中for range的"坑"
date: 2019-07-01 11:34:56
categories: 后端
tags:
  - Go
---

### 前言

Go 中的`for range`组合可以和方便的实现对一个数组或切片进行遍历，但是在某些情况下使用`for range`时很可能就会被`"坑"`，下面用一段代码来模拟下：

```go
func main() {
	arr1 := []int{1, 2, 3}
	arr2 := make([]*int, len(arr1))

	for i, v := range arr1 {
		arr2[i] = &v
	}

	for _, v := range arr2 {
		fmt.Println(*v)
	}
}
```

<!-- more -->

代码解析：

1. 创建一个`int slice`，变量名为`arr1`并初始化 1,2,3 作为切片的值。
2. 创建一个`*int slice`，变量名为`arr2`。
3. 通过`for range`遍历`arr1`，然后获取每一个元素的指针，赋值到对应`arr2`中。
4. 逐行打印`arr2`中每个元素的值。

从代码上看，打印出来的结果应该是

```
1
2
3
```

然而真正的结果是

```
3
3
3
```

### 原因

因为`for range`在遍历`值类型`时，其中的`v`变量是一个`值`的拷贝，当使用`&`获取指针时，实际上是获取到`v`这个临时变量的指针，而`v`变量在`for range`中只会创建一次，之后循环中会被一直重复使用，所以在`arr2`赋值的时候其实都是`v`变量的指针，而`&v`最终会指向`arr1`最后一个元素的值拷贝。

来看看下面这个代码，用`for i`来模拟`for range`，这样更易于理解:

```go
func main() {
	arr1 := []int{1, 2, 3}
	arr2 := make([]*int, len(arr1))

	var v int
	for i:=0;i<len(arr1);i++ {
		v = arr1[i]
		arr2[i] = &v
	}

	for _, v := range arr2 {
		fmt.Println(*v)
	}
}

```

### 解决方案

1. 传递原始指针

```go
func main() {
    arr1 := []int{1, 2, 3}
    arr2 := make([]*int, len(arr1))

    for i := range arr1 {
        arr2[i] = &arr1[i]
    }

    for _, v := range arr2 {
        fmt.Println(*v)
    }
}
```

2. 使用临时变量

```go
func main() {
    arr1 := []int{1, 2, 3}
    arr2 := make([]*int, len(arr1))

    for i, v := range arr1 {
        t := v
        arr2[i] = &t
    }

    for _, v := range arr2 {
        fmt.Println(*v)
    }
}
```

3. 使用闭包

```go
func main() {
    arr1 := []int{1, 2, 3}
    arr2 := make([]*int, len(arr1))

    for i, v := range arr1 {
        func(v int){
             arr2[i] = &v
        }(v)
    }

    for _, v := range arr2 {
        fmt.Println(*v)
    }
}
```
