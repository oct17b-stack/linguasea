# 配音：Azure AI Speech 语音合成

`npm run audio` 用 Azure 神经网络语音，给四门课（zh / en / ja / ko）的每个词条和每句对话生成 mp3，并写一份 manifest，让 App 找到这些文件。没有密钥时只做统计，什么都不写。

## 生成什么

- 词条：念 `spoken(item)`（有 `say` 念 `say`，否则念 `text`），语速 -10%。对话：按说话人 `a` / `b`，正常语速。同一门课里"声音 + 文字"相同的只生成一次。
- 声音表只在 `tools/src/audio/voices.ts` 一个文件里。词条和 a 用女声，b 用男声：

  | 课程 | 词条、a | b |
  |---|---|---|
  | zh | zh-CN-XiaoxiaoNeural | zh-CN-YunxiNeural |
  | en | en-US-JennyNeural | en-US-GuyNeural |
  | ja | ja-JP-NanamiNeural | ja-JP-KeitaNeural |
  | ko | ko-KR-SunHiNeural | ko-KR-InJoonNeural |

  注意：b 一律是男声，但英语的 Emma、日语的 Tanaka Yuki 是女性角色。要按角色配声音，得先在内容格式里区分说话人。
- 文件：`content/audio/<课程>/<哈希>.mp3`，格式 audio-24khz-48kbitrate-mono-mp3。哈希取 sha1(声音名, 语速, 文字, 输出格式) 的前 16 位，所以这四样改了任何一样都会生成新文件。已有的文件直接跳过，不会重复花钱。
- `content/audio/<课程>/manifest.json`：key 是 `audioKey(声音, 文字)`（如 `item|你好`、`b|不客气。`），值是 `zh/<哈希>.mp3`。key 按顺序排列，只列出文件确实存在的。
- `npm run content` 把 manifest 放进内容包的 `courses[课程].audio`。服务器在 `/audio/` 下提供 `AUDIO_DIR`（默认 `content/audio`）。App 查 `audio[audioKey('item', spoken(item))]` 或 `audio[audioKey(line.speaker, line.text)]`，再请求 `<服务器>/audio/<路径>`；查不到就用设备 TTS。

## 申请密钥（店主操作）

1. 登录 portal.azure.com，新建资源，搜 **Speech**（Azure AI 语音服务）。
2. 区域选 **Southeast Asia**（`southeastasia`）。定价层选 **S0**。F0 免费层也能用，但每分钟只允许约 20 次请求，工具会自动等待，所以会很慢。
3. 建好后打开"密钥和终结点"（Keys and Endpoint），复制 **KEY 1** 和**位置/区域**（Location/Region）。
4. 写进 `server/.env`（发音打分也用同一个密钥，可以从 `server/.env.example` 复制）：
   ```
   AZURE_SPEECH_KEY=<KEY 1>
   AZURE_SPEECH_REGION=southeastasia
   ```
   也可以设成环境变量（优先于文件），根目录的 `.env` 也会读。`.env` 不要提交。工具不会把密钥打印出来。

## 命令

```
npm run audio -- --dry-run      # 只统计：缺多少段、多少字符、估计多少钱（没有密钥时默认就是这样）
npm run audio                   # 生成缺少的音频，并更新 manifest
npm run audio -- --target zh    # 只处理中文课
npm run audio -- --prune        # 同时删掉不再用到的旧文件（可以和 --dry-run 一起用，先看会删几个）
npm run content                 # 把 manifest 打进 App 内容包
```

- 同时发 4 个请求。遇到 429 和 5xx 会自动重试（有 Retry-After 就按它等），密钥或区域不对会马上停。中途停了直接重跑就行，已生成的会跳过。
- 某门课的内容校验有问题（课文件写到一半）时，这门课不会被 prune，manifest 也只增不减，免得把还要用的音频删掉。
- 运行的机器要能直接访问 `*.tts.speech.microsoft.com`，最好在自己电脑上跑。在有代理的环境里，Node 要加 `NODE_USE_ENV_PROXY=1`，而且代理要放行这个域名。

## 费用（估算）

Azure 神经网络语音大约 **US$16 / 100 万字符**。这只是估算，以 Azure 官网价格为准。计费时每个汉字（包括日文汉字）算 2 个字符，SSML 里的 `<prosody>` 标记也算钱，`--dry-run` 显示的"billable"已经把这些算进去了。A、B 两个阶段全部写完大约 2,000 段、十几万计费字符，估计 US$2 左右，大概在 F0 每月的免费额度（约 50 万字符）之内。

## 文件放在哪

- mp3 和 `manifest.json` 都在 `content/audio/<课程>/`。建议一起提交 git：文件按内容哈希命名，每段只有几 KB，这样打包和服务器用的是同一套文件。以后改用 CDN 时，上传这个目录就行。
- 文件名就是哈希，服务器可以让客户端永久缓存（已经这样设置了）。

## 以后换成真人录音

1. 把录音放进 `content/audio/` 下，例如 `content/audio/zh/recorded/zh.ni-hao.mp3`。
2. 在词条上写 `"audio": "zh/recorded/zh.ni-hao.mp3"`（相对 `content/audio` 的路径）。
3. 运行 `npm run audio`（需要已经配置好密钥），再运行 `npm run content`。这样 manifest 里这个词条会指向录音，不再用 TTS；录音文件还没放进去时会给警告，先继续用 TTS。
4. 被替换下来的 TTS 文件，用 `--prune` 删掉。录音不会被删：prune 只删直接放在 `content/audio/<课程>/` 下、用 16 位哈希命名的 `.mp3`。

manifest 按"声音 + 文字"查找，所以同一门课里念法完全相同的词条会共用这段录音。对话句子目前还不能单独换录音。需要的话，要在内容格式里给对话句子也加 `audio` 字段，再让本工具按同样的方式处理。

某段 TTS 念得不对（比如多音字），可以给词条加 `say`，换成念法明确的写法，重跑后会生成新文件。上线前请店主自己确认一下 Microsoft 关于语音合成输出的使用条款。
