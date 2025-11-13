---
title: go升级到1.21版本gomobile编译报错：Undefined symbols
published: 2024-05-08 18:28:55
categories: 后端
tags:
  - go
---

## 前言

之前把`gopeed`项目升级到`go1.21`版本后，发现`gomobile`编译完后，在 flutter ios 端编译会报错，如下：

```sh
ld: Undefined symbols:
  _res_9_nclose, referenced from:
      _runtime.text in Libgopeed[arm64][2](go.o)
  _res_9_ninit, referenced from:
      _runtime.text in Libgopeed[arm64][2](go.o)
  _res_9_nsearch, referenced from:
      _runtime.text in Libgopeed[arm64][2](go.o)
clang: error: linker command failed with exit code 1 (use -v to see invocation)

```

然后我在`go`的`github`里找到了这个[issue](https://github.com/golang/go/issues/58416)，但是看到这个`@bcmills`哥们的回复感觉太麻烦了就用了后面`@dreacot`老哥的解决方案，编译的时候加上`-tags netgo`：

```sh
gomobile bind -target=ios -tags netgo
```

然后就可以正常编译了，因为我自己没有`ios`设备，就没有测试过，按理说编译通过了应该就没问题了，然而最近 github 上好多用户都在反馈 ios 端无法正常使用，附上一个[issue](https://github.com/GopeedLab/gopeed/issues/490)，看起来都是`DNS`解析的问题，起初以为是用户的网络问题，但是随着越来越多的用户反馈，这肯定就不是单纯的用个例问题了，于是又重新开始研究`@bcmills`哥们的解决方案。

<!-- more -->

## 添加 libresolv.tbd 库

他提到的解决方案是通过添加`libresolv.tbd`或者`libresolv.9.tbd`库来解决，但是很尴尬的是我没有`mac`设备，所以没办法在 xcode 里添加这个库，于是问了下无所不知的`ChatGPT`，看看能不能通过命令行添加这个库：

![](gomobile-1-21-undefined-symbols/2024-05-08-18-44-30.png)

看起来好像可行，在`github action`中跑了下，然后顺便把生成出来的`project.pbxproj`文件打印出来，如果没问题的话就复制出来提交，脚本如下：

```sh
gem install xcodeproj
cat <<EOF > temp.rb
require 'xcodeproj'
project_path = 'ui/flutter/ios/Runner.xcodeproj'
project = Xcodeproj::Project.open(project_path)
target = project.targets.first

# 添加系统库
lib_name = 'libresolv.tbd'
framework = 'usr/lib/' + lib_name
target.frameworks_build_phase.add_file_reference(project.frameworks_group.new_file(framework))

project.save
EOF
ruby temp.rb

echo "==========edit project.pbxproj============"
cat ui/flutter/ios/Runner.xcodeproj/project.pbxproj
echo "==========edit project.pbxproj============"
```

接着就是等待`github action`的结果了，结果是编译成功的，然后把`IPA`包发给用户测试，一切正常，问题解决，最后把更新之后的`project.pbxproj`文件提交到`github`上，至此一个没有`mac`设备的我就这样把这个问题解决了，哈哈，不得不说我可真是个天才(狗头保命)。
