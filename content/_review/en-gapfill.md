# 英语课补词（基础词缺口）建议

课文里一直在用、却没有任何一课把它当词条教的基础词：它们从不进复习，也从没讲过意思（韩语课的例子是 다，92 课都在用）。这里只列建议，课文和词条一个字都没改；各段审校按下面的行把词条贴进对应的课（目标语层 items + 泰语层 items 的 meaning / translit）。

做法：
- 扫描：脚本按 course.json 的顺序读全部 720 个文件（576 课 + 144 篇读物）的对话句和读物正文，正则分词，拆开缩写（I'm、don't、won't、let's），用 lemminflect 还原词形，再和全部词条的文字对照：单词词条连同它的屈折形式算"已教"，只出现在多词短语词条里的词单独列出来人工判断。人名地名、数字、字母拼读不算。
- 判断：只留 A1–B1 的基础词，并且至少 2 课在用（或者非常基础）。分三类：
  - A 类（18 个）：全课程没有任何词条包含这个词。
  - B 类（22 个）：只出现在短语词条里，而那些短语是习语或另一个意思（with 只在 deal with 里、why 只在 Why not? 里），它最常用的意思从没教过。短语里意思相同、学习者一看就懂的（stay 在 stay home、give 在 give back、every 在 every day）不算缺口。
  - C 类（9 个）：是某课语法点的一部分、讲解里讲过，但同一组里的其他词已经是词条（D13-02 教了 yourself、himself，没教 myself；C15-02 教了 no one，没教 everyone）。纯语法词（情态动词、unless、such 等）不补，见文末。
- 位置：放在第一次用到这个意思的那一课（课程顺序：A1-01…A1-06，B 阶段起每单元 06 之后是读物 r01、r02）。那课已有 7 个词条时，放到同单元首次出现之前最近有空位的课，绝不放在首次出现之后。这次 much 要往前挪（见该行），其余都放在首次出现的那一课；放进去以后每课最多 7 个词条（标了"本课第 7 个词条"的就是第 7 个）。
- 词条：id 按现有写法（`en.` + 小写、连字符），都查过全课程没有这个 id，也没有同一个词的别的 id；reading 按 content/_review/en.md 的约定（美式 IPA，单音节不标重音，短语给实词标重音，for 弱读 fər，代词写完整形式）；泰语词义简短，和全课程其他词条的词义没有完全相同的（近义词用括号区分：they / them、he / him、we / us、ago / last、too / also、very / so / much / many、majority / mostly、result in / cause），这几十条之间也不重复；转写按 en.md（th 一律写 ธ：then เธน、than แธน、with วิธ；-st 写 สต์、-rt 写 ร์ต；非重读词尾 -i 按辅音类加调号），课里短语已经用过的写法照用（about อะเบาท์、keep คีป、check เช็ก、each other 的 other อาเธอร์）。
- "used in" 是用到这个意思的全部课（超过 12 课只列前 10 课和总数），"首次"是第一次出现的句子。
- 结果：建议新增 49 个词条：A 阶段 2 个、B 阶段 6 个、C 阶段 19 个、D 阶段 14 个、E 阶段 5 个、F 阶段 3 个。
- 快照：2026-10-23 13:05 UTC。扫描期间各段审校已经补上了同一批里的 true（en-E9-02）、story（en-E11-05）、believe（en-E11-r02）、midnight（en-E13-r01）、wall（en-E16-01）、above（en-E16-01），另外 [en-D10-05] important、[en-D10-r01] life 也已由 D9–D16 审校补上，这里都不再列。课文还在改，贴之前请先 `grep -r '"<id>"' content/courses/en` 确认 id 还没有、首次出现的句子还在。

## 建议新增的词条（按课程顺序）

格式：`- [放进的课] text (reading) — id — kind — 泰语词义 — 转写 — used in: 课号`，下一行是首次出现的句子和为什么算缺口。

### A 阶段（2 个）

- [en-A6-01] with (wɪð) — en.with — word — กับ, พร้อมกับ; ด้วย (กินด้วยช้อน) — วิธ — used in: 共 204 课：en-A6-01、en-A6-06、en-B4-03、en-B4-r01、en-B7-01、en-B7-r01、en-B10-03、en-B12-r01、en-B13-03、en-B16-06 …（本课第 7 个词条）
  - B 类。首次：Can I have a coffee with milk, please? 只出现在 deal with（[en-D4-06]）、get along with 等短语动词和 with your hand（[en-D15-r02]）里。
