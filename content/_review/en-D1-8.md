# 英语课 D1–D8（D 阶段，A2+）审校备注

AI 初稿：D 阶段 1–8 单元，48 课 + 16 篇读物（en-D1-01 … en-D8-r02），写完后按审校标准逐课通读、改过一遍。词条全部照抄 content/_plan/en-CF.json（id、文字、读音、kind 一字未改），没有新增词条；`npm run validate -- --target en --only 'en-D[1-8]-'` 通过，`npm run dupes -- --target en` 无重复。读音、转写、泰语称呼按 content/_review/en.md 的约定（美式 IPA、虚词弱读、th 一律写 ธ；译文不用 ครับ/ค่ะ；Nam 自称 ฉัน，与 Emma 互称 เธอ；Mr. Brown 等男性自称 ผม；第三人称女性用 เขา）。对话和读物只用 A–C 阶段（磁盘上的课和大纲）、D 阶段前面各课的词条和语法，另加最基本的虚词。下面是例外和需要母语老师（英语 / 泰语）或规划确认的地方。

## 还没作为词条教过的词

- [en-D3-04] Is it possible to …? / Would it be possible to …?：possible 到 [en-F12-04] 才是词条，可它就是本课大纲的语法点，照大纲用了。
- [en-D3-06] There seems to be a problem with …：seem 到 [en-E16-05] 才是词条，同样是本课大纲的语法点。
- [en-D6-05] Nowhere. I stayed home all day.：nowhere 是本课语法点（somewhere / anywhere / nowhere / everywhere）之一，但大纲词条只有 anywhere、somewhere、everywhere，讲解里说明了。要不要补成词条？
- [en-D3-04] [en-D4-01] [en-D4-02] anything else：else 在整个课程里都不是词条，三处都是 Do you need anything else? 这类固定说法。
- [en-D3-r01] [en-D4-04] [en-D4-r01] Dear Nam, / Dear Ms. Clark, / Dear Mr. Davis,：dear 到 [en-F2-01] 才是词条，可邮件开头离不开；[en-D4-04] 的讲解 "Dear …" 说明了用法。
- [en-D5-01] [en-D7-02] [en-D7-03] [en-D7-04] [en-D8-02] [en-D8-03] [en-D8-05] Ha!：感叹词，没教过，泰语译作 ฮ่า ๆ。
- [en-D5-03] I'll empty it now.（洗碗机）：empty 学过形容词，这里第一次当动词用。
- 专有名词：Mount Fuji、Tokyo、Kyoto、Osaka、Hanoi、Indonesia、Malaysia、Krabi、Sukhothai、Ayutthaya、Laos、Phuket、Singapore、Toronto、Europe、North America、khao soi，人名 Jen Taylor、Kate、Mark Davis、Susan Clark、Pim Suwan、Ken Chai、Anna、Paul、Jake、Jess、Mrs. Lee。en-US 配音可能读不准 khao soi（ˈkaʊ ˈsɔɪ）、Sukhothai、Phuket（puːˈkɛt）、Suwan（ˈsuːwɑːn）。

## 人物和情景（请和 C 阶段、D9–D16 以及中、日、韩课的作者核对）

