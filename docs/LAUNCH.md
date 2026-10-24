# 上线清单：你本人要做的事

> 版本 2026-10-22。按顺序做；有几步耗时很长（标了 ⏳），要尽早开始、并行推进。
> 每一步写了**在哪里做**、**做什么**、**交给开发者什么**。费用都是估算，付款前以官网为准。
> 本仓库的隐私政策和服务条款（`docs/legal/`）**不是法律意见**：上线前请一位泰国律师审阅。

## 0. 交接规则（先看）

- **密钥、密码、私钥文件一律不要发到聊天里。** 你自己填到对应的后台：托管平台的环境变量、expo.dev、RevenueCat、App Store Connect、Google Play Console。
- 可以直接告诉开发者的（不是机密）：域名、API 网址、个人或公司名称和地址、联系邮箱、Bundle ID、商品 ID、Azure 区域名、各个后台"已经配好了"。
- 如果开发者（Claude Code 云端会话）自己要用某个密钥，例如生成配音要 `AZURE_SPEECH_KEY`、自动打包要 `EXPO_TOKEN`：在会话标题栏的云环境菜单 → **Edit**，加到 **Network secrets**（旧版叫 API credentials）或环境变量里，然后告诉开发者变量名。新开的会话才会读到。
- 拿到的私钥文件（Apple 的 `.p8`、Google 服务账号的 `.json`）存进密码管理器，只上传到需要它的后台。

## 1. 决定用个人还是公司身份，并定名称

**做什么**

| | 个人 | 公司（例如泰国注册的 บริษัทจำกัด） |
|---|---|---|
| 商店里显示的卖家名 | 你的法定姓名 | 公司名 |
| 需要 D-U-N-S 编号 | 不需要 | Apple 和 Google 都需要（免费；Apple 开发者网站有查询 / 申请工具，⏳ 可能要 1–2 周） |
| Google Play 正式发布前 | **2023-11-13 之后新建的个人账号必须先跑封闭测试：至少 12 名测试者连续参加 14 天**，然后才能申请正式发布 | 不受这条限制 |
| 收款、报税 | 个人 | 公司 |

- 品牌名：查商标和两个商店里的重名后定稿（现在的 LinguaSEA 只是代号）。
- Bundle ID / 包名：`app/app.json` 里是 `com.linguasea.app`。**在商店建好 App 以后永远不能改**；用户看不到它，所以以后改品牌也可以继续用。要换就在第 3 步之前告诉开发者。

**交给开发者**：选了个人还是公司、法定名称和地址（填法律文件）、最终品牌名、是否保留 `com.linguasea.app`。

## 2. 域名和联系邮箱

- **在哪里**：Cloudflare Registrar、Namecheap 等域名注册商。
- **做什么**：
  1. 买一个域名（.com 约 10–15 美元/年，估算）。
  2. 建联系邮箱，例如 `support@<域名>`、`privacy@<域名>`。只需要收信的话可用 Cloudflare Email Routing 免费转发到你的邮箱；要用域名发信可用 Google Workspace 等（约 7 美元起/人/月，估算）。
  3. 预留子域名 `api.<域名>` 给服务器（第 7 步指向它）。
- **交给开发者**：域名、联系邮箱。

## 3. Apple Developer Program ⏳

- **在哪里**：developer.apple.com/programs/enroll（网页或 Apple Developer App）。
- **费用**：99 美元/年。
- **做什么**：
  1. 用开了双重认证的 Apple ID 报名，选个人（Individual）或组织（Organization：要 D-U-N-S、公司网站、你有权代表公司签约）。
  2. 通过后进 App Store Connect → **Agreements, Tax, and Banking**：签 **Paid Apps** 协议，填银行账户和税表（非美国个人一般是 W-8BEN，公司是 W-8BEN-E）。协议生效前，订阅商品连沙盒都测不了。
  3. 申请 **App Store Small Business Program**（上一年收入低于 100 万美元，佣金从 30% 降到 15%）。
  4. **Apps → 新建 App**：平台 iOS，名称（见 `docs/STORE-LISTING.md`），主要语言 Thai，Bundle ID `com.linguasea.app`，SKU 随便填（如 `linguasea-ios`）。
  5. **Users and Access → Integrations**：
     - 生成一个 **In-App Purchase** 密钥（`.p8`），第 9 步上传到 RevenueCat。
     - 生成一个 **App Store Connect API** 密钥（权限按 Expo 文档的要求，一般选 Admin），第 10 步上传到 expo.dev，让 EAS 自动管理证书和提交。
     - `.p8` 只能下载一次，存进密码管理器。
  6. **Users and Access → Sandbox**：建 1–2 个沙盒测试账号（用没注册过 Apple ID 的邮箱）。