- [en-A6-05] but (bʌt) — en.but — word — แต่ — บัท — used in: 共 369 课：en-A6-05、en-A8-06、en-A10-06、en-A12-03、en-A12-06、en-A13-06、en-A15-04、en-A15-05、en-B4-05、en-B4-06 …（本课第 7 个词条）
  - A 类：全课程没有含这个词的词条。首次：Yes, but I don't eat beef. 全课程用得最多、却从没当词条教过的词。

### B 阶段（6 个）

- [en-B1-01] why (waɪ) — en.why — word — ทำไม — วาย — used in: 共 52 课：en-B1-01、en-B4-06、en-B5-04、en-B5-06、en-C12-01、en-C12-03、en-C13-03、en-C13-06、en-D6-04、en-D7-02 …（本课第 7 个词条）
  - B 类。首次：It's Monday. Why? 只出现在 [en-C13-06] 的 Why not?（= 好啊）里。
- [en-B1-03] when (wɛn) — en.when — word — เมื่อไร; ตอนที่, เมื่อ — เวน — used in: 共 142 课：en-B1-03、en-B1-04、en-B15-06、en-C2-r02、en-C3-03、en-C4-03、en-C4-06、en-C4-r01、en-C6-04、en-C6-06 …（本课第 7 个词条）
  - A 类：全课程没有含这个词的词条。首次：Nam, when is Songkran? [en-F15-06] 的 whenever 是词条，when 本身不是。
- [en-B3-02] much (mʌtʃ) — en.much — word — มาก (very much, too much; ใช้กับคำนามนับไม่ได้) — มัช — used in: 共 52 课：en-B3-03、en-C15-03、en-D3-04、en-D6-03、en-D7-01、en-D9-04、en-D9-05、en-D9-r01、en-D10-01、en-D10-04 …（本课第 7 个词条）
  - B 类。首次：Thank you very much! 只出现在 How much、pretty much 里；Thank you very much / so much、too much、much bigger 的"很、多"没教；B3 之后到 [en-C15-03] 才再出现。首次出现的 [en-B3-03] 补完别的词以后已满 7 个，按规则放在同单元前面最近有空位的这一课。
- [en-B3-03] then (ðɛn) — en.then — word — จากนั้น, แล้วก็; งั้น (ถ้าอย่างนั้น) — เธน — used in: 共 156 课：en-B3-03、en-B3-06、en-B4-01、en-B4-05、en-B6-05、en-B14-02、en-C1-02、en-C1-05、en-C3-03、en-C4-01 …（本课第 7 个词条）
  - A 类：全课程没有含这个词的词条。首次：Go straight. Then turn right at the corner.
- [en-B3-04] which (wɪtʃ) — en.which — word — …ไหน, อันไหน (ให้เลือก) — วิช — used in: 共 35 课：en-B3-04、en-B13-01、en-B15-01、en-C6-02、en-C6-05、en-C6-r01、en-C8-05、en-C13-04、en-C15-02、en-C16-04 …
  - A 类：全课程没有含这个词的词条。首次：Which bank? [en-F15-06] 的 whichever 是词条，which 本身不是。
- [en-B6-03] about (əˈbaʊt) — en.about — word — ประมาณ; เกี่ยวกับ — อะเบาท์ — used in: 共 204 课：en-B6-03、en-C4-05、en-C5-03、en-C7-02、en-C7-r02、en-C9-05、en-C10-03、en-C10-06、en-C10-r02、en-C13-03 …（本课第 7 个词条）
  - B 类。首次：About twelve hours. 只出现在 crazy about（[en-E6-06]）、feel bad about、laugh about it 里；"ประมาณ"（About twelve hours.）和"เกี่ยวกับ"两个常用义都没教。

### C 阶段（19 个）

- [en-C1-r01] many (ˈmɛni) — en.many — word — หลาย…, จำนวนมาก (ใช้กับคำนามนับได้) — เมนี่ — used in: 共 58 课：en-C1-r01、en-C12-r01、en-C16-r01、en-D1-r02、en-D4-01、en-D6-03、en-D9-02、en-D9-03、en-D9-r01、en-D10-02 …
  - B 类。首次：We play chess and many different games, and we can teach beginners. 只出现在 How many（= กี่）里。
- [en-C2-05] them (ðɛm) — en.them — word — พวกเขา, พวกมัน (ใช้เป็นกรรม) — เธม — used in: 共 107 课：en-C2-05、en-C3-04、en-C4-04、en-C4-r01、en-C8-05、en-C8-06、en-C8-r02、en-C12-03、en-C12-04、en-C14-06 …
  - A 类：全课程没有含这个词的词条。首次：After meals. And take them with water. they、their 是词条，宾格 them 不是。
