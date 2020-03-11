---
title: 通过docker-compose快速搭建mongodb副本集
date: 2020-03-10 11:09:10
categories: 后端
tags:
  - mongo
  - docker
  - docker-compose
---

## 前言

mongoDB 提供的副本集是将数据同步至多个节点，提供了数据冗余备份和节点故障的情况下可以自动转移的高可用特性，架构图如下：
![](mongodb-replica-set/2020-03-11-09-53-26.png)

有时候需要要在本地搭建一套 mongoDB 副本集环境来做测试，如果用虚拟机的话还是比较麻烦的，这里记录下如何用 docker-compose 快速搭建 mongoDB 副本集。

<!--more-->

## 构建镜像

1. 准备秘钥用于节点之间的认证

```
openssl rand -base64 756 > auth.key
```

2. 编写 Dockerfile

调整 mongo 官方提供的镜像，像里面添加秘钥文件

```docker
FROM mongo:3.4.10
#将秘钥文件复制到镜像中
COPY auth.key /app/auth.key
RUN chown -R mongodb:mongodb /app/auth.key
#设置秘钥文件权限，这一步非常关键
RUN chmod 600 /app/auth.key
```

3. 构建镜像

```
docker build -t mongo-replset .
```

4. 编写 docker-compose

开启三个容器，组成一主两从的副本集集群，另外再开启一个容器监听和初始化副本集，这里我的实现方式并不优雅，就是一直重试直到前面三个 mongod 进程启动完成(官方有个[解决方案](https://docs.docker.com/compose/startup-order/)来检测依赖服务的启动，不过有点麻烦这里就略过了)，启动完成之后执行副本集初始化命令：`mongo mongodb://root:123@mongo-1:27011/admin --eval 'rs.initiate({ _id: "rs", members: [{_id:1,host:"mongo-1:27011"},{_id:2,host:"mongo-2:27012"},{_id:3,host:"mongo-3:27013"}]})'`

```yaml
version: "3.1"
services:
  mongo-1:
    image: mongo-replset
    hostname: mongo-1
    restart: always
    ports:
      - 27011:27011
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: 123
    command:
      - --port
      - "27011"
      - --replSet
      - rs
      - --keyFile
      - /app/auth.key
  mongo-2:
    image: mongo-replset
    hostname: mongo-2
    restart: always
    ports:
      - 27012:27012
    command:
      - --port
      - "27012"
      - --replSet
      - rs
      - --keyFile
      - /app/auth.key
  mongo-3:
    image: mongo-replset
    hostname: mongo-3
    restart: always
    ports:
      - 27013:27013
    command:
      - --port
      - "27013"
      - --replSet
      - rs
      - --keyFile
      - /app/auth.key
  mongo-init:
    image: mongo:3.4.10
    depends_on:
      - mongo-1
      - mongo-2
      - mongo-3
    restart: on-failure:5
    command:
      - mongo
      - mongodb://root:123@mongo-1:27011/admin
      - --eval
      - 'rs.initiate({ _id: "rs", members: [{_id:1,host:"mongo-1:27011"},{_id:2,host:"mongo-2:27012"},{_id:3,host:"mongo-3:27013"}]})'
```

5. 运行

```
docker-compose up -d
Creating mongo-replica_mongo-1_1 ... done
Creating mongo-replica_mongo-3_1 ... done
Creating mongo-replica_mongo-2_1 ... done
Creating mongo-replica_mongo-init_1 ... done
```

6. 查看副本集状态

```
docker-compose exec mongo-1 mongo mongodb://root:123@mongo-1:27011/admin --eval 'rs.status()'
MongoDB shell version v3.4.10
connecting to: mongodb://root:123@mongo-1:27011/admin
MongoDB server version: 3.4.10
{
        "set" : "rs",
        "date" : ISODate("2020-03-10T07:01:59.764Z"),
        "myState" : 1,
        "term" : NumberLong(1),
        "heartbeatIntervalMillis" : NumberLong(2000),
        "optimes" : {
                "lastCommittedOpTime" : {
                        "ts" : Timestamp(1583823710, 1),
                        "t" : NumberLong(1)
                },
                "appliedOpTime" : {
                        "ts" : Timestamp(1583823710, 1),
                        "t" : NumberLong(1)
                },
                "durableOpTime" : {
                        "ts" : Timestamp(1583823710, 1),
                        "t" : NumberLong(1)
                }
        },
        "members" : [
                {
                        "_id" : 1,
                        "name" : "mongo-1:27011",
                        "health" : 1,
                        "state" : 1,
                        "stateStr" : "PRIMARY",
                        "uptime" : 263,
                        "optime" : {
                                "ts" : Timestamp(1583823710, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2020-03-10T07:01:50Z"),
                        "electionTime" : Timestamp(1583823469, 1),
                        "electionDate" : ISODate("2020-03-10T06:57:49Z"),
                        "configVersion" : 1,
                        "self" : true
                },
                {
                        "_id" : 2,
                        "name" : "mongo-2:27012",
                        "health" : 1,
                        "state" : 2,
                        "stateStr" : "SECONDARY",
                        "uptime" : 261,
                        "optime" : {
                                "ts" : Timestamp(1583823710, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDurable" : {
                                "ts" : Timestamp(1583823710, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2020-03-10T07:01:50Z"),
                        "optimeDurableDate" : ISODate("2020-03-10T07:01:50Z"),
                        "lastHeartbeat" : ISODate("2020-03-10T07:01:59.120Z"),
                        "lastHeartbeatRecv" : ISODate("2020-03-10T07:01:58.109Z"),
                        "pingMs" : NumberLong(0),
                        "syncingTo" : "mongo-1:27011",
                        "configVersion" : 1
                },
                {
                        "_id" : 3,
                        "name" : "mongo-3:27013",
                        "health" : 1,
                        "state" : 2,
                        "stateStr" : "SECONDARY",
                        "uptime" : 261,
                        "optime" : {
                                "ts" : Timestamp(1583823710, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDurable" : {
                                "ts" : Timestamp(1583823710, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2020-03-10T07:01:50Z"),
                        "optimeDurableDate" : ISODate("2020-03-10T07:01:50Z"),
                        "lastHeartbeat" : ISODate("2020-03-10T07:01:59.120Z"),
                        "lastHeartbeatRecv" : ISODate("2020-03-10T07:01:58.103Z"),
                        "pingMs" : NumberLong(0),
                        "syncingTo" : "mongo-1:27011",
                        "configVersion" : 1
                }
        ],
        "ok" : 1
}
```

## 后记

使用 docker-compose 搭建的 mongodb 副本集就完成了，以后可以基于此快速搭建一套 mongodb 副本集环境进行测试。
