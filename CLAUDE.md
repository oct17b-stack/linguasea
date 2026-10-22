# 开发约定（给接手的开发者 / AI）

用户说中文，回复一律用中文。产品方案在 docs/PLAN.md。

## 架构要点

- **两层内容**：`content/courses/<target>/` 是目标语内容（各国共用），`content/l1/<l1>/<target>/` 是某个母语的讲解和译文。加一个国家 = 加一个 `content/l1/<l1>/`，不碰课程本身。
- `content/l1/<l1>/meta.json` 的 `released` 列出该母语已上架的课程；上架的课程每一课都必须有讲解，校验器会拦。
- **id 永远不改**：课号（`zh-A1-01`）和词条 id（`zh.ni-hao`）一旦发布就不能改，复习卡片和进度靠它。同一个词条 id 在所有课里文字和读音必须一致。
- 界面文字的 key 以泰语 `content/l1/th/ui.json` 为准，其他母语必须一一对应。
- 引擎和界面里不写死任何语言的逻辑；语言相关的东西放进内容或语言包。
- `packages/core` 必须能同时在 React Native 和 Node 里跑（不能用 node: 模块）。
- App 内容来自 `app/src/content/bundle.generated.json`（`npm run content` 生成，不提交）。以后改成按母语从 CDN 下载。

## 改完要跑

```
npm run check
```

改了 App 界面，再用网页版实际点一遍：`cd app && EXPO_OFFLINE=1 npx expo export --platform web` 后用浏览器打开 `dist/`。

## 现在的临时做法（上线前要换）

- 配音用设备自带 TTS（expo-speech），正式版换成商用授权的配音文件（内容里的 `audio` 字段）。
- 跟读是自评；发音打分接 Azure Pronunciation Assessment。
- 付费只有界面（`app/src/lib/purchases.ts`），价格是占位；接 RevenueCat 需要先在商店建好订阅商品。开发版有"测试解锁"按钮。
- 服务器用内存存储（`server/src/store.ts` 的 MemoryStore），上线前换 PostgreSQL（表结构在 `server/db/schema.sql`）。
- 泰语讲解是 AI 初稿，必须请泰语母语老师审校后才能上架。

## 安全约定

- 不提交任何密钥、签名文件、`.env`。密钥、账号、付款、商店后台由用户本人操作。