- [en-C2-r01] so (soʊ) — en.so — word — ก็เลย, ดังนั้น; …จัง, …มาก (so + คำคุณศัพท์) — โซ — used in: 共 206 课：en-C2-r01、en-C3-r01、en-C4-r01、en-C4-r02、en-C5-04、en-C5-r02、en-C6-01、en-C6-r01、en-C7-06、en-C7-r02 …
  - B 类。首次：Nam is sick, so she goes to see a nurse at her university. 只出现在 So-so、I think so、and so on、even so、or so 里；"所以"和"这么、很"两个常用义都没教。
- [en-C2-r02] if (ɪf) — en.if — word — ถ้า — อิฟ — used in: 共 87 课：en-C2-r02、en-C7-04、en-C7-r01、en-C8-r02、en-C9-02、en-C10-01、en-C11-02、en-C13-04、en-D2-r02、en-D8-r02 …
  - B 类。首次：If you have a fever, stay home and rest. 只出现在 [en-F8-05] 的 if only 里。
- [en-C4-01] us (ʌs) — en.us — word — เรา, พวกเรา (ใช้เป็นกรรม) — อัส — used in: 共 32 课：en-C4-01、en-C4-r02、en-C13-02、en-D2-r02、en-D4-01、en-D4-r02、en-D5-04、en-D8-r02、en-D11-04、en-E1-r02 …
  - A 类：全课程没有含这个词的词条。首次：Nice! I'm going to go out with some friends on Monday. Come with us! we 是词条；us 只藏在 Let's 里，学习者看不到。
- [en-C5-06] last (læst) — en.last — word — (สัปดาห์, ปี ฯลฯ) ที่แล้ว; สุดท้าย — แลสต์ — used in: 共 81 课：en-C5-06、en-C5-r02、en-C9-r02、en-C11-06、en-C13-r02、en-C16-03、en-D1-05、en-D1-r01、en-D2-04、en-D2-r01 …
  - B 类。首次：Really? Last week, I took a boat to class, too! 只出现在 last name、last train、at last 里；last week / last year 的"上一个"没教。
- [en-C5-r01] than (ðæn) — en.than — word — กว่า (ใช้เปรียบเทียบ) — แธน — used in: 共 42 课：en-C5-r01、en-C6-01、en-C6-02、en-C6-r01、en-C7-r02、en-C11-04、en-C16-04、en-D1-01、en-D11-05、en-D12-06 …
  - A 类：全课程没有含这个词的词条。首次：Ayutthaya was the capital of Thailand for more than four hundred years. [en-C6-01] 讲 -er than，比较用的 more、less、least 都是词条，than 不是；第一次出现在前一单元的读物（more than four hundred years）。
- [en-C5-r02] him (hɪm) — en.him — word — เขา (ผู้ชาย, ใช้เป็นกรรม) — ฮิม — used in: 共 31 课：en-C5-r02、en-C8-02、en-C16-r02、en-D2-02、en-D4-03、en-D6-04、en-D7-05、en-D8-05、en-D11-06、en-D13-01 …
  - A 类：全课程没有含这个词的词条。首次：Emma was so happy, and she bought him a coffee. he、his、himself 是词条，宾格 him 不是。
- [en-C10-02] check (tʃɛk) — en.check — word — ตรวจดู, เช็ก — เช็ก — used in: 共 34 课：en-C10-02、en-C10-r01、en-C15-01、en-C15-02、en-D3-03、en-D3-06、en-D4-04、en-D6-03、en-D16-r02、en-E2-03 …
  - B 类。首次：OK. Could I check my balance now? 只出现在 Check, please（结账）和 check in / check out（酒店）里；"检查、看一下"没教。
- [en-C10-06] keep (kiːp) — en.keep — word — เก็บไว้; …ไปเรื่อย ๆ (keep + -ing) — คีป — used in: 共 29 课：en-C10-06、en-C11-r02、en-C15-r02、en-D5-r01、en-D7-r01、en-D14-01、en-E4-r02、en-E5-r01、en-E5-r02、en-E6-06 …
  - B 类。首次：Sure. Here's your tracking number. Please keep it. 只出现在 Keep out、keep in touch、keep going 等固定说法里；"留着、保持"和 keep + -ing 没教。
