---
title: k8s正确的更新姿势
published: 2019-09-16 18:00:46
categories: DevOps
tags:
  - k8s
  - DevOps
---

## 前言

公司的 CI/CD 平台研发要告一个段落了，在此记录一下如何使用 k8s 的客户端工具 kubectl 来进行更新操作的。

## 更新 Deployment

要知道 kubectl 是不支持 update 操作的，假设有如下`Deployment.yaml`需要进行部署：

<!-- more -->

```yaml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  namespace: test
  name: hello
spec:
  selector:
    matchLabels:
      app: hello
  replicas: 1
  template:
    metadata:
      labels:
        app: hello
    spec:
      containers:
        - name: hello
          image: nginx
          imagePullPolicy: Always
          ports:
            - containerPort: 80
          env:
            - name: LOGGING_LEVEL
              value: "INFO"

---
apiVersion: v1
kind: Service
metadata:
  namespace: test
  name: hello
spec:
  selector:
    app: hello
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: ClusterIP
```

只需要执行`kubectl apply -f Deployment.yaml`即可，可以理解为 createOrUpdate 操作。

## 更新 Secret

因为测试环境和预备环境的 HTTPS 证书是使用的`letsencrypt`的免费证书
，每过一段时间都需要续签一次生成新的证书相关文件，所以每次生成完都需要更新 k8s 中对应的 secret 信息。

执行以下命令：

```
kubectl create secret tls hello \
  --namespace test \
  --key ./privkey.pem \
  --cert ./fullchain.pem \
  --dry-run \
  -o yaml \
  | \
  kubectl apply -f -
```

主要是`--dry-run`配合`-o yaml`生成对应的 yaml 文件，然后再使用`kubectl apply -f -`进行更新。

- --dry-run
  表示不会发生实际的操作，也就是不会对 k8s 产生影响
- kubectl apply -f -
  表示拿到上一个管道的输入进行执行
