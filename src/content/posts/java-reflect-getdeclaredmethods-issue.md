---
title: java反射使用getDeclaredMethods会获取到父类方法的解决办法
published: 2019-07-03 10:18:25
categories: 后端
tags:
  - java
  - 反射
---

### 前言

最近在使用`getDeclaredMethods`方法获取类中的方法时碰到一个奇怪的问题，先来看看`getDeclaredMethods`方法的注释：

> Returns an array containing Method objects reflecting all the declared methods of the class or interface represented by this Class object, including public, protected, default (package) access, and private methods, **but excluding inherited methods**.

谷歌翻译:

> 返回一个包含 Method 对象的数组，这些对象反映此 Class 对象所表示的类或接口的所有声明方法，包括 public，protected，default（包）访问和私有方法，**但不包括继承的方法**。

注意加粗的字体，可以看到 JDK 注释里明确的说明了`getDeclaredMethods`方法不会返回继承的方法，我要的功能就是取当前类上的方法(不包含父类的)，但是事情并没有这么简单，下面一起来看看是为什么。

<!-- more -->

### 测试

#### 正常案例

```java
public class Test {

    class A {
        void add(Object obj) {
        }
    }

    class B extends A{
        @Override
        void add(Object obj) {
        }
    }

    public static void main(String[] args) {
        for (Method method : B.class.getDeclaredMethods()) {
            System.out.println(method.toString());
        }
    }

}
```

代码非常简单，就是一个子类(B)重写了父类(A)的`add(Object obj)`方法，然后通过`B.class.getDeclaredMethods()`来获取子类(B)上声明的所有方法，运行结果如下：

```
void Test$B.add(java.lang.Object)
```

可以看到打印出了子类(B)的`add(Object obj)`方法，并没把父类(A)中的`add(Object obj)`方法也打印出来，符合预期的结果。

#### 非正常的案例

```java
public class Test {

    class A<T> {
        void add(T t) {
        }
    }

    class B extends A<String>{
        @Override
        void add(String obj) {
        }
    }

    public static void main(String[] args) {
        for (Method method : B.class.getDeclaredMethods()) {
            System.out.println(method.toString());
        }
    }

}
```

和之前稍有不同的是，在父类(A)上声明了一个`泛型<T>`，然后子类(B)实现了泛型并重写父类的方法，运行结果如下：

```
void Test$B.add(java.lang.String)
void Test$B.add(java.lang.Object)
```

震惊！不是不返回继承的方法吗？那碰到这种情况该怎么忽略掉来自父类上的方法呢？

### 解决方案
使用`method.isBridge()`方法来判断是否为继承的方法，具体原因可以看[这里](http://stas-blogspot.blogspot.com/2010/03/java-bridge-methods-explained.html)，改造后的代码：

```java
public static void main(String[] args) {
    for (Method method : B.class.getDeclaredMethods()) {
        // 判断是非继承的方法
        if(!method.isBridge()){
            System.out.println(method.toString());
        }
    }
}
```

### 参考
[https://stackoverflow.com/questions/1961350/problem-in-the-getdeclaredmethods-java](https://stackoverflow.com/questions/1961350/problem-in-the-getdeclaredmethods-java)
[http://stas-blogspot.blogspot.com/2010/03/java-bridge-methods-explained.html](http://stas-blogspot.blogspot.com/2010/03/java-bridge-methods-explained.html)