- [en-C11-05] all (ɔːl) — en.all — word — ทั้งหมด, ทุก (คน, อย่าง) — ออล — used in: 共 75 课：en-C11-05、en-C11-r02、en-C12-05、en-C12-r02、en-C13-01、en-C13-r02、en-C16-03、en-D3-05、en-D4-01、en-D7-05 …
  - B 类。首次：Swimming is great exercise. It's good for all your muscles. 只出现在 all day（[en-B5-r01]）、not at all、after all、reply all 里；all my friends、all of them 这类"全部、所有"没教。
- [en-C12-04] little (ˈlɪtəl) — en.little — word — เล็ก ๆ, ตัวน้อย; little brother/sister = น้อง — ลิตเทิล — used in: en-C12-04、en-C12-r02、en-D7-03、en-D9-r02、en-E6-03、en-F6-01、en-F10-r01、en-F14-03
  - B 类。首次：What are those little boats on the river? 只出现在 a little（一点儿）里；形容词"小"（little brother、her little stall）没教。
- [en-C12-r01] show (ʃoʊ) — en.show — word — ให้ดู, แสดง (ให้เห็น) — โชว์ — used in: 共 24 课：en-C12-r01、en-D2-01、en-E2-r02、en-E4-06、en-E7-05、en-E7-r02、en-E8-r02、en-E13-01、en-E16-03、en-F1-04 …
  - B 类。首次：Songkran is a lot of fun, but please show respect. 只出现在名词 TV show、talent show 和 show off 里；动词"给…看、显示"没教。
- [en-C14-04] a few (ə ˈfjuː) — en.a-few — phrase — สองสาม, ไม่กี่ (ใช้กับคำนามนับได้) — อะ ฟิว — used in: 共 30 课：en-C14-04、en-D9-03、en-D12-01、en-D12-04、en-D16-r01、en-E3-03、en-E3-06、en-E4-r01、en-E7-05、en-E7-r02 …
  - A 类：全课程没有含这个词的词条。首次：A lot! Two cans. And a few chilies, too. 只有 [en-E1-05] 的 fewer 是词条。
- [en-C15-01] everything (ˈɛvriθɪŋ) — en.everything — word — ทุกอย่าง — เอฟวรี่ธิง — used in: 共 38 课：en-C15-01、en-D1-04、en-D7-r01、en-D9-r01、en-D10-r01、en-D14-01、en-D14-r01、en-D16-02、en-D16-03、en-D16-r01 …
  - C 类。首次：I checked everything. You just need a new charger. [en-C15-01] 讲解讲 something / anything / nothing / everything，something、anything 是词条。
- [en-C15-01] nothing (ˈnʌθɪŋ) — en.nothing — word — ไม่มีอะไร — นาธิง — used in: en-C15-01、en-E2-r02、en-E13-03、en-E15-r01、en-F5-02、en-F13-04、en-F13-06
  - C 类。首次：No, there's nothing wrong with the screen. But the battery is always empty after two ho… 同上（[en-C15-01]）。
- [en-C15-02] everyone (ˈɛvriwʌn) — en.everyone — word — ทุกคน — เอฟวรี่วัน — used in: 共 56 课：en-C15-02、en-D2-01、en-D4-01、en-D7-r02、en-D8-01、en-D9-03、en-D9-r02、en-D10-r02、en-D11-01、en-D11-06 …
  - C 类。首次：Good idea. Which app does everyone use? [en-C15-02] 讲解讲 someone / anyone / no one / everyone，只有 no one 是词条。
- [en-C15-02] anyone (ˈɛniwʌn) — en.anyone — word — ใคร (ในคำถามและประโยคปฏิเสธ), ใครก็ได้ — เอนี่วัน — used in: 共 18 课：en-C15-02、en-C15-r02、en-D2-02、en-D8-02、en-D13-03、en-D13-05、en-E1-01、en-E2-r02、en-E4-05、en-E15-01 …（本课第 7 个词条）
  - C 类。首次：Emma, I need help with my homework. Is anyone online? 同上（[en-C15-02]）。
- [en-C15-02] someone (ˈsʌmwʌn) — en.someone — word — ใครบางคน, ใครสักคน — ซัมวัน — used in: 共 28 课：en-C15-02、en-D3-06、en-D13-06、en-D13-r01、en-D16-05、en-E2-05、en-E3-03、en-E4-02、en-E4-04、en-E4-06 …
  - C 类。首次：Send a message to the group. Someone can help you in the morning. 同上（[en-C15-02]）；另外只在 give someone a ride 等短语里当占位词。

### D 阶段（14 个）

