# 韩语课补词（基础词缺口）审校备注

写课时有一批日常词在对话和读物里用了，但没有任何一课把它们列为词条（各单元备注 ko-C9-16.md、ko-D9-16.md、ko-E1-8.md、ko-E9-16.md、ko-F1-8.md、ko-F9-16.md 都提到过）。这次把它们补成词条，每个词只教一次。

做法：
- 候选：各单元审校备注里列出的"超纲基础词"，加上两遍扫描——一个按词切分、去掉常见助词和词尾的启发式脚本，以及韩语形态分析器（Kiwi）做的词元对照——扫描对象是按 course.json 顺序的全部对话句和读物正文。和已有词条对照时，词典形（생각하다）、A–B 阶段的 해요 形（바빠요）、名词 + 하다 都算已教。只看 2 课以上用到的词，再逐个人工筛选。
- 位置：放在第一次用到这个词的课（对话或读物正文）；那一课已有 6 个词条（读物 5 个）时，放在同一单元里、首次出现之前最近的有空位的课；从不放在首次出现之后。几个词抢同一个空位时，先给更常用、更基础的词。
- 词条：id 按现有写法（하다 动词写成 ko.X-hada，同音词加后缀），text 用词典形，reading 按实际发音的 RR（不写紧音化，ㅢ 写 ui），泰语词义和转写按 content/_review/ko.md 的约定；词义和全课其他词条不重复（`npm run dupes -- --target ko --meanings` 通过）。对话、读物正文、讲解和原有词条都没改。
- 结果：新增 103 个词条，分布在 98 课（C 阶段 6 个、D 44 个、E 24 个、F 29 个）。`npm run validate -- --target ko` 通过。

## 新增词条（按课程顺序）

