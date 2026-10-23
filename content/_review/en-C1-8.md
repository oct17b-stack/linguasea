# 英语课 C1–C8 审校备注

AI 初稿：C 阶段 1–8 单元，48 课 + 16 篇读物（en-C1-01 … en-C8-r02）。以下是拿不准、需要母语老师（英语 / 泰语）确认的地方。读音、转写、人物、泰语称呼都按 content/_review/en.md 的约定写（th 一律 ธ；Nam 自称 ฉัน，与 Emma 互称 เธอ，第三人称女性用 เขา；Mr. Brown 自称 ผม）。C1–C4 的对话和读物只用现在时和将来时（be going to 从 C4-01、will 从 C4-04 起才用），过去时从 C5 开始。

## 按协调要求替换的词条（A–B 已教过，不再重复教；对话里照常使用旧词）

- [en-C4-02] en.trip → en.visit（visit, ˈvɪzɪt）：trip 已在 [en-B6-04] 教过。visit 在整个课程（A–F 大纲和已写课文）里都没有单独教过（只有 F12 的 home visit），而 C4 大纲的例句就是 I'm going to visit my aunt.，所以用它替换。请确认。 ✅ resolved: 保留 visit（全课程没有别的 visit 词条，dupes 无重复）。大纲 content/_plan/en-CF.json 里 C4-02 仍是 en.trip，以课文为准。
- [en-C5-03] en.beach → en.speedboat（speedboat, ˈspiːdboʊt）：beach 已在 [en-B6-04] 教过；ferry 在 [en-E10-r02]、seafood 在 [en-D15-03]，所以选泰国海岛一日游常见的 speedboat（泰语外来词 สปีดโบ๊ท）。请确认。 ✅ resolved: 保留。转写按 en.md 三审规则改为 สปีดโบท（和 [en-B6-05] boat โบท 一致），讲解里仍提泰国人常写的 สปีดโบ๊ท。
- [en-C7-01] en.season / en.summer / en.winter → en.hot-season（hot season, ˈhɑːt ˌsiːzən）、en.cool-season（cool season, ˈkuːl ˌsiːzən）、en.snowy（snowy, ˈsnoʊi）：三个词已在 [en-B5-02] 教过。hot / cool season 与 [en-C7-03] 的 rainy season 成套，kind 和重音照大纲 rainy season（word，ˈ…ˌ…）写；snowy 与 sunny / rainy / windy / cloudy 成套。没选 degree（en.degree 已在 [en-E3-01] 当"学位"用）和 below zero（[en-F5-06]）。请确认。 ✅ resolved: 保留；词义 หน้าร้อนของไทย / หน้าหนาวของไทย 和 [en-B5-02] summer / winter 分得开。
- [en-C7-04] en.wet → en.sticky（sticky, ˈstɪki）：wet 已在 [en-A2-02] 教过；mosquito、slippery 分别在 [en-D12-04]、[en-D13-01]。sticky（เหนียวตัว）和 humid 配合，是泰国学生描述曼谷天气最常用的说法；读音与 [en-D15-r02] sticky rice 一致。请确认。 ✅ resolved: 保留。

## 新增词条（每课最多 1 个，已跑 npm run dupes）

- [en-C5-01] en.yesterday（ˈjɛstərdeɪ）：整个课程都没有 yesterday，但 C5 讲过去时第一课就要用（Where were you yesterday?）。请规划确认以后的单元不再另起 id。 ✅ resolved: 已查 A–F 大纲和全部已写课文，没有别的 yesterday 词条，保留。
- [en-C8-01] en.clothes（kloʊðz，泰文 โคลธส์，按 ธ 约定）：衣服单元，可全课程都没有 clothes，[en-C8-01] 和 [en-C8-r02] 都要用。读音取词典美式首列 kloʊðz，讲解说明也可读 kloʊz（โคลส์）。请确认。 ✅ resolved: 保留 kloʊðz / โคลธส์，讲解已说明两种读法。

## 大纲的读音写法（词条照抄大纲，未改）