- [en-D3-04] else (ɛls) — en.else — word — อื่นอีก (ใช้หลัง anything, what, someone) — เอลส์ — used in: 共 19 课：en-D3-04、en-D4-01、en-D4-02、en-E10-06、en-E12-06、en-F1-01、en-F1-03、en-F2-02、en-F2-04、en-F2-06 …
  - A 类：全课程没有含这个词的词条。首次：Yes, it's in the closet. Do you need anything else? 多数是 anything else / what else。
- [en-D3-04] possible (ˈpɑːsəbəl) — en.possible — word — เป็นไปได้ — พอสซิเบิล — used in: en-D3-04、en-E7-04、en-E8-04、en-F13-06、en-F14-05（本课第 7 个词条）
  - C 类。首次：Hi, this is Room 305. Is it possible to get an extra pillow? [en-D3-04] 语法点 Is it possible to…? 的核心词（讲解讲过）；impossible 是 [en-E7-04] 的词条，possible 只在 [en-F12-04] 的 as soon as possible 里，en-D1-8.md 也问过要不要补。
- [en-D3-06] also (ˈɔːlsoʊ) — en.also — word — …ด้วย, ยัง…อีกด้วย — ออลโซ — used in: 共 41 课：en-D3-06、en-D8-r01、en-E1-r01、en-E1-r02、en-E3-04、en-E3-06、en-E3-r02、en-E4-r01、en-E7-r01、en-E8-03 …
  - A 类：全课程没有含这个词的词条。首次：Thank you. There's also a bad smell in the bathroom. too 的词条只教了"太"（เกินไป），"也"只在 Me too / You too 里。
- [en-D3-r01] other (ˈʌðər) — en.other — word — อื่น, …อื่น ๆ; (อีก…) ที่เหลือ — อาเธอร์ — used in: 共 33 课：en-D3-r01、en-D5-r01、en-D6-06、en-D8-03、en-D10-04、en-D12-05、en-D16-03、en-E1-05、en-E2-05、en-E3-r02 …
  - B 类。首次：You have already paid 1,600 baht, so please pay the other 800 baht when you check in. 只出现在 the other day、each other、in other words、on the other hand 里。
- [en-D3-r01] Dear … (ˈdɪr …) — en.dear — phrase — เรียน… (คำขึ้นต้นจดหมาย, อีเมล) — เดียร์ … — used in: en-D3-r01、en-D4-04、en-D4-r01、en-E3-r02、en-E6-r01、en-E12-r02、en-F1-r01、en-F2-r02
  - B 类。首次：Dear Nam, 只有 [en-F2-01] 的 Dear Sir or Madam 是词条，可 [en-D3-r01] 起的信都用 Dear + 名字（[en-D4-04] 讲解讲过）。
- [en-D4-03] another (əˈnʌðər) — en.another — word — อีก…หนึ่ง (อีกอัน, อีกคน) — อะนาเธอร์ — used in: en-D4-03、en-D10-02、en-E6-04、en-E13-r01、en-F4-02、en-F5-05、en-F11-05、en-F12-06、en-F14-04、en-F15-02
  - A 类：全课程没有含这个词的词条。首次：Thank you. Can he get back to me before ten? I have another meeting at ten.
- [en-D5-r01] put (pʊt) — en.put — word — วาง, ใส่ (ไว้ที่ใดที่หนึ่ง) — พุท — used in: 共 20 课：en-D5-r01、en-D13-06、en-D15-01、en-D16-04、en-E1-r01、en-E4-01、en-E4-r02、en-E5-02、en-E7-r01、en-E12-06 …
  - B 类。首次：Put a label with your name on your food in the fridge. 只出现在 put away、put through、put up with 等短语动词里。
- [en-D10-06] without (wɪˈðaʊt) — en.without — word — โดยไม่มี, ไม่มี… — วิธเอาท์ — used in: en-D10-06、en-D10-r02、en-D11-05、en-D16-02、en-E2-r01、en-E6-r01、en-E7-06、en-F3-05、en-F10-06、en-F13-04、en-F13-05、en-F13-06
  - C 类。首次：Really? I can't sleep without drinking a cup of tea at night. [en-D10-06] 语法点 instead of / without + -ing；instead 是 [en-C13-05] 的词条，without 不是。
- [en-D12-03] through (θruː) — en.through — word — ผ่าน (เข้าทางหนึ่ง ออกอีกทาง), ทะลุ — ธรู — used in: en-D12-03、en-E15-r02、en-F2-r01、en-F5-03、en-F6-02、en-F12-05、en-F16-06
  - B 类。首次：Take this path. It goes through the forest. 只出现在 put through、get through、read through 里。
