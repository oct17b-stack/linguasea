# 英语课 A11–A16 审校备注

AI 初稿（A 阶段第 11–16 单元，36 课），按 content/_plan/en-AB.json 写成；读音、泰文转写和泰语译文按 `en.md` 的约定（th 写 ธ、美式元音、Emma 和 Nam 互称 เธอ、译文不用 ครับ/ค่ะ）。下面是需要母语老师（英语 / 泰语）或开发确认的地方。

写课时的处理（不需要回答，供审校参考）：
- 课程顺序里 A7–A16 在 B1 之前，所以对话只用 A1–A10 和本单元之前教过的词：没有颜色词（只有 white、orange、dark、blond）、bike、market、hospital、restaurant、taxi、today、weekend、want、some、can（能力）等 B 阶段的词；go 只在 A14-06（go shopping、Let's go!）、work 只在 A16-05（Where do you work?）出现。第三人称 -s 只有 has（A11-06 起）和 A16-05 的 sells（大纲要求当整体教）。
- but 当基本虚词用，读音照全课写法 bʌt（不重读）；A11-03 的引号照 [en-A9-05]，text 和 reading 都用直引号。
- 意思容易混的词条加了括号区分：foot / feet（ข้างเดียว / หลายข้าง）、tooth / teeth（ซี่เดียว / หลายซี่）、music ดนตรี / song เพลง (เป็นเพลง ๆ)、real ของจริง / really จริง ๆ (ใช้เน้น)、too เกินไป (หน้าคำคุณศัพท์)、Me neither (ตอบประโยคปฏิเสธ)、waiter / waitress、businessman / businesswoman。
- A16-02、A16-05、A16-06 是同一位出租车司机，家人设定前后一致：儿子警察、女儿工程师、太太开水果店、父亲退休、弟弟修车、妹妹是作家。

需要确认：