- **交给开发者**：Team ID、App 的 Apple ID（数字）、"Paid Apps 协议已生效"。这些都不是机密。

## 4. Google Play Console ⏳

- **在哪里**：play.google.com/console/signup。
- **费用**：25 美元，一次性。
- **做什么**：
  1. 注册个人或组织账号（组织要 D-U-N-S），完成身份验证；新的个人账号可能还要用 Play Console App 在一台安卓手机上验证。
  2. **设置付款资料（Payments profile / 商家账号）**：没有它不能建订阅。
  3. **新建 App**：默认语言 ไทย（th），类型 App，免费（订阅在 App 内收费）。
  4. **个人账号**：现在就开始找封闭测试的测试者，**至少 12 人，建议 15–20 人**（有人中途退出，人数掉到 12 以下可能要重新计时）。测试者需要用 Google 账号加入，并在 14 天里保持参加。
  5. **Google Cloud 服务账号**（给 RevenueCat，第 9 步用）：在关联的 Google Cloud 项目里启用 Google Play Android Developer API，建服务账号并下载 JSON 密钥；回到 Play Console → **Users and permissions** 邀请这个服务账号邮箱，给它"查看应用信息""查看财务数据""管理订单和订阅"权限。
  6. **Setup → License testing**：加入你和测试者的 Gmail，测试购买不扣钱。
- **交给开发者**：账号类型、测试者人数进展（不需要名单）。

## 5. 母语老师终审 ⏳（尽早开始，和其他步骤并行）

- **找谁**：懂泰语的目标语老师，最好四门各一位（中文、英语、日语、韩语；讲解都是泰语）。可以在 Fastwork.co、大学语言系、语言学校找。
- **审什么**：
  - 四门课 A–F 全部 720 课（含读物）：目标语是否自然、读音、泰语词义、คำอ่าน 注音、对话译文、讲解，以及 AI 口语老师的情景。
  - App 界面文字 `content/l1/th/ui.json`。
  - 泰语商店文案（`docs/STORE-LISTING.md`）和泰语法律文件的语言是否通顺（法律内容由律师看）。
- **给老师的材料**：开发者运行 `npm run review:sheet`，把 `content/_review/sheets/<课程>-th.csv`（每门课一个表格，Excel / Google 表格直接打开，最后一列写意见）和 `content/_review/` 里该课程的审校备注交给老师。做法和先后顺序见 `content/_review/README.md`。
- **怎么交付**：老师在表格的 `comment` 列写意见或改好的文字；开发者改回内容、跑校验，并在备注里记下决定。
- **费用**：请老师报价，按小时或按课（估算 ฿300–1,000/小时；每门课通读一遍约 40–60 小时）。
- 内容是 AI 初稿加 AI 审校，**没经母语老师审完的课程不能上架**。

## 6. Microsoft Azure 语音服务和 Anthropic（AI 口语老师）

### 6.1 Microsoft Azure 语音服务

- **在哪里**：portal.azure.com（先注册 Azure 账号，要绑信用卡）。
- **做什么**：
  1. 新建资源，搜 **Speech**（Azure AI 语音服务）；区域 **Southeast Asia**（`southeastasia`，在新加坡，隐私政策是按新加坡写的）；定价层 **S0**（F0 免费层只适合测试，速度和用量都有限）。
  2. 打开 **Keys and Endpoint**，复制 **KEY 1** 和区域名。
  3. KEY 1 只填到托管平台的 `AZURE_SPEECH_KEY`（第 7 步）；要开发者生成配音，按第 0 节放进 Claude Code 环境变量（详细见 `docs/AUDIO.md`）。
  4. **不要**打开任何"音频日志 / audio logging"之类的设置：隐私政策承诺录音不被保存。
  5. **Cost Management → Budgets**：设一个月度预算提醒（例如 50 美元）。
  6. 确认一下 Microsoft 关于语音合成输出（生成的配音）商业使用的条款。