- [ko-C6-05] 얼마나 (ko.eolmana): first used in ko-C6-05 dialogue
- [ko-C7-04] 가장 (ko.gajang): first used in ko-C7-04 dialogue
- [ko-C10-04] 다 (ko.da): first used in ko-C10-04 dialogue
- [ko-C15-r01] 맛 (ko.mat): first used in ko-C15-r01 passage
- [ko-C16-01] 생활 (ko.saenghwal): first used in ko-C16-01 dialogue
- [ko-C16-04] 편하다 (ko.pyeon-hada): first used in ko-C16-04 dialogue
- [ko-D1-01] 그럼요 (ko.geureomyo): first used in ko-D1-03 dialogue — ko-D1-03 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-D1-02] 어떤 (ko.eotteon): first used in ko-D1-02 dialogue
- [ko-D1-05] 어제 (ko.eoje): first used in ko-D1-05 dialogue
- [ko-D3-01] 마음 (ko.maeum): first used in ko-D3-01 dialogue
- [ko-D6-r02] 생각나다 (ko.saenggangnada): first used in ko-D6-r02 passage
- [ko-D7-06] 아직 (ko.ajik): first used in ko-D7-06 dialogue
- [ko-D7-06] 잘되다 (ko.jaldoeda): first used in ko-D7-06 dialogue
- [ko-D9-01] 열심히 (ko.yeolsimhi): first used in ko-D9-01 dialogue
- [ko-D9-02] 다니다 (ko.danida): first used in ko-D9-03 dialogue — ko-D9-03 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-D9-03] 가지다 (ko.gajida): first used in ko-D9-03 dialogue
- [ko-D9-04] 그렇게 (ko.geureoke): first used in ko-D9-04 dialogue
- [ko-D9-05] 요즘 (ko.yojeum): first used in ko-D9-05 dialogue
- [ko-D9-06] 이제 (ko.ije): first used in ko-D9-06 dialogue
- [ko-D9-r01] 중요하다 (ko.jungyo-hada): first used in ko-D9-r01 passage
- [ko-D10-01] 그때 (ko.geuttae): first used in ko-D10-01 dialogue
- [ko-D10-03] 놀다 (ko.nolda): first used in ko-D10-03 dialogue
- [ko-D10-03] 얼굴 (ko.eolgul): first used in ko-D10-04 dialogue — ko-D10-04 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-D10-04] 이야기 (ko.iyagi): first used in ko-D10-04 dialogue
- [ko-D10-06] 이렇게 (ko.ireoke): first used in ko-D10-06 dialogue
- [ko-D10-r02] 잡다 (ko.japda): first used in ko-D10-r02 passage
- [ko-D11-02] 공원 (ko.gongwon): first used in ko-D11-02 dialogue
- [ko-D11-03] 새 (ko.sae): first used in ko-D11-r01 passage — ko-D11-r01 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-D11-04] 울다 (ko.ulda): first used in ko-D11-04 dialogue
- [ko-D11-05] 뛰다 (ko.ttwida): first used in ko-D11-06 dialogue — ko-D11-06 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-D11-06] 이런 (ko.ireon): first used in ko-D11-06 dialogue
- [ko-D11-r02] 가까이 (ko.gakkai): first used in ko-D11-r02 passage
- [ko-D11-r02] 훨씬 (ko.hwolssin): first used in ko-D11-r02 passage
- [ko-D12-01] 힘들다 (ko.himdeulda): first used in ko-D12-01 dialogue
- [ko-D12-02] 그러니까 (ko.geureonikka): first used in ko-D12-05 dialogue — ko-D12-05 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-D12-03] 심하다 (ko.sim-hada): first used in ko-D12-04 dialogue — ko-D12-04 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-D12-04] 지난달 (ko.jinandal): first used in ko-D12-04 dialogue
- [ko-D12-05] 거의 (ko.geoui): first used in ko-D12-05 dialogue
- [ko-D12-06] 도서관 (ko.doseogwan): first used in ko-D12-r01 passage — ko-D12-r01 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-D12-r01] 나쁘다 (ko.nappeuda): first used in ko-D12-r01 passage
- [ko-D13-r02] 다녀오다 (ko.danyeooda): first used in ko-D13-r02 passage
- [ko-D13-r02] 지난주 (ko.jinanju): first used in ko-D13-r02 passage
- [ko-D14-01] 끝 (ko.kkeut): first used in ko-D14-01 dialogue
- [ko-D14-05] 그런 (ko.geureon): first used in ko-D14-05 dialogue
- [ko-D14-r02] 새롭다 (ko.saeropda): first used in ko-D14-r02 passage
- [ko-D15-r01] 말씀하다 (ko.malsseum-hada): first used in ko-D15-r01 passage
- [ko-D16-01] 여러 (ko.yeoreo): first used in ko-D16-01 dialogue
- [ko-D16-04] 생각하다 (ko.saenggak-hada): first used in ko-D16-04 dialogue
- [ko-D16-06] 대학교 (ko.daehakgyo): first used in ko-D16-r01 passage — ko-D16-r01 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-D16-r01] 자기 (ko.jagi): first used in ko-D16-r01 passage
- [ko-E1-r01] 들어가다 (ko.deureogada): first used in ko-E1-r01 passage
- [ko-E2-03] 이해하다 (ko.ihae-hada): first used in ko-E2-03 dialogue
- [ko-E2-04] 멀리 (ko.meolli): first used in ko-E2-04 dialogue
- [ko-E3-01] 기억나다 (ko.gieongnada): first used in ko-E3-01 dialogue
- [ko-E3-06] 빠르다 (ko.ppareuda): first used in ko-E3-06 dialogue
- [ko-E3-r01] 다들 (ko.dadeul): first used in ko-E3-r01 passage
- [ko-E4-03] 무엇 (ko.mueot): first used in ko-E4-04 dialogue — ko-E4-04 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-E4-r02] 갑자기 (ko.gapjagi): first used in ko-E4-r02 passage
- [ko-E5-04] 내용 (ko.naeyong): first used in ko-E5-04 dialogue
- [ko-E5-r01] 원하다 (ko.won-hada): first used in ko-E5-r02 passage — ko-E5-r02 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-E5-r02] 높다 (ko.nopda): first used in ko-E5-r02 passage
- [ko-E6-02] 켜다 (ko.kyeoda): first used in ko-E6-03 dialogue — ko-E6-03 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-E6-04] 작년 (ko.jangnyeon): first used in ko-E6-r02 passage — ko-E6-r02 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-E6-r01] 땅 (ko.ttang): first used in ko-E6-r01 passage
- [ko-E6-r02] 올해 (ko.olhae): first used in ko-E6-r02 passage
- [ko-E7-r01] 이유 (ko.iyu): first used in ko-E7-r01 passage
- [ko-E7-r02] 숫자 (ko.sutja): first used in ko-E7-r02 passage
- [ko-E8-03] 신문 (ko.sinmun): first used in ko-E8-03 dialogue
- [ko-E8-05] 찾아보다 (ko.chajaboda): first used in ko-E8-05 dialogue
- [ko-E8-06] 제목 (ko.jemok): first used in ko-E8-06 dialogue
- [ko-E11-r01] 그러나 (ko.geureona): first used in ko-E11-r01 passage
- [ko-E14-04] 바뀌다 (ko.bakkwida): first used in ko-E14-04 dialogue
- [ko-E15-01] 경우 (ko.gyeongu): first used in ko-E15-02 dialogue — ko-E15-02 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-E15-r02] 내년 (ko.naenyeon): first used in ko-E15-r02 passage
- [ko-F1-r02] 이후 (ko.ihu): first used in ko-F1-r02 passage
- [ko-F2-05] 붙이다 (ko.buchida-stick): first used in ko-F2-06 dialogue — ko-F2-06 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-F2-06] 모습 (ko.moseup): first used in ko-F2-06 dialogue
- [ko-F2-r01] 최근 (ko.choegeun): first used in ko-F2-r01 passage
- [ko-F2-r02] 대부분 (ko.daebubun): first used in ko-F2-r02 passage
- [ko-F3-01] 특별하다 (ko.teukbyeol-hada): first used in ko-F3-02 dialogue — ko-F3-02 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-F3-04] 한자 (ko.hanja): first used in ko-F3-05 dialogue — ko-F3-05 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-F3-05] 모양 (ko.moyang): first used in ko-F3-05 dialogue
- [ko-F4-01] 퇴근하다 (ko.toegeun-hada): first used in ko-F4-01 dialogue
- [ko-F4-03] 아무리 (ko.amuri): first used in ko-F4-03 dialogue
- [ko-F4-04] 이미 (ko.imi): first used in ko-F4-r01 passage — ko-F4-r01 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-F4-04] 그녀 (ko.geunyeo): first used in ko-F4-r02 passage — ko-F4-r02 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-F4-05] 원래 (ko.wollae): first used in ko-F4-06 dialogue — ko-F4-06 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-F4-06] 느끼다 (ko.neukkida): first used in ko-F4-06 dialogue
- [ko-F4-r01] 얻다 (ko.eotda): first used in ko-F4-r01 passage
- [ko-F4-r02] 늘 (ko.neul): first used in ko-F4-r02 passage
- [ko-F6-02] 극장 (ko.geukjang): first used in ko-F6-02 dialogue
- [ko-F7-05] 느낌 (ko.neukkim): first used in ko-F7-05 dialogue
- [ko-F7-06] 세상 (ko.sesang): first used in ko-F7-06 dialogue
- [ko-F9-02] 주로 (ko.juro): first used in ko-F9-02 dialogue
- [ko-F10-02] 공장 (ko.gongjang): first used in ko-F10-02 dialogue
- [ko-F10-03] 다만 (ko.daman): first used in ko-F10-03 dialogue
- [ko-F11-03] 완전히 (ko.wanjeonhi): first used in ko-F11-03 dialogue
- [ko-F11-r01] 분명하다 (ko.bunmyeong-hada): first used in ko-F11-r01 passage
- [ko-F12-04] 부분 (ko.bubun): first used in ko-F12-04 dialogue
- [ko-F12-06] 제대로 (ko.jedaero): first used in ko-F12-r02 passage — ko-F12-r02 已满（含本次新增），放在同单元首次出现之前最近有空位的课
- [ko-F12-r01] 더욱 (ko.deouk): first used in ko-F12-r01 passage
- [ko-F12-r02] 오히려 (ko.ohiryeo): first used in ko-F12-r02 passage
- [ko-F15-01] 태어나다 (ko.taeeonada): first used in ko-F15-01 dialogue

