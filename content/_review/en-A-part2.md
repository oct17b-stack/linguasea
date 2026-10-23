# 英语课 A11–A16 审校备注

AI 初稿（A 阶段第 11–16 单元，36 课），按 content/_plan/en-AB.json 写成；读音、泰文转写和泰语译文按 `en.md` 的约定（th 写 ธ、美式元音、Emma 和 Nam 互称 เธอ、译文不用 ครับ/ค่ะ）。下面是需要母语老师（英语 / 泰语）或开发确认的地方。

写课时的处理（不需要回答，供审校参考）：
- 课程顺序里 A7–A16 在 B1 之前，所以对话只用 A1–A10 和本单元之前教过的词：没有颜色词（只有 white、orange、dark、blond）、bike、market、hospital、restaurant、taxi、today、weekend、want、some、can（能力）等 B 阶段的词；go 只在 A14-06（go shopping、Let's go!）、work 只在 A16-05（Where do you work?）出现。第三人称 -s 只有 has（A11-06 起）和 A16-05 的 sells（大纲要求当整体教）。
- but 当基本虚词用，读音照全课写法 bʌt（不重读）；A11-03 的引号照 [en-A9-05]，text 和 reading 都用直引号。
- 意思容易混的词条加了括号区分：foot / feet（ข้างเดียว / หลายข้าง）、tooth / teeth（ซี่เดียว / หลายซี่）、music ดนตรี / song เพลง (เป็นเพลง ๆ)、real ของจริง / really จริง ๆ (ใช้เน้น)、too เกินไป (หน้าคำคุณศัพท์)、Me neither (ตอบประโยคปฏิเสธ)、waiter / waitress、businessman / businesswoman。
- A16-02、A16-05、A16-06 是同一位出租车司机，家人设定前后一致：儿子警察、女儿工程师、太太开水果店、父亲退休、弟弟修车、妹妹是作家。

需要确认：

