# 英语课 C1–C8 审校备注

AI 初稿：C 阶段 1–8 单元，48 课 + 16 篇读物（en-C1-01 … en-C8-r02）。以下是拿不准、需要母语老师（英语 / 泰语）确认的地方。读音、转写、人物、泰语称呼都按 content/_review/en.md 的约定写（th 一律 ธ；Nam 自称 ฉัน，与 Emma 互称 เธอ，第三人称女性用 เขา；Mr. Brown 自称 ผม）。C1–C4 的对话和读物只用现在时和将来时（be going to 从 C4-01、will 从 C4-04 起才用），过去时从 C5 开始。

## 按协调要求替换的词条（A–B 已教过，不再重复教；对话里照常使用旧词）

- [en-C4-02] en.trip → en.visit（visit, ˈvɪzɪt）：trip 已在 [en-B6-04] 教过。visit 在整个课程（A–F 大纲和已写课文）里都没有单独教过（只有 F12 的 home visit），而 C4 大纲的例句就是 I'm going to visit my aunt.，所以用它替换。请确认。
- [en-C5-03] en.beach → en.speedboat（speedboat, ˈspiːdboʊt）：beach 已在 [en-B6-04] 教过；ferry 在 [en-E10-r02]、seafood 在 [en-D15-03]，所以选泰国海岛一日游常见的 speedboat（泰语外来词 สปีดโบ๊ท）。请确认。
- [en-C7-01] en.season / en.summer / en.winter → en.hot-season（hot season, ˈhɑːt ˌsiːzən）、en.cool-season（cool season, ˈkuːl ˌsiːzən）、en.snowy（snowy, ˈsnoʊi）：三个词已在 [en-B5-02] 教过。hot / cool season 与 [en-C7-03] 的 rainy season 成套，kind 和重音照大纲 rainy season（word，ˈ…ˌ…）写；snowy 与 sunny / rainy / windy / cloudy 成套。没选 degree（en.degree 已在 [en-E3-01] 当"学位"用）和 below zero（[en-F5-06]）。请确认。
- [en-C7-04] en.wet → en.sticky（sticky, ˈstɪki）：wet 已在 [en-A2-02] 教过；mosquito、slippery 分别在 [en-D12-04]、[en-D13-01]。sticky（เหนียวตัว）和 humid 配合，是泰国学生描述曼谷天气最常用的说法；读音与 [en-D15-r02] sticky rice 一致。请确认。

## 新增词条（每课最多 1 个，已跑 npm run dupes）

- [en-C5-01] en.yesterday（ˈjɛstərdeɪ）：整个课程都没有 yesterday，但 C5 讲过去时第一课就要用（Where were you yesterday?）。请规划确认以后的单元不再另起 id。
- [en-C8-01] en.clothes（kloʊðz，泰文 โคลธส์，按 ธ 约定）：衣服单元，可全课程都没有 clothes，[en-C8-01] 和 [en-C8-r02] 都要用。读音取词典美式首列 kloʊðz，讲解说明也可读 kloʊz（โคลส์）。请确认。

## 大纲的读音写法（词条照抄大纲，未改）

- [en-C2-03] What's the matter?、[en-C2-06] Get well soon!、[en-C8-r01] It suits you：C–F 大纲的短语读音不抄标点，疑问词或实词有时不标重音（wʌts ðə ˈmætər；ˌɡɛt wɛl ˈsuːn），和 A–B 的约定（What's wrong? → ˈwʌts ˈrɔːŋ?）不一样。词条按要求照抄大纲，对话行按 A–B 约定写（ˈwʌts ðə ˈmætər?、ˈɡɛt ˈwɛl ˈsuːn!）。要不要统一改大纲？
- [en-C2-r02] cover your mouth：大纲写弱读 jər，A–B 约定物主词用完整形式 jʊr。词条照抄大纲，正文里的 your 写 jʊr。请确认。

## 写法

