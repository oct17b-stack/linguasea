# 下一步备忘（给店主和接手的 AI）

> 2026-10-25 写，2026-10-29 更新（加了威联通 NAS 测试部署，见「店主要做的事」第 0b 项和 docs/DEPLOY-QNAP.md）。接手的 AI：先读本文件，再读 docs/TEST-REPORT.md（最近一次综合测试的结果和没修的问题）、docs/HANDOVER.md 和 docs/ROADMAP.md。代码在 GitHub 仓库 `oct17b-stack/linguasea` 的 `main` 分支（2026-10-25 从 `panchitamuangpasi-cell/test` 迁来，含全部历史）。

## 现在的状态（一句话）

开发全部完成：App（iOS / 安卓 / 网页同一套代码，网页版在 `<域名>/app/`）、服务器、邮箱验证码登录、四门课（中英日韩）A–F 全部内容（每门 720 课、约 230 小时，AI 写 + AI 审两轮）。`npm run check` 全部通过；`npm run e2e` 160/160 全部通过（2026-10-29，含修 XP 同步后新加的两项）。**剩下的都是要店主本人办的账号、密钥和请人。** 2026-10-29 起可以先部署到店主的威联通 NAS 上测试（docs/DEPLOY-QNAP.md）。

**配音进度**：**四门课 A–F 配音全部生成**（39,565 段，`npm run audio -- --dry-run` 显示四门课 missing 0："Nothing missing: every clip has a file."）。经过：2026-10-25 用 Azure 免费层（F0）跑完 A、B 阶段（7,800 段、约 33 万计费字符）；2026-10-29 先用免费层跑了 C 阶段 zh / ko / ja（4,725 段、约 22.4 万）；同日店主调整了 Azure 额度后一次跑完剩下的 13 步（C en，D、E、F 各四门课），共 27,039 段、约 158.6 万计费字符（按 US$16 / 100 万约 US$25），全程没有 429 / 403，没有被额度挡住。每门课每个阶段跑完后 `npm run check` 通过、没有小于 2 KB 的 mp3（最小约 8 KB），按"配音：<课程> <阶段> 阶段（N 段）"单独提交推送。各步段数：C en 1,571；D zh 1,890、ko 1,987、ja 1,917、en 1,940；E zh 2,178、ko 2,160、ja 2,204、en 2,193；F zh 2,204、ko 2,287、ja 2,263、en 2,245。以后只改了几课时，再跑 `npm run audio`（先 `--dry-run`）只会生成改动的几段。

## 暂停时的状态（2026-10-26）

- 仓库干净，所有改动都已提交推送到 `main`。
- **已完成、已推送**：A、B 配音；综合测试和 27 个修复（docs/TEST-REPORT.md）；XP 按设备记（`Progress.xpBy`、`creditXp`，App 存档 `device`，服务器接受 `xpBy`，core 92 / server 74 项测试通过）；C–F 配音准备：给 13 个单念容易念错的词加了 `say`（zh 弹 量 朝 为 倒 涨(长 zhǎng) 知(只 zhī) 种 地 假，ja 変 表 図），`npm run validate` 通过。
- **2026-10-29 补上**：修 XP 同步后的 `npm run e2e` 重跑，160/160 通过；`npm run validate` 新加一条检查：同一门课里配音念的文字（`say`，没有就是 `text`）相同、读音不同的两个词条会报错（它们会共用一段录音，如 还 hái / huán），四门课现在都没有；AUDIO.md / HANDOVER / ROADMAP 里"b 一律男声、要先区分说话人"的过时说法改正（`c` 女声早已在用，A、B 配音也是按 a / b / c 配的）。
- **2026-10-29 威联通 NAS 部署**：`deploy/qnap/docker-compose.yml`（PostgreSQL + 服务器，NAS 端口 8090，可选 Cloudflare 隧道给 https）、`.github/workflows/docker.yml`（CI 通过后构建 amd64 + arm64 镜像推到 `ghcr.io/oct17b-stack/linguasea`）、网页版默认 `EXPO_PUBLIC_API_URL=same-origin`（调用打开它的那个网址，一个镜像到处能用）、`npm run smoke -- <网址>` 检查已部署的服务器、说明 docs/DEPLOY-QNAP.md。在云端容器里用同一份 YAML 起过整套服务：smoke 9/9、换地址访问也只调用该地址、重建容器后数据还在、验证码出现在 api 日志里（容器里的网络策略不让装 ffmpeg，本地测试镜像没装；GitHub 上构建会装）。
- **等店主**：按 docs/DEPLOY-QNAP.md 在 NAS 上部署，把网址告诉 AI。