- [en-D12-05] for example (fər ɪɡˈzæmpəl) — en.for-example — phrase — ตัวอย่างเช่น, ยกตัวอย่าง — ฟอร์ เอ็กแซมเปิล — used in: en-D12-05、en-D16-05、en-D16-r02、en-F1-02、en-F1-r02、en-F2-01、en-F3-03、en-F6-r02、en-F9-r01、en-F11-03
  - A 类：全课程没有含这个词的词条。首次：Tigers, for example. And a lot of other species, too. 也包括单用的 example(s)（give examples、a few examples）。
- [en-D13-02] myself (maɪˈsɛlf) — en.myself — word — ตัวฉันเอง — มายเซลฟ์ — used in: en-D13-02、en-E8-02、en-E13-r02、en-F5-r02、en-F8-05、en-F12-04、en-F14-01、en-F14-04、en-F15-02
  - C 类。首次：Don't worry, I'm fine. Oh no! I cut myself! [en-D13-02] 讲解讲 myself / yourself / himself，后两个是本课词条，myself 不是。
- [en-D14-01] finish (ˈfɪnɪʃ) — en.finish — word — ทำ…เสร็จ, เสร็จ — ฟินิช — used in: 共 13 课：en-D14-01、en-E3-01、en-E3-02、en-E3-r01、en-E9-06、en-F1-06、en-F7-03、en-F7-04、en-F11-01、en-F11-04 …
  - A 类：全课程没有含这个词的词条。首次：OK. When I finish studying today, let's go to the mall. I enjoy trying new devices!
- [en-D15-02] order (ˈɔːrdər) — en.order — word — สั่ง (อาหาร, สินค้า); รายการที่สั่ง — ออร์เดอร์ — used in: en-D15-02、en-D15-03、en-D15-04、en-F1-04、en-F8-01、en-F8-03、en-F10-02、en-F10-04、en-F15-06
  - B 类。首次：Good evening. Can I take your order? 只出现在 [en-D3-06] 的 out of order（坏了）里，点菜的"สั่ง"没教。
- [en-D16-03] each (iːtʃ) — en.each — word — แต่ละ — อีช — used in: en-D16-03、en-E3-06、en-E14-r01、en-E16-05、en-F1-02、en-F7-06、en-F9-04、en-F10-05、en-F11-02、en-F11-03、en-F11-r01、en-F14-r02
  - B 类。首次：You'd better make flashcards. Write a new word on each card. 只出现在 each other 里。

### E 阶段（5 个）

- [en-E1-r02] part (pɑːrt) — en.part — word — ส่วน, ชิ้นส่วน (part of … = ส่วนหนึ่งของ…) — พาร์ต — used in: 共 14 课：en-E1-r02、en-E4-05、en-E9-r02、en-E10-05、en-E10-06、en-E12-04、en-E14-05、en-E15-r01、en-F5-01、en-F6-r02 …
  - A 类：全课程没有含这个词的词条。首次：This new rule is part of the university's campaign to reduce plastic waste.
- [en-E2-04] ask (æsk) — en.ask — word — ถาม; ขอให้ (ask someone to …) — แอสก์ — used in: 共 56 课：en-E2-04、en-E2-r02、en-E3-04、en-E4-02、en-E4-04、en-E5-05、en-E6-r01、en-E6-r02、en-E7-01、en-E8-03 …
  - B 类。首次：Public transportation. First, they asked me if I took the train every day. 只出现在 ask out、ask a favor 里；[en-E2-04] 语法点 asked if / whether 的 whether 是词条，ask 不是。
- [en-E5-02] million (ˈmɪljən) — en.million — word — ล้าน (1,000,000) — มิลเลียน — used in: en-E5-02、en-E9-05、en-E9-r02、en-E16-03、en-F8-r02
  - A 类：全课程没有含这个词的词条。首次：OK, class. What would you do if you won ten million baht? hundred、thousand 是词条。
- [en-E6-05] common (ˈkɑːmən) — en.common — word — พบบ่อย, ทั่วไป — คอมมอน — used in: en-E6-05、en-E16-04、en-F1-r02、en-F5-01、en-F10-01
  - B 类。首次：That's common. The bride usually wears a traditional Thai dress in the morning and a wh… 只出现在 in common（共同点）里，"常见"没教。
- [en-E8-05] mostly (ˈmoʊstli) — en.mostly — word — โดยมาก, ส่วนมากแล้ว — โมสต์ลี่ — used in: en-E8-05、en-E9-01、en-E10-01、en-E12-01、en-E13-05、en-E14-01、en-F13-03、en-F14-05
  - A 类：全课程没有含这个词的词条。首次：Mostly. There are security guards, and there's CCTV everywhere.