- [en-A13-03] [en-A13-05] 新增词条 en.big、en.small（每课一个）：大纲 A13-03 Big animals（It's big. / They're big.）、A13-05 Small animals（small / very small）和 A15-05 Too big! 都离不开 big / small，可它们是 [en-B2-04] 的词条，而 B2 在 A16 之后。text、reading、kind 和泰语词义（ใหญ่ / เล็ก，บิ๊ก / สมอล）与 B2-04 完全一致，`npm run dupes` 现在报 "taught again: en.big / en.small in en-A13-0x, en-B2-04"。建议 B2-04 把这两个词当复习保留（像 en.three、en.rice 那样），或由 B2 的作者换成别的词。
- [en-A13 情景] scenario 要 Nam 说宠物的 color、big or small，但颜色词在 [en-B2-03] 才教。对话没用颜色词；scenario 要不要去掉 color？
- [en-A15 情景] scenario 是 Emma 在周末市场买二手 bike，但 bike 在 [en-B6-05]、market 在 [en-B3-05] 才教。对话改用二手手机、电脑、帽子、椅子、手表、圆桌；A15-03 大纲的例子 a fast bike 改成 a fast computer。scenario 要不要改？
- [en-A16-05] 大纲例子 I work at a hospital.：hospital 在 [en-B3-01] 才教，对话改成 Where do your parents work? — At a school. They're teachers.（也符合固定设定：父母都是老师）。
- [en-A16-03] 大纲语法 work in an office：动词 work 到 A16-05 才随词条出现，所以对话没用 work，只在讲解里给出 work in an office。可以吗？
- [en-A16 情景] scenario 的出租车司机：taxi 在 [en-B6-01] 才教，对话里没说 taxi，只在泰语导语里交代（นั่งแท็กซี่）。
- [en-A12-06] 大纲 It's too salty. 让 too（เกินไป）比词条 en.too（[en-A15-05]）先出现。A12-06 讲解先说明 too = เกินไป，A15-05 再正式对比 too / very。可以吗？
- [en-A13-06] Nam 有没有宠物，各门课不一致：[ja-B8-06] 说家里养猫，[ko-D11-01] 说曼谷家里有一只小狗。本课不让 Nam 说自己的宠物，改成 Nam 问 Emma，Emma 在加拿大家里有一只小狗 Maple。建议在 docs/CONTENT.md 的固定设定里统一 Nam 家的宠物。
- [en-A13-06] 标准题型会对 its 出一道 listen-choose（只听音选义），而 its 和 it's（[en-A8-01] It's a …）读音一样，光听分不出来。要不要给这一课写 exercises，去掉这道题？（按要求本课没写 exercises）
- [新增细节] Emma 是长金发（A11-06 I have long blond hair.），在加拿大家里有一只小狗 Maple（A13-06）；Nam 的一位表哥/表弟（男，年轻，大学生，高、帅、短发深色，A11-04–06，没说是谁的儿子）；Nam 的姑姑（爸爸的妹妹，[en-A5-04]）是公务员（A16-03）。请确认不和后面的单元冲突。
- [en-A11-04] Is your cousin a man or a woman?：英语 cousin 和泰语 ลูกพี่ลูกน้อง 一样不分性别，Emma 去接人之前问性别。母语者也许更常说 Is your cousin a guy or a girl?（guy 未教）。可以吗？
- [en-A14-01] music 的词义写 ดนตรี（和 song เพลง 区分），所以 Do you like music? 译成 ชอบดนตรีไหม；口语更常说 ชอบฟังเพลงไหม。可以吗？
- [en-A14-02] Korean TV shows 译成 ซีรีส์เกาหลี（词义写 รายการทีวี，讲解说明 TV show 也包括电视剧）。可以吗？
- [en-A11-02] 邻居家小男孩的台词用男声 b（同 [en-A4-03] Ben），做真人录音时请用童声。
- [转写] sing 写 ซิ้ง，不写 ซิง（ซิง 是"处女"的俚语）。sell 写 เซ็ล，以免和 [en-B2-r01] sale เซล 相同（[en-A2-06] tell 写 เทล，短元音没加 ็，两种写法请统一）。
- [转写] 有意思的通行写法照 fan แฟน 的先例保留：fun ฟัน（= 牙齿，讲解 fun ไม่ใช่ funny 里标了读音）、song ซอง（= 信封）、read รีด（= 熨衣服）、cow คาว（= 腥味，来自 คาวบอย）、duck ดัก（= 设陷阱）、mango แมงโก้。都不粗俗，请确认。
- [转写] 按美式读音改了常见写法：banana บะแนนะ（常见 บานาน่า）、basketball แบสเกตบอล（常见 บาสเกตบอล）、fast แฟสต์（常见 ฟาสต์）、chocolate ช็อกเลิต（常见 ช็อกโกแลต）、anime แอนิเม（常见 อนิเมะ）、business- บิซเนส-（常见 บิสซิเนส），除 business 外讲解里都说明了。没有通行写法、按读音写的：papaya พะพายอะ、police officer พะลีส ออฟฟิเซอร์、mechanic มะแคนิก、terrible เทริเบิล、giraffe จะแรฟ、together ทุเกเธอร์。
- [转写] 美式同音词写成一样：ant / aunt（[en-A5-04]）แอนท์、bee / B（[en-A7-02]）บี、too / two ทู。听音题会自动避开同音词，A13-05 讲解说明了 ant / aunt。
- [词义] [en-A8-05] nice 的词义 ดี, สวย, น่ารัก (คำชมทั่วไป) 同时盖住了本批的 good ดี、beautiful สวย, สวยงาม、pretty สวยน่ารัก、cute น่ารัก，选择题里可能难分，建议把 nice 缩成 ดี, น่ารัก (คำชมทั่วไป) 之类（A8-05 不在本次范围，未改）。另外 slow ช้า 和 [en-A3-04] slowly ช้า ๆ 很接近。
- [en-A15-04] 讲解提到泰式英语 same same but different（"不是标准英语"），语气是否合适？
