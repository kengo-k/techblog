---
title: "QNAPのContainer StationにGiteaをインストールする"
date: 2025-08-01
tags: ["QNAP", "Gitea", "Git", "Container Station"]
description: "QNAPのContainer Stationを使用してGiteaをインストールし、自宅でGitサーバーを構築する手順を説明します"
keywords: ["QNAP", "Gitea", "Container Station", "Git", "自宅サーバー"]
toc: false
draft: true
---

```yaml
version: "3.7"
services:
  gitea:
    image: gitea/gitea:1.21
    container_name: gitea_web
    environment:
      - USER_UID=1000
      - USER_GID=1000
      - GITEA__database__DB_TYPE=postgres
      - GITEA__database__HOST=db:5432
      - GITEA__database__NAME=gitea
      - GITEA__database__USER=gitea
      - GITEA__database__PASSWD=gitea_password
      - GITEA__server__HTTP_PORT=80
      - GITEA__actions__ENABLED=true
      - GITEA__actions__DEFAULT_ACTIONS_URL=https://gitea.com
      - GITEA__packages__ENABLED=true
    volumes:
      - gitea_data:/data
      - /var/run/docker.sock:/var/run/docker.sock # ← この1行だけ追加
    networks:
      gitea_qnet:
        ipv4_address: 192.168.1.120
      internal_network:
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    container_name: gitea_db
    environment:
      - POSTGRES_USER=gitea
      - POSTGRES_PASSWORD=gitea_password
      - POSTGRES_DB=gitea
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal_network

networks:
  gitea_qnet:
    driver: qnet
    driver_opts:
      iface: "eth0"
    ipam:
      driver: qnet
      options:
        iface: "eth0"
      config:
        - subnet: 192.168.1.0/24
          gateway: 192.168.1.1
  internal_network:
    driver: bridge

volumes:
  gitea_data:
  postgres_data:
```

```yaml
version: "3.7"
services:
  gitea-runner:
    image: gitea/act_runner:latest
    container_name: gitea_runner
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - gitea_runner_data:/data
    environment:
      - GITEA_INSTANCE_URL=http://192.168.1.120
      - GITEA_RUNNER_REGISTRATION_TOKEN="TOKEN"
    networks:
      gitea_runner_qnet:
        ipv4_address: 192.168.1.121
    restart: unless-stopped

networks:
  gitea_runner_qnet:
    driver: qnet
    driver_opts:
      iface: "eth0" # QNAPの物理インターフェース名に合わせて変更
    ipam:
      driver: qnet
      options:
        iface: "eth0"
      config:
        - subnet: 192.168.1.0/24 # ご自宅のLANサブネットに合わせて
          gateway: 192.168.1.1 # ご自宅ルーターのIP

volumes:
  gitea_runner_data:
```