## 没能加上的词（需要规划决定）

下面 37 个词也是 2 课以上用到、没有教过的基础词，但按规则放不进去：首次出现的那一课已满，而同一单元里在它之前的课也没有空位（多半因为首次出现在单元第一课，或前面的空位已经给了更常用的词）。建议规划在这些课里换掉一个次要词条，或允许这几课有第 7 个词条：

- 항상：first used in ko-D9-02；ko-D9-01…D9-02 的空位已用于 D9-01 열심히、D9-02 다니다
- 대화：first used in ko-D9-03；ko-D9-01…D9-03 的空位已用于 D9-01 열심히、D9-02 다니다、D9-03 가지다
- 낮다：first used in ko-D9-04；ko-D9-01…D9-04 的空位已用于 D9-01 열심히、D9-02 다니다、D9-03 가지다、D9-04 그렇게
- 지난번：first used in ko-D9-06；ko-D9-01…D9-06 的空位已用于 D9-01 열심히、D9-02 다니다、D9-03 가지다、D9-04 그렇게、D9-05 요즘、D9-06 이제
- 가지：first used in ko-D9-r01；ko-D9-01…D9-r01 的空位已用于 D9-01 열심히、D9-02 다니다、D9-03 가지다、D9-04 그렇게、D9-05 요즘、D9-06 이제、D9-r01 중요하다
- 알아보다：first used in ko-D9-r01；ko-D9-01…D9-r01 的空位已用于 D9-01 열심히、D9-02 다니다、D9-03 가지다、D9-04 그렇게、D9-05 요즘、D9-06 이제、D9-r01 중요하다
- 눕다：first used in ko-D12-01；ko-D12-01 的空位已用于 D12-01 힘들다
- 새벽：first used in ko-D12-01；ko-D12-01 的空位已用于 D12-01 힘들다
- 생선：first used in ko-D12-02；ko-D12-01…D12-02 的空位已用于 D12-01 힘들다、D12-02 그러니까
- 올라가다：first used in ko-D12-05；ko-D12-01…D12-05 的空位已用于 D12-01 힘들다、D12-02 그러니까、D12-03 심하다、D12-04 지난달、D12-05 거의
- 움직이다：first used in ko-D12-r01；ko-D12-01…D12-r01 的空位已用于 D12-01 힘들다、D12-02 그러니까、D12-03 심하다、D12-04 지난달、D12-05 거의、D12-06 도서관、D12-r01 나쁘다
- 글：first used in ko-D16-01；ko-D16-01 的空位已用于 D16-01 여러
- 곧：first used in ko-E1-04；ko-E1-01…E1-04 都已满
- 점：first used in ko-E1-05；ko-E1-01…E1-05 都已满
- 국：first used in ko-E2-01；ko-E2-01 已满
- 똑같다：first used in ko-E2-01；ko-E2-01 已满
- 여행사：first used in ko-E4-01；ko-E4-01 已满
- 어젯밤：first used in ko-E5-01；ko-E5-01 已满
- 학년：first used in ko-E5-05；ko-E5-01…E5-05 的空位已用于 E5-04 내용
- 출근하다：first used in ko-E6-04；ko-E6-01…E6-04 的空位已用于 E6-02 켜다、E6-04 작년
- 점점：first used in ko-E6-05；ko-E6-01…E6-05 的空位已用于 E6-02 켜다、E6-04 작년
- 해마다：first used in ko-E6-05；ko-E6-01…E6-05 的空位已用于 E6-02 켜다、E6-04 작년
- 만약：first used in ko-E6-06；ko-E6-01…E6-06 的空位已用于 E6-02 켜다、E6-04 작년
- 줄다：first used in ko-E6-r01；ko-E6-01…E6-r01 的空位已用于 E6-02 켜다、E6-04 작년、E6-r01 땅
- 궁금하다：first used in ko-E6-r02；ko-E6-01…E6-r02 的空位已用于 E6-02 켜다、E6-04 작년、E6-r01 땅、E6-r02 올해
- 아까：first used in ko-E8-01；ko-E8-01 已满
- 힘：first used in ko-E15-02；ko-E15-01…E15-02 的空位已用于 E15-01 경우
- 결혼하다：first used in ko-F2-02；ko-F2-01…F2-02 都已满
- 그만두다：first used in ko-F2-03；ko-F2-01…F2-03 都已满
- 낳다：first used in ko-F2-03；ko-F2-01…F2-03 都已满
- 상황：first used in ko-F2-03；ko-F2-01…F2-03 都已满
- 떠나다：first used in ko-F2-04；ko-F2-01…F2-04 都已满
- 마을：first used in ko-F3-01；ko-F3-01 的空位已用于 F3-01 특별하다
- 그만큼：first used in ko-F3-03；ko-F3-01…F3-03 的空位已用于 F3-01 특별하다
- 여기다：first used in ko-F3-03；ko-F3-01…F3-03 的空位已用于 F3-01 특별하다
- 오랫동안：first used in ko-F3-03；ko-F3-01…F3-03 的空位已用于 F3-01 특별하다
- 꽤：first used in ko-F9-01；ko-F9-01 已满

