# 下一步备忘（给店主和接手的 AI）

> 2026-10-25 写。接手的 AI：先读本文件，再读 docs/HANDOVER.md 和 docs/ROADMAP.md。代码在 GitHub 仓库 `panchitamuangpasi-cell/test` 的分支 `claude/repo-reference-0uxm8x`。

## 现在的状态（一句话）

开发全部完成：App（iOS / 安卓 / 网页同一套代码，网页版在 `<域名>/app/`）、服务器、邮箱验证码登录、四门课（中英日韩）A–F 全部内容（每门 720 课、约 230 小时，AI 写 + AI 审两轮）。`npm run check` 和 `npm run e2e`（54 项）全部通过。**剩下的都是要店主本人办的账号、密钥和请人。**

## 店主的决定（已定）

- 先用各服务的**免费额度测试通过，再付费**。
- 要网页端（已做好）。
- 配音不等服务器部署，拿到 Azure 密钥就先跑；mp3 提交进 git。
- 密钥绝不发在聊天里，只填进云端环境设置。

## 店主要做的事（按顺序）

### 1. Azure 语音（免费层）→ 先跑配音

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

请律师审法律文件（`docs/legal/README.md` 有 4 条待确认的承诺）→ AI 部署服务器 → EAS 打包内测版装手机试用 → 满意后 Azure 改付费层跑完剩下的配音（约 US$30）→ 商店截图和资料 → 提交审核（先泰国）。完整清单：docs/LAUNCH.md、docs/ROADMAP.md。

## 给接手 AI 的提示

- 用中文回复店主；除了账号、密钥、付款、商店后台，其他决定自己做，不用问。
- 先 `npm install`、`npm run check`；改了界面跑 `npm run e2e`。约定和命令都在 CLAUDE.md。
- 跑配音的具体步骤：docs/HANDOVER.md 第 6 节、docs/AUDIO.md「先用免费层」。
- 每次改完提交并推送到上面的分支。