### F 阶段（3 个）

- [en-F4-r02] even (ˈiːvən) — en.even — word — แม้แต่, ยิ่ง (…กว่าเดิม) — อีเวิน — used in: 共 13 课：en-F4-r02、en-F5-05、en-F5-06、en-F5-r02、en-F7-05、en-F8-06、en-F9-01、en-F9-03、en-F9-r01、en-F11-r01 …
  - B 类。首次：He didn't even let me pay! 只出现在 even though（[en-E3-05]）、even so（[en-F3-03]）里。
- [en-F7-02] cause (kɔːz) — en.cause — word — เป็นสาเหตุของ…; สาเหตุ — คอส — used in: en-F7-02、en-F13-03、en-F13-06、en-F15-r02
  - C 类。首次：Stress causes physical problems, like headaches and stomach pain. It can cause anxiety,… [en-F7-02] 语法点 cause, lead to, result in，后两个是本课词条，cause 不是。
- [en-F10-04] nobody (ˈnoʊbɑːdi) — en.nobody — word — ไม่มีใครเลย (ใช้เหมือน no one) — โนบอดี้ — used in: en-F10-04、en-F12-04、en-F15-r02
  - A 类：全课程没有含这个词的词条。首次：Apps are expensive, too. And suppose nobody downloaded it? 同义的 no one 是 [en-C15-02] 的词条。

## 可选：规则上不补，但规划可以考虑

情态动词是语法点（只在讲解里讲），nowhere、slightly 全课程只用了一次，所以没放进上面的建议。如果决定也让它们进复习，可以直接用下面这几行（id 都查过是新的，词义不和别的词条重复）：

- [en-C2-04] should (ʃʊd) — en.should — word — ควร — ชูด — used in: 68 课，[en-C2-04] 语法点 should / shouldn't
- [en-C3-04] must (mʌst) — en.must — word — ต้อง (ตามกฎ, จำเป็น) — มัสต์ — used in: 18 课，[en-C3-04] 语法点 must / mustn't
- [en-C7-02] might (maɪt) — en.might — word — อาจ… (ไม่แน่ใจ, วางหน้ากริยา) — ไมท์ — used in: 19 课，[en-C7-02] 语法点 might / may；词义要和 maybe（อาจจะ, บางที）分开
- [en-D6-05] nowhere (ˈnoʊwɛr) — en.nowhere — word — ไม่มีที่ไหนเลย — โนแวร์ — used in: en-D6-05（只用这一次；本课 anywhere、somewhere、everywhere 都是词条，en-D1-8.md 问过要不要补）
- [en-F10-02] slightly (ˈslaɪtli) — en.slightly — word — เล็กน้อย (ขึ้นหรือลงนิดหน่อย) — สไลท์ลี่ — used in: en-F10-02（只用这一次；本课 sharply、steadily、gradually、dramatically 是词条，讲解讲了 a slight fall）
- her 作宾语（tell her、with her）全课程很常用，可 en.her（[en-A5-03]）只教了"ของเขา (ผู้หญิง)"。同形同音的词不能再立一个 id，建议把 en.her 的词义扩成"ของเขา; เขา (ผู้หญิง, ใช้เป็นกรรม)"，或在 [en-A5-03] 的讲解补一句。

## 有意没补的词