其中 어젯밤（= 어제 + 밤）、출근하다（[ko-D8-r01] 첫 출근、[ko-D13-04] 출퇴근 시간）、결혼하다（[ko-E2-05] 결혼식）、여행사（여행 + 사）可以从已学词推出来，缺口影响较小；아까、곧、항상、낮다、상황、힘、국、똑같다、궁금하다、만약 等最好找地方补上。

另外：
- 이야기하다（首次在 [ko-D9-01]）：[ko-D9-01] 只有一个空位，给了同一课首次出现的 열심히（否则 열심히 在全课程都没法教）。名词 이야기 在 [ko-D10-04] 作为词条教，词义写了"이야기하다 = พูดคุย เล่า"，之后的 이야기하다、얘기하다 都可以按"名词 + 하다"理解；但 [ko-D9-01]、[ko-D9-r01] 两处用在名词教之前。

## 有意没加的词

- 语法点或讲解里已经教过：나 / 너 / 응 / 아니（[ko-E3-01] 반말 讲解）、아무것도 / 아무도（[ko-D6-04] 아무 N도）、때문에（[ko-D2-04]）、덕분에（[ko-D5-05]）、정도（[ko-C15-05] N 정도）、만큼、-기 위해서、에 대해서、을 통해서、에 따라、-아/어 보이다（[ko-D3-01]，被动 보이다 在 [ko-E6-01]）、-는 데 돈이 들다（[ko-D13-04]）、번째（[ko-D9-r01] 讲解）、적·셈·뿐·터·마련 等。
- 已有词条的别的形式或可以直接推出：이것 / 그것（= 이거 / 그거）、그러면（= 그럼）、충분하다（[ko-D12-03] 충분히）、오래되다（[ko-C5-06] 오래）、출발하다 / 실패하다（名词 출발、실패 已是词条）、연결하다（[ko-C16-02] 연결되다）、시작되다 / 진행되다 / 계속되다、멋지다（멋있어요）、대학（대학생、대학교）、외국（외국인、외국어）、커지다 / 달라지다 / 없어지다（-아/어지다）、어려움、걸어가다、회의실。
- 专有名词、外来词、感叹词：토픽（TOPIK，12 课用到）、방콕、명동、한강、쇼핑、팀、포크、마사지、메모、하하、음、와、에이。
- 只在 1 课里用到的词（如 수학、닭、값、전혀、역시、절대、자세히、스스로、인생、순간、종류、관계、기계、아줌마）没有补。

