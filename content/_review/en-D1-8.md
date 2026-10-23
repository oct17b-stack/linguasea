# 英语课 D1–D8（D 阶段，A2+）审校备注

AI 初稿：D 阶段 1–8 单元，48 课 + 16 篇读物（en-D1-01 … en-D8-r02），写完后按审校标准逐课通读、改过一遍。词条全部照抄 content/_plan/en-CF.json（id、文字、读音、kind 一字未改），没有新增词条；`npm run validate -- --target en --only 'en-D[1-8]-'` 通过，`npm run dupes -- --target en` 无重复。读音、转写、泰语称呼按 content/_review/en.md 的约定（美式 IPA、虚词弱读、th 一律写 ธ；译文不用 ครับ/ค่ะ；Nam 自称 ฉัน，与 Emma 互称 เธอ；Mr. Brown 等男性自称 ผม；第三人称女性用 เขา）。对话和读物只用 A–C 阶段（磁盘上的课和大纲）、D 阶段前面各课的词条和语法，另加最基本的虚词。下面是例外和需要母语老师（英语 / 泰语）或规划确认的地方。

## 还没作为词条教过的词

- [en-D3-04] Is it possible to …? / Would it be possible to …?：possible 到 [en-F12-04] 才是词条，可它就是本课大纲的语法点，照大纲用了。 ✅ resolved: 保留。课文只在本课语法句型里用，讲解有说明，属于"本课语法点可用"的例外。
- [en-D3-06] There seems to be a problem with …：seem 到 [en-E16-05] 才是词条，同样是本课大纲的语法点。 ✅ resolved: 同上，保留。
- [en-D6-05] Nowhere. I stayed home all day.：nowhere 是本课语法点（somewhere / anywhere / nowhere / everywhere）之一，但大纲词条只有 anywhere、somewhere、everywhere，讲解里说明了。要不要补成词条？ ✅ resolved: 不补。它是本课语法点，讲解专门讲了；本课已有 5 个词条，和大纲一致。
- [en-D3-04] [en-D4-01] [en-D4-02] anything else：else 在整个课程里都不是词条，三处都是 Do you need anything else? 这类固定说法。 ✅ resolved: 保留。else 是基本虚词，只出现在固定说法里，泰语译文已表明意思。
- [en-D3-r01] [en-D4-04] [en-D4-r01] Dear Nam, / Dear Ms. Clark, / Dear Mr. Davis,：dear 到 [en-F2-01] 才是词条，可邮件开头离不开；[en-D4-04] 的讲解 "Dear …" 说明了用法。 ✅ resolved: 保留（书信固定开头，译文 เรียน 一看就懂）。
- [en-D5-01] [en-D7-02] [en-D7-03] [en-D7-04] [en-D8-02] [en-D8-03] [en-D8-05] Ha!：感叹词，没教过，泰语译作 ฮ่า ๆ。 ✅ resolved: 保留，感叹词。
- [en-D5-03] I'll empty it now.（洗碗机）：empty 学过形容词，这里第一次当动词用。 ✅ resolved: 保留，母语者就这样说，译文 เอาออก 已表明意思。
- 专有名词：Mount Fuji、Tokyo、Kyoto、Osaka、Hanoi、Indonesia、Malaysia、Krabi、Sukhothai、Ayutthaya、Laos、Phuket、Singapore、Toronto、Europe、North America、khao soi，人名 Jen Taylor、Kate、Mark Davis、Susan Clark、Pim Suwan、Ken Chai、Anna、Paul、Jake、Jess、Mrs. Lee。en-US 配音可能读不准 khao soi（ˈkaʊ ˈsɔɪ）、Sukhothai、Phuket（puːˈkɛt）、Suwan（ˈsuːwɑːn）。 ✅ resolved: 专有名词可以用。Ken Chai 改名 Nick Tan（[en-D16-r01] 另有一个普吉酒店前台 Ken）；[en-D7-06] 去掉了 Toronto。配音问题并入文末待确认的一条。

## 人物和情景（请和 C 阶段、D9–D16 以及中、日、韩课的作者核对）

