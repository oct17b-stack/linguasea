# 英语课 A 阶段扩充（第一部分）审校备注

范围：en-A1-05 … en-A6-06（单元 A1–A6 新增的第 5、6 课）和 en-A7 … en-A10 全部课（共 36 课）。AI 初稿。

写法沿用 content/_review/en.md 的约定：美式 IPA（词典式，短语和对话给实词标重音，虚词弱读）；th 转写一律 ธ；the 写 เธอะ、元音前写 ธิ；对话只用按课程顺序已学的词（A7–A16 在 B1 之前，不用 B 阶段词汇），A 阶段每句 ≤ 8 词、≤ 4 句；泰语译文不用 ครับ/ค่ะ，Nam 自称 ฉัน，男性说话人自称 ผม，第三人称女性用 เขา。大纲的词条（id、文字、读音、kind）全部照抄，没有改动，也没有新增词条。

需要确认的地方：

- [en-A7-01] [en-A7-03] 字母配音：A 的 `say` 写 ay（避免读成冠词 ə），Z 的 `say` 写 zee（避免设备 TTS 用英式 zed）；其余字母不写 say，直接念大写字母。生成配音后请确认 ay 读 /eɪ/（CMUdict 首选 EY，其次 AY），I、O、U、Y、R 单念时读字母名。 ✅ resolved: 写法保留；生成配音后要听的项目已并入 en.md 的「配音检查」一条。
- [en-A7-04] [en-A7-06] [en-A9-04] 对话里的拼读 N-A-N?、N-A-M.、G-A-V-I-N.：对话行没有 say，请确认 TTS 逐个念字母，不会把 NAN/NAM 当成单词读。不行的话可改写成 N, A, M 或单独录音。 ✅ resolved: 并入 en.md 的「配音检查」一条（生成配音后统一听，不行再改成 N, A, M 或录音）。
- [en-A7-01] … [en-A7-05] 字母词条：meaning 写"ตัวอักษร + 泰国通行的字母名"（和 translit 基本重复），只有 Z 写 ตัวอักษร แซด (อเมริกันเรียก ซี)；translit 用通行字母名，V 写 วี [v]、Z 写 ซี [z]，把 A2 的方括号约定延伸到字母单元（C 仍写 ซี）。练习：每个字母一道 listen-text（2–3 个读音易混的字母作干扰项，有的是后面几课才学的字母，如 J 的干扰项 G；字形学生早已认识）+ 一道 choose-meaning，每课 2 道 speak。请确认这种写法。 ✅ resolved: 可以。字母属发音类词条，词义和转写重复不影响出题；[v]/[z] 方括号延伸到字母单元合理。
- [en-A2-05] ship/sheep 转写 ชิป [sh] / ชีป [sh]（同 A2-04 she ชี [sh]），live/leave 写 ลิฟว์ / ลีฟว์（ว์ 表示 v，同 five ไฟว์）。B2-04 的 cheap 写 ชีพ，和 sheep ชีป [sh] 只差 พ/ป 与方括号，请确认不会混淆。 ✅ resolved: 词尾 p 已统一写 ป（见 en.md 约定），cheap 现在写 ชีป，和 sheep ชีป [sh] 只差方括号；ch/sh 只在 A2 用方括号区分，别处都写 ช，泰文本来就分不出，不会额外混淆。
- [en-A2-06] 按大纲，tell 的听辨干扰项是 en.ten（A4-02 才教），rise 的是 en.rice（A2-03）。转写 รายส์ / ไรซ์、เบด / เบ็ท 沿用 A2-04 eyes/ice、wide/white 的写法（浊辅音前元音长）。bet 的词义写 พนัน, เดิมพัน，是否合适？ ✅ resolved: 都合适。ten 虽在 A4-02 才作词条，字形和意思学生早已认识；bet 的 พนัน, เดิมพัน 准确。
- [en-A1-06] 对话：车上有人说 Excuse me. 要过，Nam 没听清 Pardon?，对方再说 Excuse me, please.，Nam 答 Oh! Sure. Sorry!。Welcome!、No problem.、Me too. 放不进 4 句，只在讲解里说明（Welcome! 与 You're welcome.、Me too. 与 You too. 的区别）。另外 Pardon? 在美式口语里偏正式，讲解同时给了 Sorry?。 ✅ resolved: 对话自然，讲解的处理合适，不改。
- [en-A3-05] Toronto：交换生的家乡（一次性专名，təˈrɑːntoʊ）。C 阶段大纲里 Emma 的家也在 Toronto，这里是另一个人，不冲突。 ✅ resolved: 按负责人决定，A–B 不点明 Emma 的家乡（后面阶段定为加拿大的一个小镇），这位住 Toronto 的交换生是别人，不冲突；已记进 en.md「故事设定（A–B）」。
- [en-A3-06] Tom Miller：欢迎会上的一位外国成年人（一次性路人），用来示范 Mr. + 姓 → Call me Tom!。Nam 只说 My nickname is Nam.，没有出现她的真名和姓（固定设定里没有，避免自己编）。但 A7 单元的 AI 情景要她拼写名和姓、B15 要填全名，建议四门课统一给 Nam 定一个泰文全名。 ✅ resolved: A–B 全部不出现 Nam 的全名（B15-04 也只说她填全名），本课程不需要；四门课要不要统一定全名由负责人决定。
- [en-A4-05] Good evening! How many people? Six? / No, only two. A table for two, please. / OK. Your number is twelve.：店员以为 Nam 和门口一大群人是一起的，only 才有理由（导语已交代）；Your number is twelve. 指排队号码（曼谷商场餐厅常见）。是否自然？ ✅ resolved: 自然，导语已交代情景，不改。
- [en-A4-06] 大纲语法写 He's young.，但 he 在 A5-03 才教，讲解改用 She's young.（she 在 A2-04 已出现）。 ✅ resolved: 可以；讲解顺便补了 young 也能放在名词前（a young teacher）。
- [en-A5-05] 大纲语法写 She has a son and a daughter.，但 has 是 A11-06 的词条；这里只在讲解里说明 he/she 用 has，对话用 Do they have children?。请 A11 的作者知悉。 ✅ resolved: 讲解说明即可，A11-06 正式教 has，前后一致。
- [en-A5-06] Nam 只有妹妹 Fah（17 岁），不可能有 niece/nephew，所以对话改成 Emma 给 Nam 看她哥哥一家（A5-02 已说 Emma 有哥哥），新增了"Emma 的哥哥已婚、有个小女儿"这个小设定，请和其他课确认不冲突。we/our 只在讲解里出现。 ✅ resolved: 按负责人决定：Emma 的这位哥哥是哥哥（已婚、有个小女儿），后面阶段另加一个弟弟；已记进 en.md「故事设定（A–B）」。
- [en-A6-06] Right. We eat with a spoon and fork.：eat 的一般现在时用了 we（A6-05 教 I eat / I don't eat）。I'm full. 和 plate 没进对话，只在讲解和练习里。 ✅ resolved: 可以，we eat 不超纲（主语 we 不改变动词形式）。
- [en-A8-05] new 转写 นู（按美式 nuː，同 Tuesday ทูส์เดย์、student สตูเดนท์），没用常见的 นิว。请确认。 ✅ resolved: 保留 นู，和 ทูส์เดย์、สตูเดนท์ 一样按美式 nuː 写（已写进 en.md 约定）。
- [en-A8-06] 大纲题目是 On my desk，但 desk 在 A9-02 才教，对话改成 Emma 在 Nam 房间看电脑和全家福（Nam 的四口之家）；tissue、bottle 没进对话，讲解说明美国 tissue / napkin / toilet paper 的区别。 ✅ resolved: 改得合理，不需要再改。
- [en-A9-05] 对话用泰语词 "kreng jai"（เกรงใจ）做例子，IPA 近似写 ˈkrɛŋ ˈdʒaɪ，en-US 配音会按英语读。可以接受吗？ ✅ resolved: 可以接受，说话的是泰国人，配音读得像英语也不影响理解；读音里的引号已删（读音一律不带引号）。
- [en-A10-01] … [en-A10-04] 国名转写：为了体现美式重音和弱读，Japan 写 จะแพน（不用常见的 เจแปน）、Japanese แจพะนีส、Korea คะรีอะ（不用 โคเรีย）、Korean คะรีอัน、Vietnam วีเอ็ตนาม、Vietnamese วีเอ็ตนะมีส、Malaysia มะเลเชีย、Indonesia อินดะนีเชีย、Singapore ซิงอะพอร์；和英语读音本来就接近的保留通行写法：China ไชน่า、Cambodia แคมโบเดีย、Myanmar เมียนมาร์、India อินเดีย、Asia เอเชีย、America อเมริกา、England อิงแลนด์。请泰语老师确认是否好读（ʒ 没写成 เชอะ，因为 เชอะ 在泰语里是表示不屑的叹词）。 ✅ resolved: 保留。弱读 ə 写 อะ（จะแพน、คะรีอะ、มะเลเชีย）是本课程的统一写法，和 คะเนเดียน、บะแนนะ、พะลีซ 一致，读起来不别扭；ʒ 写 ช 的理由也成立。
- [en-A10-03] 大纲语法写 Where is …? — It's near Thailand. (review)，但 Where is …? 和 near 是 B3-01、B3-02 的词条，按课程顺序还没学，对话没用。Laos 按大纲写 laʊs（美式也常读 ˈlɑːoʊs）。 ✅ resolved: 处理正确；Laos 写 laʊs 没问题（ˈlɑːoʊs 也常见，讲解不必提）。
- [en-A5-05] married 按大纲写 ˈmærid；美式多数人 Mary–marry–merry 合并读 ˈmɛrid（剑桥美式即此）。要不要统一？ ✅ resolved: 保留 ˈmærid（牛津美式写法，本课程 IPA 以牛津/剑桥学习词典为准；合并口音读 ˈmɛrid，学习者听不出差别）。marital ˈmærɪtəl 同理。