- [en-C2-03] What's the matter?、[en-C2-06] Get well soon!、[en-C8-r01] It suits you：C–F 大纲的短语读音不抄标点，疑问词或实词有时不标重音（wʌts ðə ˈmætər；ˌɡɛt wɛl ˈsuːn），和 A–B 的约定（What's wrong? → ˈwʌts ˈrɔːŋ?）不一样。词条按要求照抄大纲，对话行按 A–B 约定写（ˈwʌts ðə ˈmætər?、ˈɡɛt ˈwɛl ˈsuːn!）。要不要统一改大纲？ ✅ resolved: 按 en.md 三审约定统一：词条 reading 不带标点（本来就没有）；疑问词和实词标重音，en.whats-the-matter 改为 ˈwʌts ðə ˈmætər（同 [en-B5-03] What's wrong? ˈwʌts ˈrɔːŋ），en.get-well-soon 改为 ˌɡɛt ˈwɛl ˈsuːn；It suits you 的 you 是代词，保留 ɪt ˈsuːts juː。这几个 id 只在本单元出现；大纲是只读文件，没改，以课文为准。
- [en-C2-r02] cover your mouth：大纲写弱读 jər，A–B 约定物主词用完整形式 jʊr。词条照抄大纲，正文里的 your 写 jʊr。请确认。 ✅ resolved: 按三审约定（your 写 jʊr，不写 jər）把词条改为 ˌkʌvər jʊr ˈmaʊθ（id 只在本课）。同理 [en-C4-r02] to-do list 按复合名词的约定改为 təˈduː ˌlɪst。

## 写法

- [en-C2-r01]、[en-C6-r02]、[en-C8-r01] 对话体读物：用叙述加引号（"…," Nam says.），text 保留引号，reading 不写引号。可以吗？ ✅ resolved: 可以，正是三审约定的做法（reading 照抄标点、不带引号）；本单元的 reading 里没有引号。
- [en-C7-02] About 35°C. / [en-C7-r02] It's about 38°C every day：degree（温度）没教，用符号 °C，reading 写 dɪˈɡriːz ˈsɛlsiəs，讲解说明 degree = องศา。可以吗？ ✅ resolved: 可以（温度的 degree 全课程没有词条，[en-E3-01] 的 degree 是"学位"）。Celsius 的词义改为 เซลเซียส (หน่วยวัดอุณหภูมิ)。
- [en-C3-04] You must not eat in the library.：大纲写 must / mustn't，美式口语很少说 mustn't，对话用 must not，讲解给出缩写 mustn't，并说明日常口语多说 You can't eat here.。请确认。 ✅ resolved: 正确，讲解的句子顺了一下。
- [en-C1-06] Three times a week: on Monday, Wednesday and Saturday.：每周固定的日子用单数（星期名复数未教，同 en.md 里 [en-B4-04] 的问题）。 ✅ resolved: 对话里保留单数（en.md 已定 [en-B4-04] 保留单数）；按 C9–C16 审校定的 C 阶段约定，海报和告示用复数，[en-C1-r01] 改为 on Wednesday evenings。音乐社的时间改为 Saturday morning，Nam 答 I work on Saturday morning（A–B 定她周末上午打工）。
- [en-C3-02] You don't have to get an A.：字母 A 在 reading 里手写 ˈeɪ。 ✅ resolved: 正确。
- 对话里用了几个没单独教过、但已在固定短语里出现的基本词：make（make noise、makes coffee；学过 Make yourself at home.）、stay（How long are you going to stay there?；学过 stay home）、give（I'll give Ploy her scarf；C5-r02 学过 give back）、I see（= 我明白了）、a lot (of)、Wow。请确认 A2 学习者可以接受。 ✅ resolved: 按 docs/CONTENT.md 新规定（课文用到却没教过的基础词，作为第 7 个词条补进它第一次出现的那课）补了三个词条：[en-C1-r01] en.around（around，əˈraʊnd）、[en-C1-r02] en.a-lot（a lot，ə ˈlɑːt，全课程 100 多处用到，A–F 都没有词条）、[en-C3-04] en.make（make，meɪk，第一次单独出现：make noise），都是全课程第一次出现的地方，dupes 无重复。stay、give 在 stay home（[en-B5-r01]）、stay here（[en-B13-04]）、Don't give up!（[en-B8-06]）、give back（[en-C5-r02]）里学过，I see 的 see 学过，Wow 是感叹词，不补。[en-C1-r01] 的 many other games 改为 many different games。
- 转写：photography 写 เฟอะทอกระฟี（按重音 pho-TOG-ra-phy，讲解专门对比 PHO-to），polite เพอะไลท์、forget เฟอร์เก็ต、attractive อะแทรกทิฟ、popular พอพิวเลอร์、similar ซิมิเลอร์ 都按美式弱读写，没用常见的 โฟโตกราฟี、โพไลท์、ฟอร์เก็ต、ป๊อปปูล่าร์。请泰语老师看会不会太陌生。 ✅ resolved: en.md 三审约定"非重读 ə 的写法不强求统一"，保留；photography 按词尾调号规则改为 เฟอะทอกระฟี่。只留下面"仍需确认"里的一条。
- [en-C2-02] back 写 แบ็ค 以区别 bag แบ็ก（[en-B2-02]），leg 写 เลก（避免 เล็ก = 小），讲解专门对比 back / bag。 ✅ resolved: 按三审规则改：词尾 k 一律写 ก，back 改为 แบ็ก（和 bag 同形，讲解改成"泰文写法一样，英语靠词尾清浊和元音长短分开"）；leg 改为 เล็ก，因为同一门课里要和 [en-C1-r02] lake เลก 分开。见下面"仍需确认"。