- [en-D5-01] 按协调人的要求交代了 Emma 成为室友：两人一起搬进一套两室的公寓（Two bedrooms and a big kitchen!），Nam 说以前的房间太小、邻居太吵（接 [en-C9-r02]），导语写明 น้ำกับเอ็มม่าย้ายมาอยู่อพาร์ตเมนต์สองห้องนอนด้วยกัน。[en-D13-03]、[en-D13-r01] 的合租公寓和这里一致。 ✅ resolved: 已核对，一致。
- [en-D1-r02] [en-D2-01] [en-D2-r01] [en-D2-06] Nam 第一次出国：春天和家人去日本（东京看樱花、坐新干线去京都），从大阪回曼谷时航班晚点三小时、改了登机口、Nam 的行李没到（后来送到家），爸爸在新干线上丢了帽子（后来寄回曼谷）。当时 Emma 在越南河内旅行（[en-D2-05]、[en-D2-r01]）。请和 [en-D13-03]（在日本遇到小地震）核对。 ✅ resolved: [en-D13-03] "When I was in Japan, there was a small earthquake during my trip" 和这次旅行一致。行李和帽子都送到"家里"：Nam 平时租房住（[en-C9]），这次是全家回曼谷的家，所以 [en-D2-06]、[en-D2-r01] 统一写 our house（家里的房子）。
- [en-D1-04] Nam 的父母趁学校放假去越南一周（蜜月也去过越南）；Emma 的爸爸去日本出差，"去过十次"。都是新加的细节。 ✅ resolved: 和 A–C 不冲突（Emma 的爸爸在 A–C 只出现过送袜子、寄巧克力）。
- [en-D1-01] Emma 说 I want to visit more foreign countries in Asia（原稿是 before I go home，和 [en-C4-02] 她打算留在泰国冲突，已改）。 ✅ resolved: 保留现在的写法。
- [en-D3] 清迈之行定在 5 月 9 日（星期五）到 11 日（星期日），利用 Nam 周五没课（[en-C3-06]）；Fah 另外出发、后到（[en-D3-01] She's on her way）。[en-D3-r01] 的日期和星期按 2025 年对应，正文没写年份。 ✅ resolved: 课程的"现在"是 2026 年（en.md 故事设定），改成 2026 年的星期五 5 月 8 日到星期日 5 月 10 日，阅读题选项同步。
- [en-D4] 实习：曼谷的 Blue Sky Travel（总部在新加坡）市场部，夏天（六月）。上司 Mark Davis（英国人，市场部主管）、组长 Kate、销售主管 Pim Suwan、人事 Ken Chai、普吉 Palm Hotel 的 Susan Clark 都是一次性角色。[en-D4-r01] June 20th 同样按 2025 年是星期五。请确认 D14（买电脑）等单元没有和实习冲突的设定。 ✅ resolved: June 20th 改为 2026 年的星期五 June 19th；人事改名 Nick Tan。[en-F1-05]、[en-F1-06]（实习时做视频、推荐人 Mr. Davis）和这里一致，没发现冲突。
- [en-D4-r01] Nam 请假去帮外婆搬到"小一点的房子"；[en-D7-r01] 说外婆仍住在河边的村子里。两处不冲突（在村里换房子），请确认。 ✅ resolved: [en-D7-06] 外公外婆都健在、都住在村里，所以改成 My grandparents are moving to a smaller house（คุณตาคุณยาย），理解为在同一个村子里换小房子。
- [en-D7-01] [en-D7-06] [en-D7-r01] Nam 的外公外婆（ตายาย）住在乡下河边的村子，Nam 小时候每年四月去住，和表兄弟姐妹在河边玩。因为 [en-C11-03] 说 Nam 小时候不会游泳，D7-01 只写 play by the river。[en-D9-r01] 的 grandfather 译作 คุณตา，一致。 ✅ resolved: 已核对 [en-A5-04]、[en-C1-04]、[en-C4-01]，一致。
- [en-D7-01] [en-D7-04] [en-D7-06] [en-D7-r02] Mr. Brown 的童年：在加拿大一个小村子附近的农场长大，有一个哥哥（泰语译作 พี่ชาย），母亲后来搬到多伦多（和 [en-C10-r02] "母亲住在加拿大"不冲突），家里已经没有农场了。请和 [en-C16-r02]（2011 年在加拿大当会计）及 E、F 阶段核对。 ✅ resolved: [en-D7-01] 原来说 in a small village，和 [en-D7-r02]、[en-E11-01]（生在农场）不一致，改成 I grew up in the countryside in Canada, near a small village.；[en-D7-06] 母亲改为搬去 a big city（不点名 Toronto，免得和 Emma 的家乡设定混淆）；[en-C16] 是成年后的工作，不冲突。
- Emma 的兄弟：[en-A5-06] [en-A8-03] 泰语译作 พี่ชาย（哥哥，已婚），[en-C8-02] [en-D9-r02] 译作 น้องชาย（弟弟）。D1–D8 避开了：[en-D5-04] They let us watch movies 译作 ให้ฉันกับพี่น้อง，[en-D7-05] 写成和爸爸在雪地里玩。请统一 Emma 有几个兄弟、是哥哥还是弟弟。 ✅ resolved: 协调人已定：一个哥哥（已婚）和一个弟弟（打冰球）。D1–D8 没有单独提到哪一个，ฉันกับพี่น้อง 正好合适。
- [en-D8-04] Emma 的好友 Jess 写成 a friend I met at school in Canada，没写多伦多：[en-D9-r02] 说 Emma 家乡是小镇，[en-C12-r02] 写的是在多伦多过圣诞，这里不再加深矛盾。 ✅ resolved: 协调人已定 Emma 来自加拿大小镇（不是多伦多）；这里不用改。[en-C12-r02] 的矛盾见报告。
- [en-D8-r01] Emma 的外貌按 [en-A11-06] 写 long blond hair；身份没写成学生（[en-C4-02] 说她毕业后在曼谷工作），只写 She's from Canada / We met at university（和 [en-D16-01] 大一认识一致）。 ✅ resolved: 一致。
- [en-D5-05] 派对后留下外套的是 Kate（D4 实习的组长），不是 Ploy：因为 [en-D8-01] Emma 还没见过 Ploy（I want to meet Ploy），到 [en-D8-05] 的派对才认识。 ✅ resolved: 前提不对：C 阶段 Emma 早就认识 Ploy（[en-C4-05]、[en-C8-04]、[en-C13-03]、[en-C13-r01] 还给她办了惊喜派对、[en-C15-02]）。[en-D5-05] 改回 Ploy（正好接 [en-C8-04] "She always forgets things!"）；[en-D8-01] 改成两人一起聊快来参加派对的 Ploy，[en-D8-03] Emma 不再问 Ploy 是不是开朗，[en-D8-05] 改成派对上"又见到 Ploy"、第一次认识 Top。
- [en-D6-04] Emma 卖二手相机的朋友叫 Jake（原稿 Tom，和 [en-D9-01]–[en-D9-05] 的英国人 Tom、[en-A3-06] 的 Tom 撞名，已改）。 ✅ resolved: 保留 Jake。
- [en-D8-03] Top 是 Nam 的朋友（沿用 [en-C3-r02]），送她一本教人放松的书作生日礼物；Ploy 送的项链上有个小太阳。[en-D8-06] Fah 星期天来公寓玩，"嫉妒"Emma 能和姐姐住在一起，是玩笑话。 ✅ resolved: 没有冲突。
- [en-D5-r02] Mr. Brown 的英语课和加拿大的学生一起做了家务小调查：人数和数字都是虚构的（各 50 人、泰国学生每周做家务 4 小时、加拿大 5 小时、70% 的泰国学生说妈妈洗衣服）。可以吗？ ✅ resolved: 可以，是班级小调查；把 In Thai homes / In Canadian homes 改成 In the Thai/Canadian students' homes，不像全国统计。
- [en-D3-r02] 两条住客评价是虚构的；Anna（英国人）说 The staff were very helpful 是英式主谓一致，因为在她的引语里，保留了。 ✅ resolved: 保留。