**综合测试**：2026-10-25 把界面、引擎、服务器、内容、配音全部测了一遍，修了 27 个问题（6 个严重：网页直接输网址能绕过付费墙、时钟倒退时复习崩溃、服务器限流没生效、IP 可伪造、验证码可并发猜、中文"还"两个读音共用一段录音），单元测试 contract 24 / core 92 / server 78 / tools 37（2026-10-29），端到端 160 项。之后又修了 XP 同步丢失（两台设备离线各自得的 XP 现在会相加）。详情和没修的 12 个问题见 **docs/TEST-REPORT.md**。

## 开新会话要选 linguasea 环境

账号下有两个云端环境：**linguasea**（配好了 `AZURE_SPEECH_KEY` / `AZURE_SPEECH_REGION`，网络放行了 `southeastasia.tts.speech.microsoft.com`）和 **Default**（什么都没配）。跑配音、以后要用其他密钥的会话，新建时环境一定选 **linguasea**；在 Default 里读不到密钥、连不上 Azure（2026-10-29 就是这样）。

## 店主的决定（已定）

- 先用各服务的**免费额度测试通过，再付费**。
- 要网页端（已做好）。
- 配音不等服务器部署，拿到 Azure 密钥就先跑；mp3 提交进 git。
- A、B 用免费层测试通过后，C–F 改付费层 S0 一次跑完（2026-10-26 定）。
- 仓库已迁到 `oct17b-stack/linguasea`（Claude GitHub App 已装好，可以推送）；旧仓库 `panchitamuangpasi-cell/test` 不再用。
- 密钥绝不发在聊天里，只填进云端环境设置。

## 店主要做的事（按顺序）

### 0. Azure 额度（✅ 2026-10-29 已调整，C–F 配音已全部跑完）

以后如果改了课程内容要补配音，对 AI 说"补配音"就行；密钥、区域、云端环境设置都不用改。

### 0b. 现在：部署到威联通 NAS 测试（docs/DEPLOY-QNAP.md）

GitHub 会自动构建服务器镜像（`ghcr.io/oct17b-stack/linguasea`，x86 和 ARM 的 NAS 都能用）。按 docs/DEPLOY-QNAP.md：第一次把镜像设成 Public（第 2 步）→ Container Station → 应用程序 → 创建，粘贴 `deploy/qnap/docker-compose.yml`，改两处数据库密码 → 浏览器打开 `http://<NAS IP>:8090/app/`。要在外面用手机测、或者以后做手机内测版，按第 5 步加 https 网址（临时的不用注册；固定的要等买好域名）。部署好后把网址告诉 AI，它用 `npm run smoke -- <网址>` 从外面检查一遍。

### 1. Azure 语音（免费层）→ 先跑配音（✅ 已完成，留作参考）

1. portal.azure.com → 新建资源 → 搜 **Speech** → 区域 **Southeast Asia** → 定价层 **F0（免费）** → 建好后在"密钥和终结点"复制 **KEY 1**。
2. **用电脑**（手机 App 里环境的 Edit 点不了）打开 https://claude.ai/code → 打开任一会话 → 点顶部标题栏的环境名称 → **Edit**：
   - **Network secrets**（没有就用 Environment variables）：`AZURE_SPEECH_KEY` = KEY 1；`AZURE_SPEECH_REGION` = `southeastasia`。
   - **Network access → Allowed domains**：加 `southeastasia.tts.speech.microsoft.com`（Allow package managers 保持勾选）。
   - 保存。说明：https://code.claude.com/docs/en/cloud-environments
3. 开一个**新会话**（手机也行），对 AI 说：**"读 docs/NEXT-STEPS.md，先跑 A、B 阶段配音"**。

如果用的是别的 AI 工具（不在这个云端环境里）：把 KEY 填进本地的 `server/.env`（不要提交），在自己电脑上运行 `npm install`，然后 `npm run audio -- --stage A --stage B`（详见 docs/AUDIO.md）。

### 2. 请母语老师审课程（最耗时，越早越好）