## 人物与事实

- [en-C1-03] My sister can play the piano, too.、[en-C1-04] 妈妈会缝纫、外婆会织毛线、[en-C2-02] Nam 每周二、四打排球（与 [en-B16-r01] sports day 打排球一致）：都不冲突固定设定，请和中、日、韩三门课确认。 ✅ resolved: 英语课 A–E 都不冲突（外婆 ยาย 和 D 阶段一致）。按 en.md「故事设定（A–B）」另改了几处：Nam 不会开车（[en-B8-05]），[en-C2-05] 的 Can I drive? / Don't drive. 改为 Can I drink coffee? / Don't drink coffee.；Nam 只在周末上午打工（[en-B1-05] 周六 8 点到中午），[en-C3-05] 班次改为 only four hours，[en-C3-06] 改为 from eight until noon，[en-C4-01] 改成周六上午上班、下午看外公外婆、周一睡懒觉；平日 8:30 上课（[en-B4-01]），[en-C3-06] 改为 from eight thirty until four；Nam 玩手机游戏（[en-A14-03]），[en-C1-02] 的 I hate playing video games. 改为 I don't like playing video games. I only play games on my phone.（hate 改用在 painting 上）。[en-C1-01] 原来说自己画画不好，和 [en-C1-05] I'm good at drawing 矛盾，删掉了 but I'm not very good。
- [en-C3-03]、[en-C4-05]、[en-C8-04] 同学 Ploy（พลอย，女）；[en-C3-r02] 读物主人公 Top（ท็อป，男）；[en-C4-02] 住在清迈的 aunt（泰语译作 ป้า）和 [en-C4-r02]、[en-C5-05] 的表妹 Bee：都是路人，不算固定角色。（原想用 Mai，泰文 ไหม 会和疑问词 ไหม 混淆，所以改用 Ploy。） ✅ resolved: 清迈的 aunt 保留 ป้า（C9–C16 审校已定：[en-A16-03] 当公务员的 อา 在曼谷，清迈的是 ป้า，[en-C16-01] 也是 ป้า）；表妹 Bee 按协调人定的设定换成表姐 Kwan（พี่ขวัญ，即 [en-E6-05] 的那位），[en-C4-r02] 不再说她从哪里来；Ploy（Nam 和 Emma 的同班同学）、Top 保留。[en-C4-05] Emma 原来请 Nam 提醒 Ploy 的生日（会把 Ploy 的生日定在 Emma 每年回加拿大的十二月、一月，和 [en-C13-r01] 两人在曼谷给 Ploy 办生日派对冲突），改为提醒她一月的泰语考试。
- [en-C4-02]、[en-C4-03] Emma 明年毕业、毕业后想在曼谷工作，十二月回加拿大过节三周（与 [en-B6-04] 一致）；[en-C8-02] Emma 有个兄弟（泰语译作 น้องชาย，英文没说长幼）。请确认不和其他课冲突。 ✅ resolved: A–B 定 Emma 19 岁（[en-A4-04]），E 阶段她还在读书（[en-E5-05] 学生贷款、[en-E12-r02] 毕业后来曼谷找工作），所以 [en-C4-02] 改为 No, I'm not. I have two more years. Then I'm going to work abroad.；I'm not going to go home to Canada.（容易理解成不回家过节，和 [en-C4-03] 矛盾）改为 I'm not going to work in Canada.；结尾 Then you can visit my family in Bangkok!（Emma 本来就住在曼谷）改为 Then I can practice my English with you every day!；[en-C4-03] my last semester → the next semester，This time next year, I'm going to work in Bangkok! → I'm going to travel around Asia!；[en-C4-06] go to Canada and visit Emma → go to Canada with Emma。[en-C8-02] 按协调人的设定改为 my younger brother（泰语 น้องชาย，和 [en-D9-r02]、[en-E6-03] 一致）。
- [en-C5-06] That's right. I came to Bangkok in 2012…：给 Mr. Brown 加了"2012 年来曼谷"的背景，用来练 in + 年份。可以吗？ ✅ resolved: 保留，[en-C10-r02]、[en-C16-r02] 已沿用（2011 年在加拿大当会计，2012 年来曼谷）。
- [en-C6-03] 泰国最高的山在清迈（对话没提 Doi Inthanon 的名字）、It's the coldest place in Thailand、Ping River 是清迈最大的河：请核实说法。 ✅ resolved: 核实无误：因他暖山（2,565 米）在清迈府，山顶是泰国最冷的地方；ปิง 河是清迈的主要河流。
- [en-C6-02] In September, the sea is more dangerous.（普吉西南季风期浪大）、[en-C6-r01] Phuket is the biggest island in Thailand, and it's the most popular place for beach vacations.：普吉是最大岛属实，"最受欢迎"是概括说法。请确认。 ✅ resolved: 普吉岛约 543 平方公里，是泰国最大的岛；"最受欢迎"作概括可以。安达曼海 5–10 月西南季风期浪大，原句 more dangerous 没有比较对象，改为 Sometimes. In September, it's more dangerous than in December.
- [en-C5-r01] Ayutthaya was the capital of Thailand for more than four hundred years. / it took two hours：1350–1767 年约 417 年，曼谷到大城坐火车约 1.5–2 小时。用 Thailand 而不说 Siam，可以吗？ ✅ resolved: 说法正确；A2 读物用 Thailand 不用 Siam 可以接受（泰语译文也写 ไทย）。
- [en-C7-01] 热季 From March to May、[en-C7-03] 讲解里雨季约 5–10 月：按常见的简化说法写。请确认。 ✅ resolved: 泰国气象厅的划分是热季约 2 月中—5 月中、雨季约 5 月中—10 月中，课文的说法是常见的简化，可以。

