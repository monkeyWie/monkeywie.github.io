---
title: Spring AOP调用本类方法没有生效的问题
published: 2020-07-22 17:54:25
categories: 后端
tags:
  - java
  - spring
---

## 背景

首先请思考一下以下代码执行的结果：

- LogAop.java

```java
//声明一个AOP拦截service包下的所有方法
@Aspect
public class LogAop {

  @Around("execution(* com.demo.service.*.*(..))")
  public Object log(ProceedingJoinPoint joinPoint) throws Throwable {
      try {
          MethodSignature methodSignature = (MethodSignature) joinPoint.getSignature();
          Method method = methodSignature.getMethod();
          Object ret = joinPoint.proceed();
          //执行完目标方法之后打印
          System.out.println("after execute method:"+method.getName());
          return ret;
      } catch (Throwable throwable) {
          throw throwable;
      }
  }
}
```

<!--more-->

- UserService.java

```java
@Service
public class UserService{

  public User save(User user){
    //省略代码
  }

  public void sendEmail(User user){
    //省略代码
  }

  //注册
  public void register(User user){
    //保存用户
    this.save(user);
    //发送邮件给用户
    this.sendEmail(user);
  }
}
```

- UserServiceTest.java

```java
@SpringBootTest
public class UserServiceTest{

  @Autowired
  private UserService userService;

  @Test
  public void save(){
    userService.save(new User());
  }

  @Test
  public void sendEmail(){
    userService.sendEmail(new User());
  }

  @Test
  public void register(){
    userService.register(new User());
  }
}
```

在执行`save`方法后，控制台输出为：

```
after execute method:save
```

在执行`sendEmail`方法后，控制台输出为：

```
after execute method:sendEmail
```

请问在执行`register()`方法后会打印出什么内容？

## 反直觉

这个时候可能很多人都会和我之前想的一样，在`register`方法里调用了`save`和`sendEmail`，那 AOP 会处理`save`和`sendEmail`，输出：

```
after execute method:save
after execute method:sendEmail
after execute method:register
```

然而事实并不是这样的，而是输出：

```
after execute method:register
```

在这种认知的情况下，很可能就会写出有`bug`的代码，例如：

```java
@Service
public class UserService{
  //用户下单一个商品
  public void order(User user,String orderId){
    Order order = findOrder(orderId);
    pay(user,order);
  }

  @Transactional
  public void pay(User user,Order order){
    //扣款
    user.setMoney(user.getMoney()-order.getPrice());
    save(user);
    //...其它处理
  }
}
```

当用户下单时调用的`order`方法，在该方法里面调用了`@Transactional`注解修饰的`pay`方法，这个时候`pay`方法的事务管理已经不生效了，在发生异常时就会出现问题。

## 理解 AOP

我们知道 Spring AOP 默认是基于动态代理来实现的，那么先化繁为简，只要搞懂最基本的动态代理自然就明白之前的原因了，这里直接以 JDK 动态代理为例来演示一下上面的情况。

由于 JDK 动态代理一定需要接口类，所以首先声明一个`IUserService`接口

- IUserService.java

```java
public interface IUserService{
  User save(User user);
  void sendEmail(User user);
  User register(User user);
}
```

编写实现类

- UserService.java

```java
public class UserService implements IUserService{

  @Override
  public User save(User user){
    //省略代码
  }

  @Override
  public void sendEmail(User user){
    //省略代码
  }

  //注册
  @Override
  public void register(User user){
    //保存用户
    this.save(user);
    //发送邮件给用户
    this.sendEmail(user);
  }
}
```

编写日志处理动态代理实现

- ServiceLogProxy.java

```java
public static class ServiceLogProxy {
    public static Object getProxy(Class<?> clazz, Object target) {
        return Proxy.newProxyInstance(Thread.currentThread().getContextClassLoader(), new Class[]{clazz}, new InvocationHandler() {
                @Override
                public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                    Object ret = method.invoke(target, args);
                    System.out.println("after execute method:" + method.getName());
                    return ret;
                }
            });
    }
}
```

运行代码

- Main.java

