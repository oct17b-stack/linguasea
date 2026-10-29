# 部署到威联通（QNAP）NAS 测试

> 2026-10-29 写。目的：上架之前，先在自己的 NAS 上把服务器和网页版跑起来，用电脑、手机实际测试；以后再给手机 App 内测版用。正式上线时可以继续用 NAS，也可以按 docs/LAUNCH.md 第 7 步换成新加坡的云服务器（数据可以搬过去，见第 8 步）。

## 会跑起来什么

一个"应用程序"里有 2 个容器（第 5 步再加 1 个可选的）：

| 容器 | 作用 |
|---|---|
| `db` | PostgreSQL 16 数据库：账号、进度、订阅状态。数据存在 NAS 上，重启和更新都不会丢 |
| `api` | LinguaSEA 服务器：接口、网页版 App（`/app/`）、官网和法律页、配音文件 |
| `tunnel`（可选） | Cloudflare 隧道：给服务器一个 https 网址，手机在外面也能连（第 5 步） |

镜像 `ghcr.io/oct17b-stack/linguasea:latest` 由 GitHub 自动构建（`.github/workflows/docker.yml`）：每次推送到 `main`、检查通过后自动更新，Intel/AMD（x86）和 ARM 的 NAS 都能用，NAS 上不用编译。

## 1. 准备

- QTS 5 或 QuTS hero，App Center 里装好 **Container Station**（3.x）。
- 内存：至少 2 GB 空闲（建议 NAS 总内存 4 GB 以上）；硬盘留 3 GB（镜像约 1 GB，含配音）。
- 知道 NAS 在局域网里的 IP，例如 `192.168.1.20`（控制台 → 网络与虚拟交换机，或路由器后台查）。
- **端口**：QTS 自己的管理页面默认用 8080，所以本服务器在 NAS 上用 **8090**。8090 被占用的话，把 YAML 里的 `'8090:8080'` 改成别的端口（只改冒号前面）。

## 2. 第一次：确认镜像能下载

1. 浏览器打开 https://github.com/oct17b-stack/linguasea/actions ，看 **Docker image** 这一项是绿色 ✓（第一次大约 15–30 分钟）。
2. 打开 https://github.com/oct17b-stack/linguasea/pkgs/container/linguasea 。
3. 如果页面右边显示 **Private**：点 **Package settings** → 最下面 **Change visibility** → 选 **Public** → 输入包名确认。（仓库本身是公开的，镜像里的东西和仓库一样，没有密钥。设成公开后 NAS 不用登录就能下载。）这一步只做一次。

## 3. 在 Container Station 里创建

1. 打开 Container Station → 左边 **应用程序**（Applications）→ **创建**（Create）。
2. 应用程序名称填 `linguasea`。
3. 把仓库里 [`deploy/qnap/docker-compose.yml`](../deploy/qnap/docker-compose.yml) 的全部内容复制进 YAML 框。
4. **改两处密码**：`POSTGRES_PASSWORD` 和 `DATABASE_URL` 里的 `change-this-db-password`，换成同一个自己想的密码（只用字母和数字，避免 `@ : / #` 这类符号）。
5. 点 **验证**（Validate），再点 **创建**（Create）。第一次要下载镜像，几分钟。
6. 等两个容器都显示"运行中"。`api` 第一次启动会自己建数据库表。

## 4. 检查（局域网）

在同一个 Wi-Fi 下的电脑或手机浏览器打开（把 IP 换成你 NAS 的）：

| 网址 | 应该看到 |
|---|---|
| `http://192.168.1.20:8090/health` | `{"ok":true}` |
| `http://192.168.1.20:8090/` | 官网首页 |
| `http://192.168.1.20:8090/app/` | 网页版 App：选课、上课、复习都能用，进度存在 NAS 的数据库里 |

**邮箱登录**：现在没配 Resend，验证码不会真的发邮件，而是打印在日志里：Container Station → 应用程序 `linguasea` → 容器 `api` → **日志**，找 `[mail] login code for 你的邮箱: 123456`。在另一台设备上登录同一个邮箱，可以测试多设备同步。

**局域网 http 下用不了的**：浏览器只在 https 网址下允许录音，所以发音打分、语音输入要在第 5 步的 https 网址下测；这两项和 AI 老师另外还要密钥（第 6 步），没填时 App 会显示"暂不可用"，其他功能正常。

## 5. https 网址（手机在外面也能用，录音也能用）

### 5a. 临时网址（马上能用，不用注册）

1. Container Station → 应用程序 `linguasea` → **编辑**（Edit）YAML。
2. 把 `tunnel:` 那一段 5 行前面的 `# ` 删掉（注意对齐：`tunnel:` 和上面的 `api:` 对齐）。
3. 保存并重新创建。打开容器 `tunnel` 的日志，找 `https://xxxx-xxxx.trycloudflare.com`，这就是网址：`<网址>/app/` 是网页版。
4. 这个网址**每次容器重启都会变**，只适合临时测试；知道这个网址的人都能打开（测试数据而已，但别放真实个人信息）。