## 近义词的泰语词义（请泰语老师确认能区分）

- [en-C7-05] definitely = แน่ ๆ, อย่างแน่นอน，和 [en-A1-06] Sure. = ได้สิ, แน่นอน 意思接近。 ✅ resolved: A–B 已把 Sure. 改为 ได้สิ, ได้เลย；definitely 补了"(มั่นใจมาก)"。
- [en-C5-01] awful = แย่สุด ๆ, ห่วยมาก；[en-A15-01] terrible 还没写，写的时候请避开相同词义。[en-C5-05] have fun = สนุกกัน, ได้สนุก；[en-A14-04] fun 也还没写。 ✅ resolved: terrible 写的是 แย่มาก、fun 写的是 สนุก，都分得开。
- [en-C3-04] noise = เสียงรบกวน (คำนาม) / [en-C6-01] noisy = เสียงดัง, หนวกหู；[en-C1-06] join = เข้า (ชมรม, กลุ่ม), สมัครเป็นสมาชิก / [en-C3-03] attend = เข้าเรียน, เข้าร่วม (ชั้นเรียน, การประชุม)；[en-C3-04] return = คืน (ของที่ยืมมา), กลับมา / [en-C5-r02] give back = เอาของคืนให้เจ้าของ；[en-C7-01] hot season = หน้าร้อนของไทย / [en-B5-02] summer = ฤดูร้อน。 ✅ resolved: 都分得开，`npm run dupes -- --target en --meanings` 为零。另外改了几处和旧词条容易混的：exam 加"(ครั้งใหญ่ เช่น สอบกลางภาค)"（[en-B16-06] test 是 การสอบ, แบบทดสอบ）；What's the matter? 改为 เป็นอะไรหรือเปล่า (ถามด้วยความเป็นห่วง)（原来和 [en-B13-04] What's the problem? 共用 มีปัญหาอะไร）；lovely 改为 น่าชื่นใจ, งดงาม (ใช้ชมได้ทั่วไป)（原来的 ดีมาก 和 great 重合）；pleasant 加"(อากาศ, บรรยากาศ)"；dangerous 加"(คำคุณศัพท์)"（和 [en-B12-03] danger 分开）。