- [en-D5-01] 按协调人的要求交代了 Emma 成为室友：两人一起搬进一套两室的公寓（Two bedrooms and a big kitchen!），Nam 说以前的房间太小、邻居太吵（接 [en-C9-r02]），导语写明 น้ำกับเอ็มม่าย้ายมาอยู่อพาร์ตเมนต์สองห้องนอนด้วยกัน。[en-D13-03]、[en-D13-r01] 的合租公寓和这里一致。
- [en-D1-r02] [en-D2-01] [en-D2-r01] [en-D2-06] Nam 第一次出国：春天和家人去日本（东京看樱花、坐新干线去京都），从大阪回曼谷时航班晚点三小时、改了登机口、Nam 的行李没到（后来送到家），爸爸在新干线上丢了帽子（后来寄回曼谷）。当时 Emma 在越南河内旅行（[en-D2-05]、[en-D2-r01]）。请和 [en-D13-03]（在日本遇到小地震）核对。
- [en-D1-04] Nam 的父母趁学校放假去越南一周（蜜月也去过越南）；Emma 的爸爸去日本出差，"去过十次"。都是新加的细节。
- [en-D1-01] Emma 说 I want to visit more foreign countries in Asia（原稿是 before I go home，和 [en-C4-02] 她打算留在泰国冲突，已改）。
- [en-D3] 清迈之行定在 5 月 9 日（星期五）到 11 日（星期日），利用 Nam 周五没课（[en-C3-06]）；Fah 另外出发、后到（[en-D3-01] She's on her way）。[en-D3-r01] 的日期和星期按 2025 年对应，正文没写年份。
- [en-D4] 实习：曼谷的 Blue Sky Travel（总部在新加坡）市场部，夏天（六月）。上司 Mark Davis（英国人，市场部主管）、组长 Kate、销售主管 Pim Suwan、人事 Ken Chai、普吉 Palm Hotel 的 Susan Clark 都是一次性角色。[en-D4-r01] June 20th 同样按 2025 年是星期五。请确认 D14（买电脑）等单元没有和实习冲突的设定。
- [en-D4-r01] Nam 请假去帮外婆搬到"小一点的房子"；[en-D7-r01] 说外婆仍住在河边的村子里。两处不冲突（在村里换房子），请确认。
- [en-D7-01] [en-D7-06] [en-D7-r01] Nam 的外公外婆（ตายาย）住在乡下河边的村子，Nam 小时候每年四月去住，和表兄弟姐妹在河边玩。因为 [en-C11-03] 说 Nam 小时候不会游泳，D7-01 只写 play by the river。[en-D9-r01] 的 grandfather 译作 คุณตา，一致。
- [en-D7-01] [en-D7-04] [en-D7-06] [en-D7-r02] Mr. Brown 的童年：在加拿大一个小村子附近的农场长大，有一个哥哥（泰语译作 พี่ชาย），母亲后来搬到多伦多（和 [en-C10-r02] "母亲住在加拿大"不冲突），家里已经没有农场了。请和 [en-C16-r02]（2011 年在加拿大当会计）及 E、F 阶段核对。
- Emma 的兄弟：[en-A5-06] [en-A8-03] 泰语译作 พี่ชาย（哥哥，已婚），[en-C8-02] [en-D9-r02] 译作 น้องชาย（弟弟）。D1–D8 避开了：[en-D5-04] They let us watch movies 译作 ให้ฉันกับพี่น้อง，[en-D7-05] 写成和爸爸在雪地里玩。请统一 Emma 有几个兄弟、是哥哥还是弟弟。
- [en-D8-04] Emma 的好友 Jess 写成 a friend I met at school in Canada，没写多伦多：[en-D9-r02] 说 Emma 家乡是小镇，[en-C12-r02] 写的是在多伦多过圣诞，这里不再加深矛盾。
- [en-D8-r01] Emma 的外貌按 [en-A11-06] 写 long blond hair；身份没写成学生（[en-C4-02] 说她毕业后在曼谷工作），只写 She's from Canada / We met at university（和 [en-D16-01] 大一认识一致）。
- [en-D5-05] 派对后留下外套的是 Kate（D4 实习的组长），不是 Ploy：因为 [en-D8-01] Emma 还没见过 Ploy（I want to meet Ploy），到 [en-D8-05] 的派对才认识。
- [en-D6-04] Emma 卖二手相机的朋友叫 Jake（原稿 Tom，和 [en-D9-01]–[en-D9-05] 的英国人 Tom、[en-A3-06] 的 Tom 撞名，已改）。
- [en-D8-03] Top 是 Nam 的朋友（沿用 [en-C3-r02]），送她一本教人放松的书作生日礼物；Ploy 送的项链上有个小太阳。[en-D8-06] Fah 星期天来公寓玩，"嫉妒"Emma 能和姐姐住在一起，是玩笑话。
- [en-D5-r02] Mr. Brown 的英语课和加拿大的学生一起做了家务小调查：人数和数字都是虚构的（各 50 人、泰国学生每周做家务 4 小时、加拿大 5 小时、70% 的泰国学生说妈妈洗衣服）。可以吗？
- [en-D3-r02] 两条住客评价是虚构的；Anna（英国人）说 The staff were very helpful 是英式主谓一致，因为在她的引语里，保留了。

## 需要核实的事实

- [en-D1-01] Thai people don't need a visa for Japan.：泰国护照短期去日本免签（15 天以内，2013 年起）。政策如有变化要改。
- [en-D1-05] Bangkok–Sukhothai about seven hours by bus：一般 6–7 小时。[en-D1-r02] 东京到京都坐新干线约两小时（实际两小时十几分钟）。
- [en-D2-01] 从大阪起飞晚点三小时、晚上 11 点到曼谷：大阪–曼谷约 6 小时，时差 2 小时（[en-D2-r01] Japan is only two hours ahead of Thailand），时间对得上。
- [en-D1-r01] 旅行博主 Jen Taylor 去过 50 个国家、印尼爬火山、马来西亚丛林：虚构人物。[en-D3] 清迈 River View Hotel 的房价（单人间每晚 800 铢、双人间 1,200 铢）和各项服务也是虚构的。