- **用途**：发音打分、把给 AI 老师的语音回答转成文字（服务器），以及生成课程配音（`npm run audio`）。
- **费用（估算）**：发音评估按实时语音识别计费，约 1 美元/音频小时起（可能另有发音评估附加费，以 Azure 价格页为准），一次打分 3–8 秒约 0.1–0.2 美分。默认每天免费用户 10 次、付费用户 200 次；一个付费用户每天都用满 200 次，一个月约 8–13 美元，所以要看实际用量，必要时调低 `PRONUNCIATION_PREMIUM_PER_DAY`。生成配音约 16 美元/百万字符：四门课 A–F 全部约 39,400 段、约 213 万计费字符，一次性约 35 美元（`npm run audio -- --dry-run` 会算出当时的准确数字）。
- **交给开发者**：区域名 `southeastasia`、"Key 已填到服务器"。

### 6.2 Anthropic（AI 口语老师）

- **在哪里**：Anthropic 控制台（platform.claude.com 或 console.anthropic.com）。
- **做什么**：
  1. 用个人或公司身份注册组织，在 Billing 里绑卡或预充值。
  2. 在用量 / Limits 设置里设**每月花费上限**和提醒（先保守，例如 50–100 美元，看实际用量再调）。
  3. 新建一个 API key，只填到托管平台的 `ANTHROPIC_API_KEY`（第 7 步）。它是机密：不要发到聊天里，也不能放进 App（不能加 `EXPO_PUBLIC_` 前缀）。
  4. **核对 Anthropic 当前的数据保留条款**：API 的输入和输出保存多久、是否用于训练。隐私政策写的是"不用于训练，只保留有限时间"；如果条款和这句话不一致，告诉开发者改隐私政策。
  5. 可选的服务器变量：`TUTOR_MODEL`（默认 `claude-opus-5-5`）、`TUTOR_FREE_PER_DAY`、`TUTOR_PREMIUM_PER_DAY`（每天的对话轮数，默认值见 `server/.env.example`，现在是 6 和 30）。
- **用途**：AI 口语老师。学习者的回答（服务器先把邮箱和电话打码）、老师之前的回复和单元场景发给 Anthropic 生成下一轮回复；服务器不保存对话。
- **费用（估算，2026-10 的价格）**：默认模型 Claude Opus 5.5 每百万 token 输入 4 美元、输出 20 美元，缓存读取 0.20 美元。一轮大约 3,000 个输入 token（大部分是可缓存的单元场景）和 500–1,000 个输出 token，约 0.01–0.03 美元。免费用户每天最多 6 轮，约 0.06–0.18 美元/天；付费用户每天最多 30 轮，约 0.3–0.9 美元/天，天天用满的话一个月约 9–27 美元，可能超过月费。所以要设花费上限、上线后看实际平均用量；要降成本可以调低 `TUTOR_*_PER_DAY`，或者由你决定用 `TUTOR_MODEL` 换更便宜的模型（每百万 token：Claude Sonnet 5.5 输入 2 美元 / 输出 10 美元，Claude Haiku 5.5 输入 0.10 美元 / 输出 0.50 美元），换之前请开发者先比较对话质量。
- **交给开发者**："Anthropic 已配好"、花费上限是多少、保留条款已核对。

## 7. 数据库和 API 服务器（新加坡）

### 7.1 PostgreSQL