- 纯语法词，在用到的那课讲解里讲过，按规范不另立词条：will / won't（[en-C4-04]、[en-C4-05]）、can / could（[en-C1-03]、[en-C10-02]，Can I have…? 等短语已教）、would（I'd like 已教，[en-E5-02] 第二条件句）、shall（3 课，[en-C13-04]）、may 作情态（4 课，[en-C7-02]；词条 May 是五月）、unless（2 课，[en-D10-03]）、such（5 课，[en-D11-02]）、be able to（4 课，[en-D16-02]）、be supposed to（5 课，[en-E4-01]）、would rather（2 课，[en-D15-01]）、ought to（[en-D10-04]）、while（6 课，[en-D2-03] while + 过去进行时）、none（2 课，[en-D12-04] most / some / none of）、due to（[en-E9-01]）、in case（4 课，[en-E8-05]）、I was wondering if（[en-F12-06]）、neither … nor（[en-F15-05]）、in spite of（[en-E13-04]，despite 是词条）。
- 感叹词和话语标记，和韩语课一样不补：Oh（160 课）、Ha（39 课）、Wow（26 课）、Hmm（11 课）、Hey、Yum；句首的 Well,（21 课，作"嗯、这个嘛"，和词条 en.well "ได้ดี, เก่ง" 同形，不能再立 id）。
- 人名、地名、专名、泰语词：Nam、Emma、Fah、Ploy、Top（[en-C3-r02] 起的朋友，the top floor 只用过一次）、Tom、Chiang Mai、Khao Yai、khao soi、pad Thai / pad kra pao、soi、wai（[en-E4-01] 讲解讲过）、krathong（[en-C12-04] 讲解讲过）、Songkran；customer relations 是 [en-F2] 的部门名（en-F1-8.md 已列）；邮箱 nam_bkk@example.com 里的 example。
- 一看就懂的派生词、复合词（词根已是词条）：tonight（18 课；to + night，和 today 同构，en-D9-16.md 已定可以）、into（30 课；in + to）、quietly / differently / perfectly / sadly / clearly / directly（quiet、different、perfect、sad、clear、direct 是词条）、quick（quickly 是词条）、choice（choose）、drawing(s)（draw）、listener、caller、translator（translate）、retirement（retire）、frightened / frightens（frightening，en-D9-16.md 已定）、wind（windy）、mainly、usual（usually）、herself（只用一次，同 myself / himself）、T-shirts；序数词 sixth、sixteenth、nineteenth、twentieth、twenty-fifth（first–fifth、eighth 已教）；复合数词 twenty-one、twenty-four、twenty-five、forty-five 等；连字符复合词 two-year、three-day、five-minute、second-year、twenty-six-year-old、five-star、best-paid、eye-catching、double-checked、thank-you note 等（en-F1-8.md 已列）。
- 在意思相同的短语词条里已经学过：give（give back，en-C1-8.md 已定）、stay（stay home，同上）、take（I'll take it、How long does it take?、take a shower 等）、get、look、say、know、find、use、understand、feel、time、home、night / morning / afternoon / evening、name、problem、idea、every（every day）、just（I'm just looking）、again（Again, please.）、lot（a lot）、way（that way）、sound（Sounds good!）、across（across from）、special（special effects）、world（in the world）、end（in the end）、soon（See you soon）、move（move in）、turn、listen、miss。
- 同形不同义、不能再立同形 id 的：kind 作"种类"（that kind of、What kind of…?，4 课，都在 F 阶段；en.kind 是"ใจดี"，要补只能用短语 what kind of …）、left 作"剩下"（no money left，2 课）、her 作宾语（见上）。
- 只用了一两次的：reason（1 课，[en-F16-02]）、chance（3 课；首次的 [en-E12-05] 正好教了同义的 opportunity，[en-F8-06] 有 second chance）、present（present simple，语法术语）、firm、tech（[en-F16-03] 讲解说明了）。ready、picture 原来各用一次，快照时已被审校改掉。

## 拿不准的地方

- [en-C15-01]、[en-C15-02] everything / nothing / everyone / anyone / someone：en-C9-16.md 当时定"按规范算本课语法点用词，不另立词条"。这次建议改为补上：同一组的 something、anything、no one 已经是词条，这五个词后面用得很多，讲解又不进复习。请规划确认。[en-C15-02] 补三个以后是 7 个词条。
- 一词两义用分号隔开（about ประมาณ; เกี่ยวกับ、so ก็เลย…; …จัง…、last …ที่แล้ว; สุดท้าย、when เมื่อไร; ตอนที่、then จากนั้น…; งั้น、ask ถาม; ขอให้、keep เก็บไว้; …ไปเรื่อย ๆ），和已有的 drink（ดื่ม; เครื่องดื่ม）一样。首次出现的课只用到其中一个意思，另一个意思要不要在讲解里补一句，请审校决定。
- 宾格 them / him / us 和 they / he / we 的词义只差括号里的"ใช้เป็นกรรม"，看义选词时靠括号区分，请泰语老师看够不够清楚；her 的问题见上。
- 转写：nothing 写 นาธิง（th 前的 ʌ 照 มาเธอร์、อะนาเธอร์ 写 า）；other 照 the other day、each other、in other words 写 อาเธอร์（[en-F15-03] on the other hand 写的是 อะเธอร์，可以顺便统一）；without 照 within 的 วิธอิน 写 วิธเอาท์；us 写 อัส；Dear … 照 Dear Sir or Madam 写 เดียร์。
- A、B 阶段的 A6-01（with）、A6-05（but）、B1-01（why）、B1-03（when）、B3-03（then）、B6-03（about）补完都是 7 个词条，这几课是 6 分钟、7 分钟的短课，配套练习会多几道题。按规则不能挪到首次出现之后，所以照放；minutes 要不要调，请规划决定。