## 写法

- [en-D6-04] change your mind：大纲读音是弱读 ˌtʃeɪndʒ jər ˈmaɪnd；对话里只出现 I changed my mind / she changed her mind。A–B 约定句中 your 写 jʊr（[en-D9-16] 备注里 yourself 也有同样问题），全课要不要统一？
- [en-D4-r01] [en-D6-06] [en-D8-02] [en-D8-r01] 连词 / 关系代词 that 写弱读 ðət（I agree that you should…、so cheap that I…、a girl that loves…、happy that she's…），指示代词 that 写 ðæt。en.md 没明说，请确认；[en-D6-06]、[en-D8-02] 的讲解写了"ออกเสียงเบา ๆ ว่า เธิท"。
- [en-D3-05] What time does breakfast start? 等 wh- 问句里的助动词 does 不标重音（dʌz），和 do/does 用全元音但不重读的约定一致。
- [en-D3-r01] [en-D4-r01] [en-D6-r02] 等邮件、短信的称呼和落款（Dear Nam, / Hi, Nam, / Best regards, Nam）各算一句，TTS 会读出来。读物里的引号 text 保留、reading 不写（同 C 阶段）。
- [en-D4-04] [en-D4-r01] Nam 写给客户和上司的邮件，泰语译文用 ดิฉัน（书面正式语气），对话里仍用 ฉัน。可以吗？
- [en-D6-r01] "OK. Can I use it for a new pair of shoes today?" she said.：问句后面用 said，因为 ask 后面才教。
- [en-D6-06] a two-year guarantee：美式更常说 warranty，按大纲词条用 guarantee；reading 写 ə ˌtuː ˌjɪr ˌɡærənˈtiː，同 C 阶段 a ten-minute walk 的写法。
- [en-D7-06] any more：大纲写成两个词，美式通常写 anymore，讲解里说明了。
- [en-D5-r01] We take turns cleaning…、[en-D4-r02] on his team、[en-D4-05] on vacation、[en-D5-03] trash：都用美式说法。

## 近义词的泰语词义（请泰语老师确认能区分）

- [en-D7-02] the dark = ความมืด, ที่มืด (ต้องมี the เสมอ) / [en-D13-r01] darkness = ความมืด：两个词条词义几乎一样，建议 D13 的作者给 darkness 加个说明。
- [en-D3-05] pool = สระน้ำ, พูล (คำสั้น ๆ ของ swimming pool) / [en-B12-06] swimming pool = สระว่ายน้ำ / [en-B8-r01] pond = บ่อน้ำ, สระน้ำ。
- [en-D8-04] close friend = เพื่อนที่สนิทกัน (มีได้หลายคน) / [en-B16-05] best friend = เพื่อนสนิท；[en-D7-02] be afraid of = กลัว… (ตามด้วยสิ่งที่กลัว) / [en-B5-04] scared = กลัว；[en-D6-02] department store = ห้างสรรพสินค้า (ร้านใหญ่ที่มีหลายแผนก) / [en-B14-01] mall = ห้าง, ศูนย์การค้า（讲解说明了区别）。
- [en-D5-03] trash = ขยะ / [en-D12-r01] litter；[en-D7-01] countryside = ชนบท, ต่างจังหวัด / [en-E14-05] rural = ชนบท（rural 是形容词，建议 E14 写成 แบบชนบท 之类）。

## 转写

- [en-D8-01] shy ชาย、[en-D1-03] try ทราย、[en-D3-r01] non-smoking นอน สโมคกิ้ง：转写恰好拼成泰语词（ชาย 男、ทราย 沙、นอน 睡），不粗俗，但请泰语老师看会不会误读。[en-D3-r02] rude รู้ด 看起来像 รู้（知道），同样请确认。
- [en-D6-01] loose ลูส 和 [en-C5-04] lose ลูส 转写相同（泰文无法区分词尾 s / z），讲解 "loose กับ lose" 专门说明了。
- [en-D3-05] buffet 按美式读音转写 เบอะเฟย์（同 [en-B10-01] café แคเฟย์），不用泰语外来词 บุฟเฟต์；讲解说明了读音。
