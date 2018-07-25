---
title: 从JVM中dump出动态代理生成的class
date: 2018-07-25 17:25:37
categories: 后端
tags:
  - java
  - jvm
  - 动态代理
---
由于动态代理生成的class是直接以二进制的方式加载进内存中的，并没有对应的.class文件生成，所以如果想通过反编译工具查看动态代理生成的代码需要通过特殊的手段来处理。
### 方案一
设置运行环境变量,运行后会把class文件生成在classpath目录下
```
//动态代理时生成class文件
System.getProperties().put("sun.misc.ProxyGenerator.saveGeneratedFiles","true");
```
缺点是只适用于JDK动态代理

### 方案二
使用ClassDump,可以dump出JVM中所有已加载的class。ClassDump位于$JAVA_HOME/lib/sa-jdi.jar中(注：windows版本JDK从1.7开始才有此工具),直接以命令行执行。
```
#查看PID
E:\work\Test\bin>jps

#缺省输出该PID下所有已加载的class文件至./目录
E:\work\Test\bin>java -classpath ".;./bin;%JAVA_HOME%/lib/sa-jdi.jar" sun.jvm.hotspot.tools.jcore.ClassDump <PID>
```

```
//导入sa-jdi.jar包，实现ClassFilter接口，只输出匹配的class文件
public class MyFilter implements ClassFilter{

	@Override
	public boolean canInclude(InstanceKlass arg0) {
		return arg0.getName().asString().startsWith("com/sun/proxy/$Proxy0");
	}
	
}
```
```
#查看PID
E:\work\Test\bin>jps

#使用ClassFilter输出匹配的class文件，并指定输出目录
E:\work\Test\bin>java -classpath ".;./bin;%JAVA_HOME%/lib/sa-jdi.jar" -Dsun.jvm.hotspot.tools.jcore.filter=proxy.MyFilter -Dsun.jvm.hotspot.tools.jcore.outputDir=e:/dump sun.jvm.hotspot.tools.jcore.ClassDump <PID>
```
此方案基于JVM层的ClassDump所以可以支持javassist、cglib、asm动态生成的class。


### 最后贴下JDK动态代理反编译出来的代码
```
package com.sun.proxy;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.lang.reflect.UndeclaredThrowableException;
import proxy.Run;	//目标代理类接口

//继承了Proxy类，实现目标代理类接口
public final class $Proxy0
  extends Proxy
  implements Run
{
  private static Method m1;
  private static Method m3;
  private static Method m0;
  private static Method m2;
  
  public $Proxy0(InvocationHandler paramInvocationHandler)
  {
    super(paramInvocationHandler);
  }
  
  static
  {
    try
    {
      m1 = Class.forName("java.lang.Object").getMethod("equals", new Class[] { Class.forName("java.lang.Object") });
      //获取目标代理类的方法
      m3 = Class.forName("proxy.Run").getMethod("run", new Class[0]);
      m0 = Class.forName("java.lang.Object").getMethod("hashCode", new Class[0]);
      m2 = Class.forName("java.lang.Object").getMethod("toString", new Class[0]);
      return;
    }
    catch (NoSuchMethodException localNoSuchMethodException)
    {
      throw new NoSuchMethodError(localNoSuchMethodException.getMessage());
    }
    catch (ClassNotFoundException localClassNotFoundException)
    {
      throw new NoClassDefFoundError(localClassNotFoundException.getMessage());
    }
  }
  
  //方法重写
  public final String run()
  {
    try
    {
	  //this.h就是InvocationHandler的实现类了，调用invoke方法，在实现类里面做拦截处理
      return (String)this.h.invoke(this, m3, null);
    }
    catch (Error|RuntimeException localError)
    {
      throw localError;
    }
    catch (Throwable localThrowable)
    {
      throw new UndeclaredThrowableException(localThrowable);
    }
  }
  
  public final boolean equals(Object paramObject)
  {
    try
    {
      return ((Boolean)this.h.invoke(this, m1, new Object[] { paramObject })).booleanValue();
    }
    catch (Error|RuntimeException localError)
    {
      throw localError;
    }
    catch (Throwable localThrowable)
    {
      throw new UndeclaredThrowableException(localThrowable);
    }
  }
  
  public final String toString()
  {
    try
    {
      return (String)this.h.invoke(this, m2, null);
    }
    catch (Error|RuntimeException localError)
    {
      throw localError;
    }
    catch (Throwable localThrowable)
    {
      throw new UndeclaredThrowableException(localThrowable);
    }
  }
  
  public final int hashCode()
  {
    try
    {
      return ((Integer)this.h.invoke(this, m0, null)).intValue();
    }
    catch (Error|RuntimeException localError)
    {
      throw localError;
    }
    catch (Throwable localThrowable)
    {
      throw new UndeclaredThrowableException(localThrowable);
    }
  }
}

```

### 参考
[http://rednaxelafx.iteye.com/blog/727938](http://rednaxelafx.iteye.com/blog/727938)