## 仍需母语老师确认的

- [转写] [en-C1-05] photography เฟอะทอกระฟี่、[en-C8-r02] polite เพอะไลท์：非重读 ə 写成 เ-อะ，A–B 同类的词写 อะ 型（จะแพน、พะลีซ）。请泰语老师看哪种学习者读起来更顺。
- [en-C2-02] leg 转写 เล็ก（为了和 [en-C1-r02] lake เลก 分开），和泰语"小"同形；back 转写 แบ็ก，和 [en-B2-02] bag 同形（讲解说明了）。请泰语老师看是否可以；如果 bag 按 A2 的"浊辅音前元音长"写成 แบก，两个词就能分开。
- [en-C3-04] make 的词义写 ทำ (ให้เกิดขึ้น), ชง (กาแฟ)：本课用在 make noise，读物 [en-C3-r02] 用在 makes coffee。请泰语老师看是否简洁清楚。

## 第二轮审校

- 范围：C1–C8 全部 64 个文件逐句核对，脚本查了课程顺序里的超纲词、语法顺序（过去时、will、比较级）、词条在全课的用法、弱读、转写规则、近义词义和课数结构。`npm run validate -- --target en --only 'en-C[1-8]-'`、`npm run dupes -- --target en`、`npm run dupes -- --target en --meanings` 都通过。
- 本单元定下的 Nam 的事实（后面的课请对照）：
  - 住处和日程：C1–C8 仍和家人住在曼谷（C9 才搬出去）；这学期（[en-C3-06]）周一到周四 8:30–16:00 有课，12–13 点午休，下课后和周五在图书馆学习（和 [en-B4-02]、[en-B16-06] 一致；B4-02 说"下午在图书馆"，可理解为别的学期）；周末上午 8 点到中午在餐厅打工，平时当服务员，有时在厨房，工资不高但喜欢这份工作；Mr. Brown 来餐厅吃过饭（周日上午）。
  - 爱好和能力：最爱拍照（拍食物和花），喜欢画画、画得好（在社团招新会上给学长看过自己的画），会弹吉他，不会下国际象棋，会缝纫，不会织毛线，不会玩滑板（害怕）；不喜欢电子游戏，只玩手机游戏，不介意玩桌游，讨厌画水彩（太难）。参加了大学摄影社（每周五晚上活动，每月两次去公园拍照，第一次外出去湖边拍日落）；音乐社每周一、周三和周六上午练习，周六上午和打工冲突所以没参加；每周二、四打排球。
  - 学习：这学期修英语、历史、数学、科学（所有学生都要修数学和科学），最喜欢历史，不喜欢数学；Mr. Brown 的英语考试在下周一上午 9 点、5 号教室，考第 1–5 章，周四下午可以去他办公室问问题。
  - 健康：感冒过（头痛、喉咙痛、发烧、咳嗽）；对药物不过敏。
  - 家人：外婆会织毛线，妈妈会缝纫，Fah 会弹钢琴；长周末周六下午和家人去看外公外婆；坐火车去清迈看 ป้า（aunt）；表姐 Kwan（พี่ขวัญ）来家里住过一个周末，Nam 做了她最爱吃的菜，两人周日去了游乐园；和 Fah 去听过一场很糟的演唱会、在家看过一部悲伤的电影（Fah 哭了）、去过博物馆看 19 世纪曼谷的老照片、周六晚上看过一部太长的音乐剧；和家人坐火车去大城一日游。
  - 通勤：平时坐公交，下雨淹水时坐轻轨（BTS/MRT），有一次坐船去上课。
  - 志向：想像父母一样当老师、喜欢英语（[en-C4-06] 原来说 an English teacher, like my parents，会把父母定成英语老师，固定设定只说是老师，已改），希望在曼谷找到工作，当老师前想先出国旅行，有钱了想和 Emma 一起去加拿大。最喜欢的颜色可以是绿色（[en-C8-r01] Green is your color，和 [en-D8-r02] 一致）。