- [en-A13-03] [en-A13-05] 新增词条 en.big、en.small（每课一个）：大纲 A13-03 Big animals（It's big. / They're big.）、A13-05 Small animals（small / very small）和 A15-05 Too big! 都离不开 big / small，可它们是 [en-B2-04] 的词条，而 B2 在 A16 之后。text、reading、kind 和泰语词义（ใหญ่ / เล็ก，บิ๊ก / สมอล）与 B2-04 完全一致，`npm run dupes` 现在报 "taught again: en.big / en.small in en-A13-0x, en-B2-04"。建议 B2-04 把这两个词当复习保留（像 en.three、en.rice 那样），或由 B2 的作者换成别的词。 ✅ resolved: 负责人已确认 B2-04 把 big / small 当复习保留，dupes 的 taught again 是有意的。
- [en-A13 情景] scenario 要 Nam 说宠物的 color、big or small，但颜色词在 [en-B2-03] 才教。对话没用颜色词；scenario 要不要去掉 color？ ✅ resolved: 课文不用颜色词，不改；scenario 在 course.json，不在本次修改范围，已在报告里转给负责人（建议去掉 color）。
- [en-A15 情景] scenario 是 Emma 在周末市场买二手 bike，但 bike 在 [en-B6-05]、market 在 [en-B3-05] 才教。对话改用二手手机、电脑、帽子、椅子、手表、圆桌；A15-03 大纲的例子 a fast bike 改成 a fast computer。scenario 要不要改？ ✅ resolved: 课文的替换合理，不改；scenario 在 course.json，已在报告里转给负责人（bike、market 都在 B 阶段才教）。
- [en-A16-05] 大纲例子 I work at a hospital.：hospital 在 [en-B3-01] 才教，对话改成 Where do your parents work? — At a school. They're teachers.（也符合固定设定：父母都是老师）。 ✅ resolved: 改得好，也符合固定设定。
- [en-A16-03] 大纲语法 work in an office：动词 work 到 A16-05 才随词条出现，所以对话没用 work，只在讲解里给出 work in an office。可以吗？ ✅ resolved: 可以，讲解给出即可。
- [en-A16 情景] scenario 的出租车司机：taxi 在 [en-B6-01] 才教，对话里没说 taxi，只在泰语导语里交代（นั่งแท็กซี่）。 ✅ resolved: 可以，导语交代就够了。
- [en-A12-06] 大纲 It's too salty. 让 too（เกินไป）比词条 en.too（[en-A15-05]）先出现。A12-06 讲解先说明 too = เกินไป，A15-05 再正式对比 too / very。可以吗？ ✅ resolved: 可以，先在讲解里说明，A15-05 再正式对比，循序渐进。
- [en-A13-06] Nam 有没有宠物，各门课不一致：[ja-B8-06] 说家里养猫，[ko-D11-01] 说曼谷家里有一只小狗。本课不让 Nam 说自己的宠物，改成 Nam 问 Emma，Emma 在加拿大家里有一只小狗 Maple。建议在 docs/CONTENT.md 的固定设定里统一 Nam 家的宠物。 ✅ resolved: 英语 A–B 不提 Nam 家有没有宠物（已写进 en.md「故事设定（A–B）」），不和别的课冲突；要不要在 CONTENT.md 统一由负责人决定。
- [en-A13-06] 标准题型会对 its 出一道 listen-choose（只听音选义），而 its 和 it's（[en-A8-01] It's a …）读音一样，光听分不出来。要不要给这一课写 exercises，去掉这道题？（按要求本课没写 exercises） ✅ resolved: 不用写 exercises。课程里没有意思是 it is 的单独词条（It's a … 带 a，读音不同），听 its 选义不会出现两个正确答案。
- [新增细节] Emma 是长金发（A11-06 I have long blond hair.），在加拿大家里有一只小狗 Maple（A13-06）；Nam 的一位表哥/表弟（男，年轻，大学生，高、帅、短发深色，A11-04–06，没说是谁的儿子）；Nam 的姑姑（爸爸的妹妹，[en-A5-04]）是公务员（A16-03）。请确认不和后面的单元冲突。 ✅ resolved: 和 A–B 其他课都不冲突，已记进 en.md「故事设定（A–B）」。
- [en-A11-04] Is your cousin a man or a woman?：英语 cousin 和泰语 ลูกพี่ลูกน้อง 一样不分性别，Emma 去接人之前问性别。母语者也许更常说 Is your cousin a guy or a girl?（guy 未教）。可以吗？ ✅ resolved: 可以，讲解已说明为什么要问；guy 以后再教。
- [en-A14-01] music 的词义写 ดนตรี（和 song เพลง 区分），所以 Do you like music? 译成 ชอบดนตรีไหม；口语更常说 ชอบฟังเพลงไหม。可以吗？ ✅ resolved: 词义保留 ดนตรี（和 song 区分），对话译文改成更口语的 ชอบฟังเพลงไหม。
- [en-A14-02] Korean TV shows 译成 ซีรีส์เกาหลี（词义写 รายการทีวี，讲解说明 TV show 也包括电视剧）。可以吗？ ✅ resolved: 可以，泰国人说的韩剧就是 ซีรีส์เกาหลี，讲解已说明。
- [en-A11-02] 邻居家小男孩的台词用男声 b（同 [en-A4-03] Ben），做真人录音时请用童声。 ✅ resolved: 可以；真人录音用童声的提醒已并入 en.md「配音检查」。
- [转写] sing 写 ซิ้ง，不写 ซิง（ซิง 是"处女"的俚语）。sell 写 เซ็ล，以免和 [en-B2-r01] sale เซล 相同（[en-A2-06] tell 写 เทล，短元音没加 ็，两种写法请统一）。 ✅ resolved: sing ซิ้ง 保留。ɛ 的写法定为：一般写 เ-（tell เทล、spell สเปล、well เวล），只有要和同课程里 eɪ 的词分开时加 ็（sell เซ็ล ≠ sale เซล）；已写进 en.md 约定。
- [转写] 有意思的通行写法照 fan แฟน 的先例保留：fun ฟัน（= 牙齿，讲解 fun ไม่ใช่ funny 里标了读音）、song ซอง（= 信封）、read รีด（= 熨衣服）、cow คาว（= 腥味，来自 คาวบอย）、duck ดัก（= 设陷阱）、mango แมงโก้。都不粗俗，请确认。 ✅ resolved: 都保留，没有粗俗或怪异的。
- [转写] 按美式读音改了常见写法：banana บะแนนะ（常见 บานาน่า）、basketball แบสเกตบอล（常见 บาสเกตบอล）、fast แฟสต์（常见 ฟาสต์）、chocolate ช็อกเลิต（常见 ช็อกโกแลต）、anime แอนิเม（常见 อนิเมะ）、business- บิซเนส-（常见 บิสซิเนส），除 business 外讲解里都说明了。没有通行写法、按读音写的：papaya พะพายอะ、police officer พะลีส ออฟฟิเซอร์、mechanic มะแคนิก、terrible เทริเบิล、giraffe จะแรฟ、together ทุเกเธอร์。 ✅ resolved: 都保留（美式元音按实际读音写是本课程约定）；business 现在全课统一写 บิซเนส（B16-01 原来写 บิสเนส），together 改成 ทูเกเธอร์（和 ทูเดย์、ทูมอร์โรว์ 一样，tə 写 ทู），police 统一写 พะลีซ，anime 按 eɪ 的写法改成 แอนิเมย์。
- [转写] 美式同音词写成一样：ant / aunt（[en-A5-04]）แอนท์、bee / B（[en-A7-02]）บี、too / two ทู。听音题会自动避开同音词，A13-05 讲解说明了 ant / aunt。 ✅ resolved: 同意，同音词就写成一样；按这个原则另外统一了 four / for 都写 ฟอร์、our / hour 都写 อาวเวอร์。
- [词义] [en-A8-05] nice 的词义 ดี, สวย, น่ารัก (คำชมทั่วไป) 同时盖住了本批的 good ดี、beautiful สวย, สวยงาม、pretty สวยน่ารัก、cute น่ารัก，选择题里可能难分，建议把 nice 缩成 ดี, น่ารัก (คำชมทั่วไป) 之类（A8-05 不在本次范围，未改）。另外 slow ช้า 和 [en-A3-04] slowly ช้า ๆ 很接近。 ✅ resolved: nice 改成 ดีจัง, สวยดี (คำชมทั่วไป)，不再和 good ดี、beautiful สวย、cute น่ารัก 重叠；slow ช้า / slowly ช้า ๆ 能分开，保留。
- [en-A15-04] 讲解提到泰式英语 same same but different（"不是标准英语"），语气是否合适？ ✅ resolved: 语气中性，只说明不是标准英语，保留。