- 找懂泰语的中文 / 英语 / 日语 / 韩语老师，各一位（Fastwork.co、大学语言系、语言学校）。
- 给老师：审校表（AI 运行 `npm run review:sheet` 生成 `content/_review/sheets/<课程>-th.csv`，Excel / Google 表格打开，最后一列写意见）+ `content/_review/README.md`。
- 老师返回表格后交给 AI：按 `lesson` / `id` 列改内容（见 content/_review/README.md）。

### 3. 品牌名、身份、域名、邮箱

- 定正式名字（查商标、商店重名），个人还是公司上架。
- 买域名，开客服邮箱。告诉 AI 后由它替换 `LinguaSEA`、`support@example.com` 和法律页的 `[TBD]` / `[รอกรอก]` 占位。

### 4. 开发者账号（审核要几天到几周）

- Apple Developer（每年 99 美元）、Google Play Console（一次 25 美元）。

### 5. 其他服务（先用免费额度；密钥都按第 1 步的方法填进环境设置）

| 服务 | 用途 | 环境变量 | 费用 |
|---|---|---|---|
| Resend | 发登录验证码邮件 | `RESEND_API_KEY`、`MAIL_FROM` | 免费额度够起步 |
| Anthropic | AI 口语老师 | `ANTHROPIC_API_KEY` | 先充 5–10 美元，设每月上限 |
| RevenueCat + Stripe | 订阅、网页收款 | 见 docs/LAUNCH.md 第 9、13.1 步 | 没收入不花钱 |
| 服务器 + PostgreSQL（新加坡） | 上线 | `DATABASE_URL` 等，见 docs/LAUNCH.md 环境变量总表 | 按平台 |

### 6. 之后

请律师审法律文件（`docs/legal/README.md` 有 4 条待确认的承诺）→ AI 部署服务器 → EAS 打包内测版装手机试用 → 商店截图和资料 → 提交审核（先泰国）。完整清单：docs/LAUNCH.md、docs/ROADMAP.md。

## 给接手 AI 的提示

- 用中文回复店主；除了账号、密钥、付款、商店后台，其他决定自己做，不用问。
- 先 `npm install`、`npm run check`；改了界面跑 `npm run e2e`。约定和命令都在 CLAUDE.md。
- 跑配音的具体步骤：docs/HANDOVER.md 第 6 节、docs/AUDIO.md「先用免费层」。
- 每次改完提交并推送到上面的仓库和分支。
- **开发这边下一步（不用等店主）**，按顺序：
  1. ✅ 重跑 `npm run e2e`：160/160（2026-10-29）。
  2. 配音：✅ 2026-10-29 四门课 A–F 配音全部生成（见上面「配音进度」，`npm run audio -- --dry-run` 缺 0）。以后改了内容只需再跑 `NODE_USE_ENV_PROXY=1 npm run audio`（先 `--dry-run`），跑完 `npm run check`，提交 `content/audio/<课程>/`。
  3. 配音里还拿不准、要人听的：中文 `zh.dei`（得 děi，zh-C2-04）单念可能被念成 dé，没有合适的同音字所以没加 `say`；对话句子里的多音字没法加 `say`。请店主或母语老师抽听。
  4. TEST-REPORT 第 6 节"低"的问题：✅ 2026-10-29 修了 4 个（调用失败退还次数、每日次数按曼谷午夜重置 `QUOTA_TIME_ZONE`、manifest 和真人录音只缓存 5 分钟、卡片 `due` 必须是 ISO 时间）。✅ 同日又做了：验证码计数改存数据库；`POST /v1/accounts` 的 IP 限流可用 `ACCOUNTS_PER_IP_PER_HOUR` 调（上线后看日志里 429 再定）。第 6 节"低"的问题只剩两个产品取舍（刷新页面课从头开始、静态目录提供点开头的文件），先不改。
  5. 拿到 RevenueCat 沙盒后核对退款、延期事件；拿到 Anthropic / Azure / Resend 密钥后各真测一次。
  6. 店主在 NAS 上部署好后：`npm run content && npm run smoke -- <NAS 网址>`（局域网 IP 从云端连不到，要用第 5 步的 https 网址）；有了固定 https 网址后，把 EAS preview 的 `EXPO_PUBLIC_API_URL` 设成它，做手机内测版（docs/LAUNCH.md 第 10 步）。✅ 2026-10-29 第一次镜像构建成功（amd64 + arm64），不登录就能拉取（镜像已经是公开的）。