## 拿不准的地方

- [ko-E5-r01] 원하다：首次在 [ko-E5-r02]，那篇读物只剩一个空位（给了同时首次出现的 높다），按规则放进前一篇读物的生词表，而 [ko-E5-r01] 正文里没有这个词。可以接受吗？
- [ko-C7-04] 가장、[ko-C16-04] 편하다、[ko-E15-01] 경우：三个词本来由语法点带出（N 중에서 제일/가장、V-기 편해요、-(으)ㄹ 경우），讲解不进复习，所以补成词条。경우 的语法课 [ko-E15-02] 已满，词条放在前一课 [ko-E15-01]，比语法讲解早一课。
- [ko-C15-r01] 맛：[ko-A6-04] 的讲解说过 맛 = รส（맛있어요），但一直不是词条，读物里单独用了，所以补上。
- [ko-C10-04] 다（ko.da）：文字和 [ko-A2-03] 的音节练习 다（ko.syl-da，kind syllable）相同；kind 不同，查重不算重复，但请开发确认按文字生成的配音不会混用。
- [ko-D9-02] 다니다：首次是 [ko-D9-03] 的 넣고 다니면서（带着到处走），词义写了"ไปเป็นประจำ (โรงเรียน ที่ทำงาน), ไปไหนมาไหน"两层意思。
- id：붙이다 用 ko.buchida-stick（[ko-C10-01] 부치다 已是 ko.buchida，两者读音都是 buchida，照 ko.butda-stick 的写法加后缀）。以后若补 낮다，id 应为 ko.natda-low（낫다 已是 ko.natda）。
- 为了词义不和已有词条撞车：힘들다 写"เหนื่อย, หนัก (ทำได้ยาก)"（고생하다 是"ลำบาก, เหนื่อยยาก"）、분명하다 写"ชัดแจ้ง, แน่ชัด"（명확하다 是"ชัดเจน"）；近义词靠括号区分：가장 / 제일、다 / 모두、다들 / 여러분、이미 / 벌써、느낌 / 기분、극장 / 영화관、이런·그런（วางหน้าคำนาม）/ 이렇게·그렇게（ขยายกริยา）。请泰语老师看是否自然。
- 泰文转写：새롭다 แซรบตา（闭音节 ㅗ 省略 โ，和 [ko-E13-01] 외롭다 เวรบตา 同样容易被读成 แซ，请一并决定）；올해 อลแฮ、놀다 นลดา 也按闭音节 ㅗ 省略 โ 的约定写；다 ทา 拼出来是现成的泰语词（ทา = 涂抹），不粗俗。