## 需要核实的事实

- [en-D1-01] Thai people don't need a visa for Japan.：泰国护照短期去日本免签（15 天以内，2013 年起）。政策如有变化要改。 ✅ resolved: 已核实，2013 年 7 月起泰国护照短期赴日（15 天以内）免签，现在仍有效。
- [en-D1-05] Bangkok–Sukhothai about seven hours by bus：一般 6–7 小时。[en-D1-r02] 东京到京都坐新干线约两小时（实际两小时十几分钟）。 ✅ resolved: 都合理。
- [en-D2-01] 从大阪起飞晚点三小时、晚上 11 点到曼谷：大阪–曼谷约 6 小时，时差 2 小时（[en-D2-r01] Japan is only two hours ahead of Thailand），时间对得上。 ✅ resolved: 已核对（日本时间 19 点起飞，泰国时间 23 点落地）。
- [en-D1-r01] 旅行博主 Jen Taylor 去过 50 个国家、印尼爬火山、马来西亚丛林：虚构人物。[en-D3] 清迈 River View Hotel 的房价（单人间每晚 800 铢、双人间 1,200 铢）和各项服务也是虚构的。 ✅ resolved: 可以。

## 写法

- [en-D6-04] change your mind：大纲读音是弱读 ˌtʃeɪndʒ jər ˈmaɪnd；对话里只出现 I changed my mind / she changed her mind。A–B 约定句中 your 写 jʊr（[en-D9-16] 备注里 yourself 也有同样问题），全课要不要统一？ ✅ resolved: 按 en.md 约定（your 写 jʊr，不写 jər）改成 ˌtʃeɪndʒ jʊr ˈmaɪnd（这个 id 只在本课用）。
- [en-D4-r01] [en-D6-06] [en-D8-02] [en-D8-r01] 连词 / 关系代词 that 写弱读 ðət（I agree that you should…、so cheap that I…、a girl that loves…、happy that she's…），指示代词 that 写 ðæt。en.md 没明说，请确认；[en-D6-06]、[en-D8-02] 的讲解写了"ออกเสียงเบา ๆ ว่า เธิท"。 ✅ resolved: 保留（连词、关系代词 that 的正常读法就是 ðət）。
- [en-D3-05] What time does breakfast start? 等 wh- 问句里的助动词 does 不标重音（dʌz），和 do/does 用全元音但不重读的约定一致。 ✅ resolved: 符合 en.md 约定。
- [en-D3-r01] [en-D4-r01] [en-D6-r02] 等邮件、短信的称呼和落款（Dear Nam, / Hi, Nam, / Best regards, Nam）各算一句，TTS 会读出来。读物里的引号 text 保留、reading 不写（同 C 阶段）。 ✅ resolved: 可以，符合 en.md（句子读音不带引号）。
- [en-D4-04] [en-D4-r01] Nam 写给客户和上司的邮件，泰语译文用 ดิฉัน（书面正式语气），对话里仍用 ฉัน。可以吗？ ✅ resolved: 可以。正式邮件用 ดิฉัน 是自然的书面语气。
- [en-D6-r01] "OK. Can I use it for a new pair of shoes today?" she said.：问句后面用 said，因为 ask 后面才教。 ✅ resolved: 可以，叙述里 she said 跟在问句后也很常见。
- [en-D6-06] a two-year guarantee：美式更常说 warranty，按大纲词条用 guarantee；reading 写 ə ˌtuː ˌjɪr ˌɡærənˈtiː，同 C 阶段 a ten-minute walk 的写法。 ✅ resolved: 保留 guarantee；讲解补了一句"เครื่องใช้ไฟฟ้า คนอเมริกันมักพูดว่า warranty"。
- [en-D7-06] any more：大纲写成两个词，美式通常写 anymore，讲解里说明了。 ✅ resolved: 保留。
- [en-D5-r01] We take turns cleaning…、[en-D4-r02] on his team、[en-D4-05] on vacation、[en-D5-03] trash：都用美式说法。 ✅ resolved: 好。

