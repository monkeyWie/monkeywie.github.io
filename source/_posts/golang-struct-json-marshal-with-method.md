---
title: golang 方法作为字段转JSON
date: 2024-08-14 18:43:20
tags:
---

假设有一个结构体来表示用户信息：

```go
type User struct {
    Name string `json:"name"`
    Sex  string `json:"sex"`
    Age  int `json:"age"`
    Vip  bool `json:"vip"`
}
```

然后有个需求是展示给用户的名称要根据用户的`性别`和`VIP`来生成，比如说：

- 如果用户是 VIP，那么展示 `尊贵的 + 名字 + 先生/女士`
- 如果用户不是 VIP，那么展示 `名字 + 先生/女士`

这个时候一般会有个做法，在结构体中加一个字段：

```go
type User struct {
    Name string `json:"name"`
    Sex  string `json:"sex"`
    Age  int `json:"age"`
    Vip  bool `json:"vip"`
    DisplayName string `json:"display_name"`
}

// 实现一个方法来设置 DisplayName 字段
func (u *User) SetDisplayName() {

}
```

然后在每次更新`Name`、`Sex`、`Vip`的时候调用`SetDisplayName`方法来更新`DisplayName`字段，或者在序列化的时候调用`SetDisplayName`方法来更新`DisplayName`字段，这样做是没问题的，但是非常的不利于维护，要到处硬编码调用`SetDisplayName`方法，非常容易遗漏，那么有没有什么优雅的方式来解决这个问题呢？答案是有的，下面来介绍一下。

<!-- more -->

## 方法作为字段转JSON

`golang`在做JSON序列化的时候，会调用结构体的`MarshalJSON`方法，可以利用这个特性来解决这个问题，也就是自定义序列化实现，在每次序列化的时候动态计算`DisplayName`字段。

```go
// 实现一个方法来返回 DisplayName 字段
func (u *User) DisplayName() string {

}

// 实现 MarshalJSON 方法
func (u *User) MarshalJSON() ([]byte, error) {
    // 这里要用一个新的结构体来存储原始的 User 结构体，不然会造成递归调用 DisplayName 方法
    type rawUser User
    return json.Marshal(struct {
        rawUser
        DisplayName string `json:"display_name"`
    }{
        rawUser:     rawUser(*u),
        DisplayName: u.DisplayName(),
    })
}
```

这样就可以在序列化的时候动态计算`DisplayName`字段了。

当然上面的示例只是抛砖引玉，可以根据实际业务来使用，比如说直接交给前端来处理`DisplayName`字段逻辑，本文主要是记录一下`golang`中方法作为字段转JSON的方法。