```java
public class Main{
    public static void main(String[] args) {
        //获取代理类
        IUserService userService = (IUserService) ServiceLogProxy.getProxy(IUserService.class, new UserService());
        userService.save(new User());
        userService.sendEmail(new User());
        userService.register(new User());
    }
}
```

结果如下：

```
after execute method:save
after execute method:sendEmail
after execute method:register
```

可以发现和之前 Spring AOP 的情况一样，`register`方法中调用的`save`和`sendEmail`方法同样的没有被动态代理拦截到，这是为什么呢，接下来就看看下动态代理的底层实现。

## 动态代理原理

其实动态代理就是在运行期间动态的生成了一个`class`在 jvm 中，然后通过这个`class`的实例调用真正的实现类的方法，伪代码如下：

```java
public class $Proxy0 implements IUserService{

  //这个类就是之前动态代理里的new InvocationHandler(){}对象
  private InvocationHandler h;
  //从接口中拿到的register Method
  private Method registerMethod;

  @Override
  public void register(User user){
    //执行前面ServiceLogProxy编写好的invoke方法，实现代理功能
    h.invoke(this,registerMethod,new Object[]{user})
  }
}
```

回到刚刚的`main`方法，那个`userService`变量的实例类型其实就是动态生成的类，可以把它的 class 打印出来看看：

```java
IUserService userService = (IUserService) ServiceLogProxy.getProxy(IUserService.class, new UserService());
System.out.println(userService.getClass());
```

输出结果为：

```
xxx.xxx.$Proxy0
```

在了解这个原理之后，再接着解答之前的疑问，可以看到通过`代理类的实例`执行的方法才会进入到拦截处理中，而在`InvocationHandler#invoke()`方法中，是这样执行目标方法的：

```java
//注意这个target是new UserService()实例对象
Object ret = method.invoke(target, args);
System.out.println("after execute method:" + method.getName());
```

在`register`方法中调用`this.save`和`this.sendEmail`方法时，`this`是指向本身`new UserService()`实例，所以本质上就是：

```java
User user = new User();
UserService userService = new UserService();
userService.save(user);
userService.sendEmail(user);
```

不是动态代理生成的类去执行目标方法，那必然不会进行动态代理的拦截处理中，明白这个之后原理之后，就可以改造下之前的方法，让方法内调用本类方法也能使动态代理生效，就是用动态代理生成的类去调用方法就好了，改造如下：

- UserService.java

```java
public class UserService implements IUserService{

  //注册
  @Override
  public void register(User user){
    //获取到代理类
    IUserService self = (IUserService) ServiceLogProxy.getProxy(IUserService.class, this);
    //通过代理类保存用户
    self.save(user);
    //通过代理类发送邮件给用户
    self.sendEmail(user);
  }
}
```

运行`main`方法，结果如下：

```
after execute method:save
after execute method:sendEmail
after execute method:save
after execute method:sendEmail
after execute method:register
```

可以看到已经达到预期效果了。

## Spring AOP 中方法调用本类方法的解决方案

同样的，只要使用代理类来执行目标方法就行，而不是用`this`引用，修改后如下：

```java
@Service
public class UserService{

  //拿到代理类
  @Autowired
  private UserService self;

  //注册
  public void register(User user){
    //通过代理类保存用户
    self.save(user);
    //通过代理类发送邮件给用户
    self.sendEmail(user);
  }
}
```

好了，问题到此就解决了，但是需要注意的是`Spring`官方是不提倡这样的做法的，官方提倡的是使用一个新的类来解决此类问题，例如创建一个`UserRegisterService`类：

```java
@Service
public class UserRegisterService{
  @Autowired
  private UserService userService;

  //注册
  public void register(User user){
    //通过代理类保存用户
    userService.save(user);
    //通过代理类发送邮件给用户
    userService.sendEmail(user);
  }
}
```

## 附录
[从JVM中拿到动态代理生成的class文件](https://monkeywie.github.io/2018/07/25/jvm-dump-class/)
[aop-understanding-aop-proxies](https://docs.spring.io/spring/docs/current/spring-framework-reference/core.html#aop-understanding-aop-proxies)