## 近义词的泰语词义（请泰语老师确认能区分）

- [en-D7-02] the dark = ความมืด, ที่มืด (ต้องมี the เสมอ) / [en-D13-r01] darkness = ความมืด：两个词条词义几乎一样，建议 D13 的作者给 darkness 加个说明。 ✅ resolved: 本课的词义已带括号说明；darkness 那边交给 D13 的审校（已写进报告）。
- [en-D3-05] pool = สระน้ำ, พูล (คำสั้น ๆ ของ swimming pool) / [en-B12-06] swimming pool = สระว่ายน้ำ / [en-B8-r01] pond = บ่อน้ำ, สระน้ำ。 ✅ resolved: pool 改为 พูล, สระ (คำสั้น ๆ ของ swimming pool)，不再和 pond 共用 สระน้ำ。
- [en-D8-04] close friend = เพื่อนที่สนิทกัน (มีได้หลายคน) / [en-B16-05] best friend = เพื่อนสนิท；[en-D7-02] be afraid of = กลัว… (ตามด้วยสิ่งที่กลัว) / [en-B5-04] scared = กลัว；[en-D6-02] department store = ห้างสรรพสินค้า (ร้านใหญ่ที่มีหลายแผนก) / [en-B14-01] mall = ห้าง, ศูนย์การค้า（讲解说明了区别）。 ✅ resolved: 都能区分。另外为了和全课其他词条分开，改了 dish（เมนู, อาหารแต่ละจาน，≠ food อาหาร）、view（วิวที่มองเห็นจากจุดหนึ่ง，≠ scenery）、in the end、deal with、let、grow up、extremely 的词义（加用法说明）。
- [en-D5-03] trash = ขยะ / [en-D12-r01] litter；[en-D7-01] countryside = ชนบท, ต่างจังหวัด / [en-E14-05] rural = ชนบท（rural 是形容词，建议 E14 写成 แบบชนบท 之类）。 ✅ resolved: 本课这边可以区分；rural 交给 E14 的审校。