- Emma 的事实：天天画画、爱画水彩、会弹钢琴（不会弹吉他）、会下国际象棋、会玩滑板、玩电子游戏；得过流感；还有两年毕业，毕业后想出国工作（也许在泰国），不打算在加拿大工作；每年十二月回加拿大三周（晚上 11:30 的航班，爸爸妈妈去机场接，行李里装满给家人的泰国零食），一月回来上下学期，一月有泰语考试；明年这个时候想去亚洲各地旅行；去过甲米、坐快艇去海岛一日游（看到海豚）；在出租车上丢过手机，诚实的司机送回来了；十二月去清迈（住 River Hostel）；四月给爸妈写过邮件（泰国热季）；弟弟个子高、棕色卷发、短胡子、戴眼镜，来曼谷时 Nam 去机场接他。泰语译文里 Emma 给爸妈写信自称 หนู。
- 其他人物：Mr. Brown 2012 年来曼谷，当时天天坐船；Ploy 是 Nam 和 Emma 的同班同学，总忘东西（[en-C3-03] 生病缺课，[en-C8-04] 把围巾落在 Nam 家）；Top 21 岁，读商科，每周五天晚上 5–10 点在大学附近的咖啡馆打工，存钱明年去日本。一次性人物：C1 社团招新会的学长（b）、C2 的校医（b）和护士（c）、C3-04 图书馆员（c）、C8 的店员（C8-03、C8-05 男，C8-06 女）、C5-r02 的出租车司机。
- 本轮定下或照用的约定：
  - en.md 三审约定全部照用：词条 reading 不带标点；元音前的 to 写 tə，our 写 aʊər；固定说法 That's right 不标重音；反问 Can you? 写 ˈkæn juː?；转写词尾 k 写 ก、p 写 ป、-st 写 สต์、-rt 写 ร์ต、-ft 写 ฟต์（shift ชิฟต์，同 soft ซอฟต์）、-pt 写 ปต์（striped สไตรปต์）、s 照拼写写 ส（noise นอยส์）、c/z 写 ซ（practice แพรกทิซ）；同音词同形（weak = week วีก，sew = so โซ）；非重读词尾 -i / -ing 加调号（ดิกชันแนรี่、เอียร์ริ่งส์）；短 ɪ 写 อิ（ริไมนด์、พริแพร์），通用外来词保留（รีแลกซ์、รีวิว、รีเทิร์น、สเวตเตอร์、เลกเชอร์）。
  - 泰语：Emma 和 Nam 互称 เธอ，不用对方名字当"你"（改了 [en-C1-01]、[en-C1-03]、[en-C4-02]、[en-C4-03] 四处）；Nam 对社团学长用 ฉัน、称对方 พี่，学长称她 น้อง。
  - 补的基础词条：around（[en-C1-r01]）、a lot（[en-C1-r02]）、make（[en-C3-04]），后面的课不要再另起 id。
  - 每周固定的日子：对话里用单数，海报、告示里用复数（同 C9–C16）。
- 留给后面阶段的矛盾：[en-D8-01]、[en-D8-05] 写 Emma 还没见过 Ploy，和本单元 [en-C8-04]（以及 [en-C13-03]、[en-C13-r01]）矛盾；[en-E13-r02] Nam 把衣服给了 Kwan，和本单元 Kwan 来家里住不冲突。大纲 content/_plan/en-CF.json（只读）里本单元的四个替换词条（en.trip、en.beach、en.season / en.summer / en.winter、en.wet）和四个读音（what's the matter、get well soon、cover your mouth、to-do list）仍是旧的，新补的 en.around、en.a-lot、en.make 也不在大纲里，以课文为准。