- **在哪里**：任选一家有新加坡区域的托管 PostgreSQL，例如 Neon、Supabase、DigitalOcean Managed PostgreSQL（SGP1）、AWS RDS（ap-southeast-1）、Google Cloud SQL（asia-southeast1）。最好和 API 服务器同一家、同一区域。
- **做什么**：
  1. 建数据库，区域选新加坡。
  2. 打开**自动每日备份，备份保留不超过 30 天**（隐私政策写了"删除的数据 30 天内从备份中消失"）；确认有静态加密（encryption at rest）。
  3. 复制连接串，例如 `postgres://用户:密码@主机:5432/linguasea?sslmode=require`，只填到托管平台的 `DATABASE_URL`。服务器启动时会自己建表，不用手动建。
- **费用**：小规模约 0–25 美元/月（估算；生产环境建议用带自动备份的付费档）。

### 7.2 API 服务器（Docker）

- **在哪里**：任选一家能跑 Docker、有新加坡区域的平台，例如 Fly.io（sin）、Render（Singapore）、Railway、DigitalOcean App Platform（SGP）、Google Cloud Run（asia-southeast1）。
- **做什么**：
  1. 连接 GitHub 仓库，用根目录的 `Dockerfile` 部署（镜像里已经装了发音打分要用的 ffmpeg）。内存建议 512 MB 以上。
  2. 按文末"环境变量总表"填服务器的环境变量。
  3. 绑定自定义域名 `api.<域名>`，开启 HTTPS（平台一般自动签证书）；健康检查路径 `/health`。
  4. **日志保存不超过 90 天**（隐私政策写的是"最多 90 天"）。
  5. 部署后检查：`https://api.<域名>/health` 返回 `{"ok":true}`；`https://api.<域名>/legal/privacy-th.html` 能打开。
- **费用**：约 5–25 美元/月起（估算）。
- **交给开发者**：托管平台和数据库供应商的名称（要写进隐私政策）、API 网址 `https://api.<域名>`。

### 7.3 网页版（`/app/`）和邮箱登录

同一个 Docker 镜像里已经打包了网页版 App：部署后 `https://api.<域名>/app/` 就是网页版，和手机 App 用同一套账号、进度和订阅。用户在设置里用邮箱登录（收一封 6 位验证码邮件，10 分钟内有效），在 iPhone、安卓、网页上登录同一个邮箱，进度会合并、订阅通用。

- **网页版的打包参数**：托管平台的 **Docker build arguments**（不是运行时的环境变量）里填：
  - `EXPO_PUBLIC_API_URL` = `https://api.<域名>`（网页版调用的服务器，就是它自己所在的网址）
  - `EXPO_PUBLIC_REVENUECAT_WEB_KEY` = 第 13.1 步的 Web Billing 公开 key（不填时网页版不能购买，其他功能正常）
  - 改了这两个值要重新打包镜像才生效。
- **发验证码邮件（Resend）**：
  1. 在 resend.com 注册；**Domains** → 添加发信域名（建议用子域名，例如 `mail.<域名>`），按提示把 DNS 记录（SPF、DKIM 等）加到域名服务商，等状态变成 Verified。
  2. **API Keys** → 新建，权限选 Sending access，只填到托管平台的 `RESEND_API_KEY`。
  3. 托管平台填 `MAIL_FROM`，例如 `LinguaSEA <login@mail.<域名>>`（域名必须是第 1 步验证过的）。
  4. 两个都没填时：正式环境（`NODE_ENV=production`，镜像默认如此）邮箱登录会关闭（返回 503）；开发环境把验证码打印在服务器日志里（`[mail] login code for …`）。
  5. 部署后检查：打开 `https://api.<域名>/app/`，用自己的邮箱登录一次，确认能收到泰语验证码邮件（看一下垃圾邮件箱）。
- **费用**：Resend 免费档每月几千封（估算，以官网为准），起步够用。
- **隐私政策**：现在会收集邮箱，并通过 Resend 发邮件、网页版通过 Stripe 收款：上线前按 `docs/legal/README.md` 的"什么时候要更新"把这两家服务商和"邮箱"写进隐私政策。
- **交给开发者**："Resend 已配好"和发信地址（不是机密）。

## 8. 法律文件：填占位符 + 律师审阅 ⏳

