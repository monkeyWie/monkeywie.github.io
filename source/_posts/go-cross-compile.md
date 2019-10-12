---
title: Go语言之交叉编译
date: 2019-10-10 15:22:27
categories: 后端
tags:
  - Go
---

## 前言

当初学习 go 语言的原因之一就是看中了 go 可以直接编译成机器码运行，并且支持跨操作系统的交叉编译，这对开发跨操作系统软件提供了极大的便利，这篇文章目的就是记录下 go 是如何交叉编译的。

## 交叉编译

go 语言里交叉编译支持非常多的操作系统，可以通过`go tool dist list`命令来查看支持的操作系统列表。

<!-- more-->

```sh
$ go tool dist list
aix/ppc64
android/386
android/amd64
android/arm
android/arm64
darwin/386
darwin/amd64
darwin/arm
darwin/arm64
dragonfly/amd64
freebsd/386
freebsd/amd64
freebsd/arm
illumos/amd64
js/wasm
linux/386
linux/amd64
linux/arm
linux/arm64
linux/mips
linux/mips64
linux/mips64le
linux/mipsle
linux/ppc64
linux/ppc64le
linux/s390x
nacl/386
nacl/amd64p32
nacl/arm
netbsd/386
netbsd/amd64
netbsd/arm
netbsd/arm64
openbsd/386
openbsd/amd64
openbsd/arm
openbsd/arm64
plan9/386
plan9/amd64
plan9/arm
solaris/amd64
windows/386
windows/amd64
windows/arm
```

编译的时候只需要指定环境变量`GOOS`(系统内核)和`GOARCH`(CPU 架构)即可进行交叉编译。

### 示例

- Windows 上编译 Mac 和 Linux 上 64 位可执行程序

```bat
SET CGO_ENABLED=0
SET GOOS=darwin
SET GOARCH=amd64
go build main.go

SET CGO_ENABLED=0
SET GOOS=linux
SET GOARCH=amd64
go build main.go
```

- Linux 上编译 Mac 和 Windows 上 64 位可执行程序

```sh
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build main.go
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build main.go
```

### cgo 程序交叉编译

上面的示例都是基于程序里没有使用`cgo`的情况下进行的，可以看到`CGO_ENABLED=0`这个选项就是关闭`cgo`，因为 go 的交叉编译是不支持`cgo`的，如果程序里使用到了`cgo`时要进行交叉编译就没这么简单了，需要安装一个跨平台的 C/C++ 编译器才可能实现交叉编译。

好在已经有大佬把常用的编译环境都做成到 docker 镜像了，并且提供命令行工具让我们很方便的进行交叉编译，这个工具就是[https://github.com/karalabe/xgo](https://github.com/karalabe/xgo)，但是此仓库作者好像不怎么更新了，并且不支持`go mod`，于是我找到了另一位大佬的 fork:[https://github.com/techknowlogick/xgo](https://github.com/techknowlogick/xgo)，支持`go mod`并且支持最新的`go 1.13`版本。

### xgo 示例

首先要保证机器上有安装 `golang` 和 `docker`，接着按照教程来进行。

1. 拉取镜像

镜像比较大，1 个多 G，拉取要一点时间

```
docker pull techknowlogick/xgo:latest
```

2. 安装 xgo

```
go get src.techknowlogick.com/xgo
```

3. 准备代码

这里引用了`go-sqlite3`这个库，里面用到了`cgo`。

```go
package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

func main() {
	os.Remove("./foo.db")

	db, err := sql.Open("sqlite3", "./foo.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	sqlStmt := `
	create table foo (id integer not null primary key, name text);
	delete from foo;
	`
	_, err = db.Exec(sqlStmt)
	if err != nil {
		log.Printf("%q: %s\n", err, sqlStmt)
		return
	}

	tx, err := db.Begin()
	if err != nil {
		log.Fatal(err)
	}
	stmt, err := tx.Prepare("insert into foo(id, name) values(?, ?)")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()
	for i := 0; i < 100; i++ {
		_, err = stmt.Exec(i, fmt.Sprintf("こんにちわ世界%03d", i))
		if err != nil {
			log.Fatal(err)
		}
	}
	tx.Commit()

	rows, err := db.Query("select id, name from foo")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	for rows.Next() {
		var id int
		var name string
		err = rows.Scan(&id, &name)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println(id, name)
	}
	err = rows.Err()
	if err != nil {
		log.Fatal(err)
	}

	stmt, err = db.Prepare("select name from foo where id = ?")
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()
	var name string
	err = stmt.QueryRow("3").Scan(&name)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(name)

	_, err = db.Exec("delete from foo")
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec("insert into foo(id, name) values(1, 'foo'), (2, 'bar'), (3, 'baz')")
	if err != nil {
		log.Fatal(err)
	}

	rows, err = db.Query("select id, name from foo")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()
	for rows.Next() {
		var id int
		var name string
		err = rows.Scan(&id, &name)
		if err != nil {
			log.Fatal(err)
		}
		fmt.Println(id, name)
	}
	err = rows.Err()
	if err != nil {
		log.Fatal(err)
	}
}
```

4. 编译

在项目目录下运行，编译 Mac,Windows,Linux 下的 64 位可执行程序,`-ldflags="-w -s"`选项可以减小编译后的程序体积。

```sh
xgo -targets=darwin/amd64,windows/amd64,linux/amd64 -ldflags="-w -s" .
```

这样使用`xgo`轻松就完成了多操作系统的交叉编译，并且`xgo`还有很多的特性，可以自行去 github 上看看。