## 转写

- [en-D8-01] shy ชาย、[en-D1-03] try ทราย、[en-D3-r01] non-smoking นอน สโมคกิ้ง：转写恰好拼成泰语词（ชาย 男、ทราย 沙、นอน 睡），不粗俗，但请泰语老师看会不会误读。[en-D3-r02] rude รู้ด 看起来像 รู้（知道），同样请确认。 ✅ resolved: try ทราย 和 [en-B2-05] Can I try it on? 的 ทราย 一致，shy ชาย 和 my มาย、fly ฟลาย 同一写法，rude รู้ด 和 food ฟู้ด 同一写法，都保留；non-smoking 改为 น็อน สโมกกิ้ง（和 not น็อท 一致，也不再是"睡"）。拼成泰语词的写法统一放进文末待确认的一条。
- [en-D6-01] loose ลูส 和 [en-C5-04] lose ลูส 转写相同（泰文无法区分词尾 s / z），讲解 "loose กับ lose" 专门说明了。 ✅ resolved: 按 en.md 约定 s 照拼写写 ส，两个词都是 ลูส，讲解说明了；[en-D8-04] close friend / close（关）同理，讲解原来说"ไม่ใช่ โคลซ"，和 [en-A9-03] Close your book. 的 โคลส 矛盾，已改成同样的说明。
- [en-D3-05] buffet 按美式读音转写 เบอะเฟย์（同 [en-B10-01] café แคเฟย์），不用泰语外来词 บุฟเฟต์；讲解说明了读音。 ✅ resolved: 保留（词尾 eɪ 写 เ-ย์），讲解里的读音也统一成 เบอะ-เฟย์。

## 第二轮审校后仍需母语老师确认的

- [en-D1-01] [en-D1-03] [en-D1-05] [en-D1-06] [en-D4-01] [en-D4-03] [en-D4-r02] [en-D5-05] [en-D8-01] 专名 Ayutthaya、Laos、khao soi、Sukhothai、Phuket、Pim Suwan、Ploy：生成配音后请母语者听一遍，en-US 配音读不对的改写或单独录音。
- [en-D1-03] [en-D8-01] [en-D7-03] [en-D3-06] [en-D8-r01] [en-D3-r02] 转写 ทราย（try，泰语"沙子"）、ชาย（shy，"男"）、ซีก（seek，"半边"）、ลีก（leak，"联赛"）、โจก（joke）、รู้ด（rude，像 รู้）：都是按 en.md 规则写的，恰好和泰语词同形。请泰语老师看学习者会不会读错；不行就告诉我们改成例外写法。