- **做什么**：
  1. `docs/legal/README.md` 列了所有占位符（英文版是 `[TBD: …]`，泰文版是 `[รอกรอก: …]`）：法定名称、地址、联系邮箱、DPO（没有就删掉那一行）、生效日期、托管和数据库供应商、管辖法院。把这些信息发给开发者（不是机密），开发者替换后重新生成网页。
  2. 请一位泰国律师审阅隐私政策、服务条款和删除数据页，重点问：
     - PDPA：法律依据、跨境传输（新加坡、美国）、是否需要任命 DPO；
     - 未满 20 岁用户（泰国法律的未成年人）购买订阅需要监护人同意的写法；
     - 责任限制是否符合《不公平合同条款法》；管辖法院怎么写；
     - AI 老师：把学习者的回答发给 Anthropic（美国）的告知方式和法律依据（合同履行，加上 App 内的同意界面）；
     - 《计算机犯罪法》第 26 条（保存通信记录至少 90 天）是否适用于我们；如果适用，服务器日志要保存满 90 天，政策里"最多 90 天"也要改。
  3. 律师意见交给开发者修改。
- **费用**：请律师报价。
- **交给开发者**：占位符的内容、律师的修改意见。

## 9. RevenueCat（订阅管理）

- **在哪里**：app.revenuecat.com。
- **费用**：每月追踪收入 2,500 美元以下免费，超过后按收入的 1% 收费（估算）。
- **做什么**：
  1. 新建 Project（例如 LinguaSEA）。
  2. **加 App Store App**：Bundle ID `com.linguasea.app`；上传第 3 步的 In-App Purchase 密钥（`.p8`、Key ID、Issuer ID）。把 RevenueCat 给的 **Apple Server Notification URL** 填到 App Store Connect → 你的 App → App Information → **App Store Server Notifications**（Production 和 Sandbox 都填，选 Version 2）。
  3. **加 Play Store App**：包名 `com.linguasea.app`；上传第 4 步的服务账号 JSON（新凭证最长约 36 小时才生效）；按 RevenueCat 提示连接 Google 实时开发者通知（它会给一个 Pub/Sub 主题名，填到 Play Console → Monetization setup → **Real-time developer notifications**，再点发送测试通知）。
  4. **API keys**：复制两个 **Public app-specific** key：Apple 的（`appl_` 开头）和 Google 的（`goog_` 开头），第 10 步填到 EAS。**不要使用、也不要外传 Secret key（`sk_` 开头）**，我们用不到。
  5. **Webhook**（Project → Integrations → Webhooks → 新建）：
     - URL：`https://api.<域名>/v1/webhooks/revenuecat`
     - Authorization header value：自己用密码管理器生成一串 40 位以上的随机字符，写成 `Bearer 随机字符`；**同一个值**原样填到服务器环境变量 `REVENUECAT_WEBHOOK_AUTH`（两边必须一字不差，包括 `Bearer` 和空格）。
     - 环境：Production 和 Sandbox 都发（App 审核员用沙盒购买，也要能解锁）。
     - 事件：全部。
     - 点"发送测试事件"：服务器应该返回 200。
  6. Project settings 里的恢复购买行为保持默认 **Transfer to new App User ID**（用户重装或换手机后点"恢复购买"，订阅会转到新账号）。
  7. 商品、Entitlement、Offering 等第 11、12 步建好商店商品后再配（第 13 步）。
- **交给开发者**："RevenueCat 已配好"。

## 10. Expo / EAS（打包）

