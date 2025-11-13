---
title: 做个优雅的CRUD boy
published: 2020-05-25 18:15:36
categories: 后端
tags:
  - java
  - spring-boot
  - jpa
---

## 前言

网上都在调侃`CRUD`没有技术含量，但是不可否认的是在工作中无可避免的要做大量的`CRUD`，这里面会存在大量的重复工作，意味着可能会写大量的冗余代码，秉着能少写一行代码绝不多写一行的原则，不应该把时间浪费在这些重复的工作中的，在这里分享两个方案来用尽量少的代码实现`CRUD`,一个是`spring-data-rest`还有一个是我自己封装的一套框架`monkey-spring-boot-starter`，下面一一进行介绍。

<!--more-->

## spring-data-rest

### 简介

Spring Data REST 是 Spring Data 项目的一部分，可轻松在 Spring Data repository 上构建 REST 服务，目前支持`JPA`、`MongoDB`、`Neo4j`、`Solr`、`Cassandra`、`Gemfire`，只需要定义一个`repository`就可以自动转换成 REST 服务。

### 示例

先通过一个例子看看，只需要两个类：

- User.java

```java
@Data
@Entity
public class User {
    @Id
    @GeneratedValue
    private Long id;
    private String name;
    private Integer age;
}
```

- UserRepository.java

```java
public interface UserRepository extends JpaRepository<User,Long> {
}
```

就这样`User表`相关的`REST接口`就已经生成好了，来测试下看看。

- 访问根目录，会列出所有可用的资源列表

```bash
$ curl localhost:8080
{
  "_links" : {
    "users" : {
      "href" : "http://localhost:8080/users{?page,size,sort}",
      "templated" : true
    },
    "profile" : {
      "href" : "http://localhost:8080/profile"
    }
  }
}
```

根据上面的响应，可以看到`User资源`对应的接口地址，接着继续测试。

- 添加用户

```bash
$ curl -X POST -i -H "Content-Type:application/json" -d '{"name":"lee","age":18}' localhost:8080/users
{
  "name" : "lee",
  "age" : 18,
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/users/1"
    },
    "user" : {
      "href" : "http://localhost:8080/users/1"
    }
  }
}
```

- 查询用户

```bash
$ curl localhost:8080/users
{
  "_embedded" : {
    "users" : [ {
      "name" : "lee",
      "age" : 18,
      "_links" : {
        "self" : {
          "href" : "http://localhost:8080/users/1"
        },
        "user" : {
          "href" : "http://localhost:8080/users/1"
        }
      }
    } ]
  },
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/users"
    },
    "profile" : {
      "href" : "http://localhost:8080/profile/users"
    }
  },
  "page" : {
    "size" : 20,
    "totalElements" : 1,
    "totalPages" : 1,
    "number" : 0
  }
}
```

- 分页查询用户

```bash
$ curl "localhost:8080/users?page=0&size=10"
{
  "_embedded" : {
    "users" : [ {
      "name" : "lee",
      "age" : 18,
      "_links" : {
        "self" : {
          "href" : "http://localhost:8080/users/1"
        },
        "user" : {
          "href" : "http://localhost:8080/users/1"
        }
      }
    } ]
  },
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/users?page=0&size=10"
    },
    "profile" : {
      "href" : "http://localhost:8080/profile/users"
    }
  },
  "page" : {
    "size" : 10,
    "totalElements" : 1,
    "totalPages" : 1,
    "number" : 0
  }
}
```

- 修改用户

```bash
$ curl -X PUT -H "Content-Type:application/json" -d '{"name":"hello","age":20}' localhost:8080/users/1
{
  "name" : "hello",
  "age" : 20,
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/users/1"
    },
    "user" : {
      "href" : "http://localhost:8080/users/1"
    }
  }
}
```

```bash
$ curl -X PATCH -H "Content-Type:application/json" -d '{"age":18}' localhost:8080/users/1
{
  "name" : "hello",
  "age" : 18,
  "_links" : {
    "self" : {
      "href" : "http://localhost:8080/users/1"
    },
    "user" : {
      "href" : "http://localhost:8080/users/1"
    }
  }
}
```

- 删除用户

```bash
$ curl -i -X DELETE localhost:8080/users/1
```

核心代码只有十几行就完成了一个基本的`CRUD`功能，在开发小项目的时候效率非常的高，但是由于屏蔽了`controller`层，如果有基于`拦截器`或者`AOP`做一些定制化的功能就比较麻烦了，例如：`日志审计`、`权限校验`之类的。

## 未完待续