- [en-C2-r01]、[en-C6-r02]、[en-C8-r01] 对话体读物：用叙述加引号（"…," Nam says.），text 保留引号，reading 不写引号。可以吗？
- [en-C7-02] About 35°C. / [en-C7-r02] It's about 38°C every day：degree（温度）没教，用符号 °C，reading 写 dɪˈɡriːz ˈsɛlsiəs，讲解说明 degree = องศา。可以吗？
- [en-C3-04] You must not eat in the library.：大纲写 must / mustn't，美式口语很少说 mustn't，对话用 must not，讲解给出缩写 mustn't，并说明日常口语多说 You can't eat here.。请确认。
- [en-C1-06] Three times a week: on Monday, Wednesday and Saturday.：每周固定的日子用单数（星期名复数未教，同 en.md 里 [en-B4-04] 的问题）。
- [en-C3-02] You don't have to get an A.：字母 A 在 reading 里手写 ˈeɪ。
- 对话里用了几个没单独教过、但已在固定短语里出现的基本词：make（make noise、makes coffee；学过 Make yourself at home.）、stay（How long are you going to stay there?；学过 stay home）、give（I'll give Ploy her scarf；C5-r02 学过 give back）、I see（= 我明白了）、a lot (of)、Wow。请确认 A2 学习者可以接受。
- 转写：photography 写 เฟอะทอกระฟี（按重音 pho-TOG-ra-phy，讲解专门对比 PHO-to），polite เพอะไลท์、forget เฟอร์เก็ต、attractive อะแทรกทิฟ、popular พอพิวเลอร์、similar ซิมิเลอร์ 都按美式弱读写，没用常见的 โฟโตกราฟี、โพไลท์、ฟอร์เก็ต、ป๊อปปูล่าร์。请泰语老师看会不会太陌生。
- [en-C2-02] back 写 แบ็ค 以区别 bag แบ็ก（[en-B2-02]），leg 写 เลก（避免 เล็ก = 小），讲解专门对比 back / bag。

## 人物与事实

- [en-C1-03] My sister can play the piano, too.、[en-C1-04] 妈妈会缝纫、外婆会织毛线、[en-C2-02] Nam 每周二、四打排球（与 [en-B16-r01] sports day 打排球一致）：都不冲突固定设定，请和中、日、韩三门课确认。
- [en-C3-03]、[en-C4-05]、[en-C8-04] 同学 Ploy（พลอย，女）；[en-C3-r02] 读物主人公 Top（ท็อป，男）；[en-C4-02] 住在清迈的 aunt（泰语译作 ป้า）和 [en-C4-r02]、[en-C5-05] 的表妹 Bee：都是路人，不算固定角色。（原想用 Mai，泰文 ไหม 会和疑问词 ไหม 混淆，所以改用 Ploy。）
- [en-C4-02]、[en-C4-03] Emma 明年毕业、毕业后想在曼谷工作，十二月回加拿大过节三周（与 [en-B6-04] 一致）；[en-C8-02] Emma 有个兄弟（泰语译作 น้องชาย，英文没说长幼）。请确认不和其他课冲突。
- [en-C5-06] That's right. I came to Bangkok in 2012…：给 Mr. Brown 加了"2012 年来曼谷"的背景，用来练 in + 年份。可以吗？
- [en-C6-03] 泰国最高的山在清迈（对话没提 Doi Inthanon 的名字）、It's the coldest place in Thailand、Ping River 是清迈最大的河：请核实说法。
- [en-C6-02] In September, the sea is more dangerous.（普吉西南季风期浪大）、[en-C6-r01] Phuket is the biggest island in Thailand, and it's the most popular place for beach vacations.：普吉是最大岛属实，"最受欢迎"是概括说法。请确认。
- [en-C5-r01] Ayutthaya was the capital of Thailand for more than four hundred years. / it took two hours：1350–1767 年约 417 年，曼谷到大城坐火车约 1.5–2 小时。用 Thailand 而不说 Siam，可以吗？
- [en-C7-01] 热季 From March to May、[en-C7-03] 讲解里雨季约 5–10 月：按常见的简化说法写。请确认。

## 近义词的泰语词义（请泰语老师确认能区分）

- [en-C7-05] definitely = แน่ ๆ, อย่างแน่นอน，和 [en-A1-06] Sure. = ได้สิ, แน่นอน 意思接近。
- [en-C5-01] awful = แย่สุด ๆ, ห่วยมาก；[en-A15-01] terrible 还没写，写的时候请避开相同词义。[en-C5-05] have fun = สนุกกัน, ได้สนุก；[en-A14-04] fun 也还没写。
- [en-C3-04] noise = เสียงรบกวน (คำนาม) / [en-C6-01] noisy = เสียงดัง, หนวกหู；[en-C1-06] join = เข้า (ชมรม, กลุ่ม), สมัครเป็นสมาชิก / [en-C3-03] attend = เข้าเรียน, เข้าร่วม (ชั้นเรียน, การประชุม)；[en-C3-04] return = คืน (ของที่ยืมมา), กลับมา / [en-C5-r02] give back = เอาของคืนให้เจ้าของ；[en-C7-01] hot season = หน้าร้อนของไทย / [en-B5-02] summer = ฤดูร้อน。