- **在哪里**：expo.dev。
- **费用**：免费版每月 15 次 iOS + 15 次安卓构建（排队较慢）；Starter 约 19 美元/月（估算）。
- **做什么**：
  1. 注册账号（可建一个组织）。让开发者能打包：把开发者的 Expo 账号加为组织成员，或在 Account settings → **Access tokens** 生成一个 token，按第 0 节作为 `EXPO_TOKEN` 放进 Claude Code 环境变量（或 GitHub Actions 的 secrets）。
  2. 项目 → **Environment variables**，环境选 production（和 preview），添加：
     - `EXPO_PUBLIC_API_URL` = `https://api.<域名>`
     - `EXPO_PUBLIC_REVENUECAT_IOS_KEY` = RevenueCat 的 `appl_…`
     - `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` = RevenueCat 的 `goog_…`

     可见性选 Plain text 或 Sensitive。**`EXPO_PUBLIC_` 开头的变量会被编进安装包，任何人都能读出来**，所以只能放这种本来就公开的值；Azure Key、Anthropic API key、数据库连接串等机密绝不能加 `EXPO_PUBLIC_` 前缀。
  3. 项目 → **Credentials**：iOS 上传第 3 步的 App Store Connect API 密钥，让 EAS 自动管理证书；安卓签名密钥由第一次构建时 EAS 生成并保管（建议下载一份备份存进密码管理器）。
  4. 开发者打出第一个安卓包（`.aab`）后，**第一次要你在 Play Console 手动上传**到 Internal testing（Google 的限制），之后可以用 EAS Submit 自动提交。
- **交给开发者**：Expo 账号或组织名、"环境变量已填"。

## 11. App Store Connect：订阅商品

- **在哪里**：App Store Connect → 你的 App → **Monetization → Subscriptions**。
- **做什么**：
  1. 新建订阅组 `LinguaSEA Premium`（两个商品放在同一组，用户可以在月付、年付之间切换）。
  2. 新建两个自动续订商品，**ID 必须完全一致**：
     - `linguasea_premium_monthly`：时长 1 个月。
     - `linguasea_premium_yearly`：时长 1 年；**Introductory Offers → Free，1 week（7 天）**，所有地区，新用户。
  3. 价格：以泰国为基准地区定价（`docs/PLAN.md` 的建议：月付约 ฿199–249，年付约 ฿1,290–1,690），最终由你决定；其他地区让 Apple 自动换算。
  4. 本地化（泰语、英语）的显示名和说明见 `docs/STORE-LISTING.md` 第 1.5 节；每个商品还要上传一张付费墙截图供审核。
  5. 第一次提交审核时，在版本页面的 In-App Purchases and Subscriptions 区域把这两个商品一起提交。
- **交给开发者**："商品已建好"、定好的价格（不是机密）。

## 12. Google Play：订阅商品

- **在哪里**：Play Console → 你的 App → **Monetize → Products → Subscriptions**。
- **前提**：第 10 步的安卓包已经上传到 Internal testing（安装包里带 Google Play 结算库，Play 才让你建订阅）。
- **做什么**：
  1. 新建订阅 `linguasea_premium_monthly`，加 base plan，ID `monthly`，自动续订，1 个月，定价，激活。
  2. 新建订阅 `linguasea_premium_yearly`，加 base plan，ID `yearly`，自动续订，1 年，定价，激活；再 **Add offer**：offer ID 例如 `free-trial-7d`，资格选 New customer acquisition，阶段选 Free trial 7 天，激活。
- **交给开发者**："订阅已建好"、base plan ID（`monthly` / `yearly`）。

## 13. RevenueCat：商品、Entitlement、Offering

- **在哪里**：RevenueCat → 你的 Project。
- **做什么**：
  1. **Products**：导入或添加 4 个商品：iOS 的 `linguasea_premium_monthly`、`linguasea_premium_yearly`；Android 的 `linguasea_premium_monthly:monthly`、`linguasea_premium_yearly:yearly`。
  2. **Entitlements**：新建 identifier **`premium`**，把 4 个商品都挂上。
  3. **Offerings**：新建 identifier **`default`** 并设为 Current；加两个 package：**Monthly**（`$rc_monthly`，挂两个平台的月付商品）和 **Annual**（`$rc_annual`，挂两个平台的年付商品）。
- 名字必须和 App 代码一致（`premium`、`default`、上面的商品 ID）。
- **交给开发者**："RevenueCat 商品已配好"，开发者用沙盒测一遍购买。

### 13.1 网页版收款：Stripe + RevenueCat Web Billing

网页版的订阅也由 RevenueCat 管理（RevenueCat Web Billing，背后用 Stripe 收款），所以网页上买的会员在手机上同样有效，反过来也一样（前提是用户在两边登录同一个邮箱）。这些都要你本人做：