## 第二轮审校

- 本轮按 en.md 三审约定统一了 D1–D8 全部 64 个文件：句中 to 在元音前也写 tə，our 写 aʊər，your 写 jʊr；短语末尾 of 写 ʌv（be afraid of、head of），and 写 ənd（hide and seek、lost and found）；介词 into 不重读（ɪntə）。转写按规则改了词尾辅音（k ก、p ป、-st สต์、-kt กต์、-rt ร์ต、c/z ซ）、ɔːr 写 -อร์（store สตอร์）、非重读词尾 -i/-o 的声调符号（วอลเคโน่、บัฟฟาโล่、พอลิซี่、เอเลเมนทรี่）。
- 本轮定下的转写细则（后面阶段照用）：同一个词沿用 A–C 已有写法（staff สแตฟ、business บิซเนส、new นู、second เซคันด์、know โนว์、photo โฟโต้、never/ever เนเวอร์/เอเวอร์、try ทราย）；已通用的外来词保留（พาสปอร์ต、บอร์ดดิ้ง พาส、เปอร์เซ็นต์、รีเซ็ปชั่น、ดีเลย์ด、ดีพาร์ตเมนท์、ออฟฟิศ、เซอร์วิส）；词首非重读 rɪ-、prɪ-、dɪ- 写 ริ/พริ/ดิ（ริซีท receipt、ริเมมเบอร์、ริการ์ดส์、ริพอร์ต、พริเทนด์、ดิพาร์เชอร์ departure、ดิลิเวอรี่），已通用的 รีเซ็ปชั่น、ดีเลย์ด、ดีพาร์ตเมนท์ 例外；ɪk-/ɪɡ- 开头写 เอ็กซ์/เอ็ก（เอ็กซอสทิด，同 excited）；ɛ 和 eɪ 要分开时 ɛ 加 ็（seller เซ็ลเลอร์ ≠ sale เซล）；拼成泰语词的能换就换（non-smoking น็อน，不写 นอน）。
- 日期：课程的"现在"是 2026 年，课文里写了星期和日期的按 2026 年日历：[en-D3-r01] 5 月 8 日（五）到 10 日（日），[en-D4-r01] 6 月 19 日（五）。
- Nam（a，女）：第一次出国是 2026 年春天和爸爸妈妈、Fah 去日本（东京看樱花、去神社给 Emma 买礼物、看到富士山、坐新干线去京都），从大阪回国时航班晚点三小时、换登机口，晚上 11 点到曼谷，行李晚一班到、送到家里，全家开自家车（停在机场远处的停车场）凌晨两点到家，爸爸在新干线上丢的帽子后来寄回曼谷（D1-r02、D2）；到 D1 为止只出过一次国，没去过老挝，去过素可泰两次（去年和班上同学，坐七小时大巴，骑车逛古城）；没见过雪和沙漠，没进过大山洞，没吃过昆虫（D1）。
- Nam：5 月 8–10 日和 Fah 去清迈，住 River View Hotel 305 号房（双人大床房每晚 1,200 铢，空调漏水后换房）（D3）；6 月在 Blue Sky Travel 曼谷办公室（总部新加坡）市场部实习，上司 Mark Davis（英国人，市场部主管），组长 Kate，销售主管 Pim Suwan，人事 Nick Tan，客户是普吉 Palm Hotel 的 Susan Clark；6 月 19 日请假帮外公外婆搬到同村一栋小一点的房子（D4）。
- Nam：之后和 Emma 合租两室公寓；Nam 做晚饭、熨衣服（打工要穿制服），Emma 洗碗、周六洗衣服，拖地两人轮流；邻居 Mrs. Lee 去度假时 Nam 帮她喂猫；派对后 Ploy 把外套落在她们家（D5）。Nam 小时候父母很严：每个周末要打扫房间、平日不许看电视、房间乱就扣零花钱、从不让她熬夜（D5-04）。
- Nam 的童年（D7）：在曼谷长大，妈妈每天送她走路去幼儿园，第一个记忆是在幼儿园哭；大约六岁时和爸爸在公园放风筝、荡秋千；每年四月去乡下河边村子的外公外婆家住，和表兄弟姐妹在河边玩、捉迷藏，表兄弟姐妹晚上讲鬼故事；小时候怕黑、怕鬼、怕打针，现在不怕黑但从不看鬼片；玩娃娃时假装娃娃是她的学生；周六早上看动画片；小学上课爱说话，在同学作业上画过猫；小时候常和 Fah 吵架，现在是好朋友；幼儿园的朋友搬去了清迈，一直保持联系。外公外婆现在仍住在村里（村里有了新路和商店）；外婆小时候村里没电，用油灯，家里有稻田和两头水牛（D7-r01）。
- Nam 的性格和喜好（D8）：和陌生人在一起害羞；放假时爱睡懒觉（她周末上午要打工，所以不写"星期天"）；最喜欢的颜色是绿色，但不太爱冒险；最佩服的人是妈妈。妈妈很有耐心，学生都喜欢她；爸爸不算有耐心，但很沉稳，从不发火；Fah 自信、爱认识新朋友、有点吵，会把 Nam 带回家的零食吃光，羡慕 Emma 能和姐姐住在一起。
- Nam 的朋友（D8）：Ploy（同班，C 阶段起 Emma 就认识）有趣、外向、善良、开朗、很有幽默感，送 Nam 一条带小太阳的项链作生日礼物；Top 比较严肃但随和，有点安静、挺害羞，上个月在五十个人面前唱过卡拉 OK，送 Nam 一本教人放松的书作生日礼物；Emma 在 D8-05 的派对上第一次见到 Top。
- Emma（c，女）：到 D1 去过 12 个国家、三个大洲（北美、欧洲、亚洲），坐大巴过境去过马来西亚两次，没去过老挝和大城（D1）；手机在柬埔寨的夜班车上被偷（D2-02）；Nam 去日本时她在越南河内旅行，第一天迷路、打车遇上高峰期堵车（D2-05）；爸爸常去日本出差（去过十次）（D1-04）；小时候父母给零花钱但要她洗碗，周六让孩子们看电影到 11 点，每年冬天和爸爸玩雪，上学第一天哭了一早上（D5-04、D7-05）；自称在厨房里什么都做不好（妈妈说她"危险"），有点乱、有点马虎，打碎过 Nam 的一只玻璃杯（D8-06、D8-r01）；在加拿大最好的朋友是同班同学 Jess（D8-04）；大学里认识 Nam，现在是室友（D8-r01）。
- Mr. Brown（b，男）：吃过昆虫（清迈的市场），最爱 khao soi，坐飞机去过清迈三次，榴莲只吃过一次（D1-03）；去年十二月回加拿大时第一程晚点，在东京错过转机，航空公司给了酒店券，等了二十小时（D2-04）；在加拿大乡下一个小村子附近的农场长大：家里有奶牛、鸡和一座红色谷仓，每天五点起来喂牛，十二岁起夏天和爸爸开拖拉机，秋天全家帮忙收割，冬天孩子们在谷仓里玩（D7-r02）；小时候冒雪走路上学、怕床底下有怪物、不喜欢看医生、不吃蔬菜（现在很爱吃），有很多玩具车，学校旁有个大操场，爱玩捉迷藏；小时候天天和哥哥（พี่ชาย）吵架，十几岁以后成了好朋友；和大部分同学失去联系；家里现在没有农场了，妈妈搬去了一座大城市（D7）。
- 一次性人物（后面不要当固定角色）：旅行博主 Jen Taylor（D1-r01），酒店住客 Anna（英国）和 Paul（美国）（D3-r02），Susan Clark、Pim Suwan、Nick Tan（D4），邻居 Mrs. Lee（D5-03），Emma 卖二手相机的朋友 Jake（D6-04），Emma 在加拿大的朋友 Jess（D8-04）。Kate 和 Mark Davis 是 Nam 实习时的同事和上司（[en-F1-06] 还提到 Mr. Davis）。