### 5b. 固定网址（要做手机 App 内测版时）

手机 App 的服务器地址是打包时写进去的，必须是**固定的 https 网址**。二选一：

- **Cloudflare 命名隧道（推荐，不用开路由器端口）**：买好域名（docs/NEXT-STEPS.md 第 3 项）并把域名的 DNS 交给 Cloudflare（免费）→ Cloudflare 后台 **Zero Trust → Networks → Tunnels → Create a tunnel**（Cloudflared）→ 复制 token → 在 **Public Hostname** 加 `api.<你的域名>`，服务填 `http://api:8080`。然后 YAML 里 `tunnel` 的 `command` 换成：
  ```
  command: tunnel --no-autoupdate run --token <你的 token>
  ```
  token 只填在 NAS 上，不要发在聊天里、不要提交到 git。
- **myQNAPcloud**：QTS 里开 myQNAPcloud，得到 `xxx.myqnapcloud.com`，用它的 SSL 证书（Let's Encrypt）+ 控制台的**反向代理**把 `https://xxx.myqnapcloud.com` 转到 `localhost:8090`；路由器要把 443 端口转发到 NAS（有的宽带没有公网 IP，这时只能用 Cloudflare）。

有了固定网址以后，告诉 AI 这个网址（不是机密），它会把 App 内测版（EAS preview）的 `EXPO_PUBLIC_API_URL` 设成它，见 docs/LAUNCH.md 第 10 步。

## 6. 以后加密钥（发音打分、AI 老师、邮件、订阅）

在 YAML 的 `api` → `environment` 里把对应行前面的 `# ` 删掉、填上值，保存并重新创建。变量的意思见 docs/LAUNCH.md 的"环境变量总表"。

- 密钥**只填在 NAS 上**，不要发在聊天里、不要提交到 git。
- 填了 `RESEND_API_KEY` 和 `MAIL_FROM` 以后，把 `NODE_ENV: development` 改成 `production`：验证码就真的发邮件，不再打印在日志里。
- Azure 发音打分：NAS 要能访问 `southeastasia.stt.speech.microsoft.com`（一般家庭网络都可以）。

## 7. 更新到最新版

GitHub 上每次更新 `main` 后（约 30 分钟镜像构建好）：

1. Container Station → **映像**（Images）→ **拉取**（Pull）→ 填 `ghcr.io/oct17b-stack/linguasea:latest` → 拉取。
2. **应用程序** → `linguasea` → **重新创建**（Recreate）。

数据库在 `db` 卷里，更新不会丢数据。（会用 SSH 的话，也可以在应用程序目录里运行 `docker compose pull && docker compose up -d`。）

## 8. 备份和搬家

- **备份**：SSH 登录 NAS 后运行（容器名以 Container Station 里显示的为准）：
  ```
  docker exec linguasea-db-1 pg_dump -U linguasea linguasea > /share/Public/linguasea-$(date +%F).sql
  ```
  然后用 Hybrid Backup Sync 把这个文件备份到别处。也可以在 QTS 里定时运行。
- **搬到云服务器**：新服务器建好空数据库后 `psql <新的 DATABASE_URL> < linguasea-日期.sql`，再把 App 的服务器网址指过去。
- 隐私政策写了"删除的数据 30 天内从备份中消失"：备份文件最多留 30 天。

## 9. 常见问题

| 现象 | 处理 |
|---|---|
| 创建时提示拉取镜像 `denied` / `unauthorized` | 第 2 步把镜像设成 Public |
| 拉取提示 `no matching manifest` | NAS 是 32 位 ARM（很老的型号），不支持；换 x86 或 64 位 ARM 的 NAS |
| `api` 不停重启 | 看 `api` 日志：`password authentication failed` = 两处密码不一致；`QUOTA_TIME_ZONE: unknown time zone` = 时区写错了 |
| 打开 8090 没反应 | 换个端口试；QTS 防火墙（QuFirewall）要放行这个端口 |
| 网页版能打开但进度不同步 | 打开 `/health` 看服务器是否正常；浏览器按 F12 看是否有请求失败，把截图发给 AI |

## 10. 和正式上线的区别

NAS 测试版和正式上线用的是同一个镜像。正式上线前还要：`NODE_ENV: production` + Resend、固定域名的 https、数据库定期备份（第 8 步）、日志最多保留 90 天（Container Station 的日志设置）、NAS 断电或断网时 App 连不上服务器（App 本身离线能学，恢复后自动同步）。用户多了以后建议换成云服务器（docs/LAUNCH.md 第 7 步）。