1. **Stripe**（dashboard.stripe.com）：用第 1 步定下的个人或公司身份注册账号，国家选泰国；完成身份验证、填收款银行账户（⏳ 审核可能要几天）。
2. **RevenueCat → Project → Apps → 新建 Web Billing（RevenueCat Billing）App**：按提示**连接 Stripe 账号**；填公司名、客服邮箱、默认币种 THB 等付款页信息。
3. **Products**：在这个 Web Billing App 里新建两个订阅商品（月付、年付，泰铢定价，例如 `linguasea_premium_monthly_web`、`linguasea_premium_yearly_web`），挂到 Entitlement **`premium`**，再加到 Offering **`default`** 的 **Monthly** 和 **Annual** 两个 package 里（和第 13 步同一个 Offering）。
4. **API keys**：复制 Web Billing App 的 **Public API key**（`rcb_` 开头，可以公开），填到第 7.3 步的 Docker build argument `EXPO_PUBLIC_REVENUECAT_WEB_KEY`（不需要加到 EAS）。
5. 先用 RevenueCat / Stripe 的**沙盒（Sandbox / test mode）**在网页版买一次，确认手机 App 登录同一邮箱后也解锁；再切到正式。
- **费用**：Stripe 按每笔交易收手续费（泰国卡约 3–4%，估算，以 Stripe 官网为准）；RevenueCat 对 Web Billing 的收费以官网为准。
- **交给开发者**："Stripe 和 Web Billing 已配好"、两个 web 商品 ID。

## 14. 商店资料

- 按 `docs/STORE-LISTING.md` 填：名称、副标题、描述、关键词、截图、分类、年龄分级、Apple App Privacy、Google Data safety、目标受众、广告声明、审核备注、隐私政策 / 支持 / 删除数据网址。
- 截图要用正式版和审校过的课程内容。

## 15. 测试

- **iOS**：开发者用 EAS 打包并提交到 TestFlight，你在 App Store Connect 把测试者加进去。
- **安卓**：Internal testing 先自己测；**个人账号**再开 Closed testing，邀请 12 名以上测试者，**连续 14 天**，满了以后在 Dashboard 申请正式发布（Production access），要回答一些关于测试的问题。
- 一起测这些：
  - 第一次打开、选语言、学完一课；重装或换手机后点"恢复购买"能恢复订阅；
  - 允许和拒绝麦克风两种情况下的跟读和发音打分；
  - 每日提醒能按时出现；
  - 沙盒 / 测试账号购买 → 解锁 B 阶段；取消后到期失效；年付有 7 天试用；
  - 设置 → 删除我的数据：成功后再打开 App 是全新状态；
  - AI 老师：第一次使用前出现同意界面（写明 Anthropic 和发送的内容）；不同意时其他功能照常；打字和说话都能回答；免费账号每天用到上限后有提示；举报不当回复能发到客服邮箱；
  - 断网时还能继续学；
  - 付费墙和设置页的隐私政策、服务条款链接都能打开；付费墙只写已经上线的功能。

## 16. 提交审核、发布

- **Apple**：版本页面选好构建、附上两个订阅商品、填审核信息（`docs/STORE-LISTING.md` 第 7 节）、出口合规选"只用标准加密（豁免）"；发布方式建议选"审核通过后手动发布"；**销售地区先只选泰国**。审核通常 1–3 天（估算）。
- **Google**：Production → 新建发布，国家 / 地区先只选泰国。新 App 的审核可能要几天到一周以上（估算）。

## 环境变量总表

完整清单以 `server/.env.example` 为准。

**服务器**（托管平台的环境变量 / Secrets）

