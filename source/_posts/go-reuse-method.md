---
title: Go语言方法复用
date: 2020-03-31 16:00:06
categories: 后端
tags:
  - Go
---

### 前言

用过`OOP`的都知道，子类重写父类的方法可以优雅的实现代码的复用，例如：

```java
public abstract class People {
    String name;
    int age;

    public People(String name, int age) {
        this.name = name;
        this.age = age;
    }

    public void hello() {
        System.out.printf("name:%s age:%d sex:%s\n", name, age, sex());
    }

    public abstract String sex();

    static class Male extends People {

        public Male(String name, int age) {
            super(name, age);
        }

        @Override
        public String sex() {
            return "M";
        }
    }

    static class Female extends People {

        public Female(String name, int age) {
            super(name, age);
        }

        @Override
        public String sex() {
            return "F";
        }
    }

    public static void main(String[] args) {
        new Male("小明",20).hello();
        new Female("小红",18).hello();
    }
}
```

输出：

```
name:小明 age:20 sex:M
name:小红 age:18 sex:F
```

但是`go`不支持`OOP`，那么在`go`中要类似情况的应该怎么实现？

<!--more-->

### 错误的示范

一开始我想通过`go`提供的组合模拟继承来实现，于是有了以下代码：

```go
package main

import (
	"fmt"
)

type People struct {
	name string
	age  int
}

func (p *People) say() {
	fmt.Printf("name:%s age:%d sex:%s\n", p.name, p.age, p.sex())
}

func (p *People) sex() string {
	return "unknown"
}

type Male struct {
	People
}

func (m *Male) sex() string {
	return "M"
}

type Female struct {
	People
}

func (f *Female) sex() string {
	return "F"
}

func main() {
	m := &Male{People{name: "小明", age: 20}}
	m.say()
	f := &Female{People{name: "小红", age: 18}}
	f.say()
}
```

上面代码中分别`Male`和`Female`都重写了`sex()`方法，来进行方法重用，然而运行的结果却和预料的不一样，输出：

```
name:小明 age:20 sex:unknown
name:小红 age:18 sex:unknown
```

从输出结果可以看到，依旧是调用的`people结构体的sex方法`，因为`go`并不支持`OOP`，组合类型其实只是某种形式上的语法弹，并不会改变"父类"中调用的方法。

### 通过接口实现

抽象一个`Sex`接口出来，由`Male`和`Female`来具体实现，直接上代码：

```go
package main

import (
	"fmt"
)

type Sex interface {
	sex() string
}

type People struct {
	name string
	age  int
	Sex
}

func (p *People) say() {
	fmt.Printf("name:%s age:%d sex:%s\n", p.name, p.age, p.sex())
}

type Male struct {
}

func (m *Male) sex() string {
	return "M"
}

func (m *Male) play(){
	fmt.Println("男生爱打游戏")
}

type Female struct {
}

func (f *Female) sex() string {
	return "F"
}

func (f *Female) sing() {
	fmt.Println("女生爱唱歌")
}

func main() {
	m := &People{name: "小明", age: 20, Sex: &Male{}}
	m.say()
	f := &People{name: "小红", age: 18, Sex: &Female{}}
	f.say()
}
```

输出：

```
name:小明 age:20 sex:M
name:小红 age:18 sex:F
```

不过这样也引入了一个新的问题，`m`和`f`变量都是`People`类型，比如现在有个方法需要通过性别来做不同的处理，那么就要使用`类型断言`来实现了，例如：

```go
func handle(people *People){
    switch sex := people.Sex.(type) {
	case *Male:
		sex.play()
	case *Female:
		sex.sing()
	default:
		panic("error")
	}
}
```