| 变量 | 必填 | 填什么 | 机密 |
|---|---|---|---|
| `DATABASE_URL` | 是 | 第 7.1 步的连接串（带 `?sslmode=require`） | 是 |
| `AZURE_SPEECH_KEY` | 是 | 第 6 步的 KEY 1 | 是 |
| `AZURE_SPEECH_REGION` | 是 | `southeastasia` | 否 |
| `REVENUECAT_WEBHOOK_AUTH` | 是 | 和 RevenueCat webhook 的 Authorization header value 一字不差 | 是 |
| `PORT` | 一般不用填 | 很多平台会自动设置；默认 8080 | 否 |
| `AUDIO_DIR` | 一般不用填 | 默认用镜像里的 `content/audio`；音频放在别处（例如挂载的磁盘）时才填路径 | 否 |
| `PRONUNCIATION_FREE_PER_DAY`、`PRONUNCIATION_PREMIUM_PER_DAY` | 可选 | 每天的发音打分次数（默认 10 / 200） | 否 |
| `RESEND_API_KEY` | 是（要邮箱登录） | 第 7.3 步 Resend 的 API key；不填则正式环境的邮箱登录关闭 | 是 |
| `MAIL_FROM` | 是（要邮箱登录） | 发信地址，例如 `LinguaSEA <login@mail.<域名>>`，域名要在 Resend 验证过 | 否 |
| `WEB_DIR` | 不用填 | 网页版文件夹；Docker 镜像里已设为 `/srv/web`，本地默认 `app/dist`（文件夹不存在就不提供网页版） | 否 |
| `CONTENT_DIR`、`PUBLIC_DIR` | 不用填 | 用默认值 | 否 |
| `ANTHROPIC_API_KEY` | 是 | 第 6.2 步的 API key（不填则 AI 老师关闭） | 是 |
| `TUTOR_MODEL`、`TUTOR_FREE_PER_DAY`、`TUTOR_PREMIUM_PER_DAY` | 可选 | AI 老师的模型（默认 `claude-opus-5-5`）和每天的对话轮数（默认 6 / 30） | 否 |

**App**（expo.dev → 项目 → Environment variables，production 和 preview）

| 变量 | 填什么 | 说明 |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://api.<域名>` | 会编进 App，不是机密 |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | RevenueCat 的 `appl_…` | 公开 key |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | RevenueCat 的 `goog_…` | 公开 key |

**网页版**（托管平台的 Docker build arguments，见第 7.3 步）

| 变量 | 填什么 | 说明 |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://api.<域名>` | 网页版所在的服务器本身 |
| `EXPO_PUBLIC_REVENUECAT_WEB_KEY` | RevenueCat Web Billing 的 `rcb_…` | 公开 key；不填则网页版不能购买 |

## 费用汇总（估算，付款前核实）

| 项目 | 费用 |
|---|---|
| Apple Developer Program | 99 美元/年 |
| Google Play Console | 25 美元，一次性 |
| D-U-N-S（公司账号） | 免费 |
| 域名 | 约 10–15 美元/年 |
| 邮箱 | 转发免费；Google Workspace 约 7 美元起/人/月 |
| Expo EAS | 免费版可起步；Starter 约 19 美元/月 |
| API 服务器 | 约 5–25 美元/月 |
| PostgreSQL | 约 0–25 美元/月 |
| Azure 语音 | 发音打分约 1 美元/音频小时；配音一次性约 35 美元（四门课全部）；先设预算提醒 |
| Anthropic（AI 老师） | 默认模型每轮约 0.01–0.03 美元；先设每月花费上限 |
| RevenueCat | 月收入 2,500 美元以下免费，超过收 1% |
| Resend（验证码邮件） | 免费档起步（估算） |
| Stripe（网页版收款） | 每笔约 3–4%（估算） |
| 商店佣金 | Apple 小企业计划 15%；Google 订阅 15% |
| 泰语审校、泰国律师 | 按报价 |

## 上线以后

- 收到隐私请求（删除、查看、导出数据）：按 `docs/legal/README.md`"收到隐私请求怎么办"处理，30 天内回复。
- 每月看一次 Azure、Anthropic、托管、数据库的账单和 RevenueCat 收入；AI 老师的花费和用户数一起看。
- 收到 AI 回复的举报邮件：按 `docs/legal/README.md`"收到隐私请求怎么办"第 6 条处理。
- 加新功能、换服务商或服务器地区之前，先看 `docs/legal/README.md` 的"什么时候要更新"。
