import { Novel, Chapter } from '../types/novel';

export const SAMPLE_NOVEL: Novel = {
  id: 'sample_novel_1',
  title: '九霄天帝诀 (Nine Heavens Emperor Scripture)',
  translatedTitle: 'Nine Heavens Emperor Scripture',
  author: '天蚕 (Heavenly Silkworm)',
  description: 'An orphaned youth discovers a dormant ancient ring within his dantian, defying the heavens to carve his immortal path.',
  genre: 'xianxia',
  chapterIds: ['sample_chap_1', 'sample_chap_2'],
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export const SAMPLE_CHAPTERS: Chapter[] = [
  {
    id: 'sample_chap_1',
    novelId: 'sample_novel_1',
    index: 1,
    chineseTitle: '第一章 陨落的天才与神秘古戒',
    translatedTitle: 'Chapter 1: The Fallen Prodigy and the Mysterious Ancient Ring',
    rawChineseContent: `青石镇，林家演武场。

“斗之气，三段！”

望着测验魔石碑上闪亮的五个大字，少年面无表情，唇角噙着一抹自嘲，紧握的手掌因为用力过度，指甲深深地刺进了掌心之中，带来一阵阵钻心的微痛。

“林枫，斗之气，三段！级别：低级！”测验碑旁，中年男子冷漠地宣布着结果。

话音刚落，演武场周围便骤然爆发出一阵嘲弄的喧哗声。

“呵呵，意料之中，这个曾经名动青石镇的‘第一天才’，如今三年过去了，修为非但没有寸进，居然还倒退到了练气三层，真是给林家丢人现眼！”

“就是，听说连隔壁云岚宗的退婚使者都已经启程，要来我们林家当面悔婚了呢！”

面对四周刺耳的冷嘲热讽，林枫深深吸了一口气，神色平静地转过身去。若是换作三年前，这群人在他面前不过是摇尾乞怜的蝼蚁，有眼不识泰山罢了。然而修仙之路漫漫，丹田破损，经脉闭塞，任凭他如何日夜苦修吞纳天地灵气，那凝聚在体内的灵力都会无端消逝得无影无踪。

回到简陋的竹舍，林枫脱下浸满汗水的青衫，抚摸着手指上那一枚漆黑而毫无光泽的古朴铁戒。那是已故母亲留给他的唯一遗物。

“难道我林枫此生，注定只能成为旁人眼中的井底之蛙吗？”林枫喃喃自语，指尖不慎被戒边锋利的凹槽割破，一滴殷红的精血悄然浸润入戒指之中。

下一刻，那沉寂了三年的黑色古戒，竟骤然泛起了一层璀璨夺目的幽青色光芒！识海深处，一道苍老而威严的笑声蓦然回荡开来：

“桀桀桀……好一个坚韧的小娃娃。苦熬三年，老夫终于吸饱了你丹田内的纯阳灵气，重见天日了！”`,
    translatedContent: `Qingshi Town, Lin Family Martial Arena.

"Dou Qi, Third Stage!"

Gazing at the five luminous characters etched across the testing stele, the youth’s expression remained indifferent. A faint, self-mocking sneer curled upon his lips as his clenched fists dug so deeply into his palms that his fingernails pierced flesh, sending sharp stabs of pain shooting through his arms.

"Lin Feng: Dou Qi, Third Stage! Grade: Low!" Beside the stele, a middle-aged proctor announced the result with cold detachment.

The moment the words rang out, an uproar of mocking jeers erupted across the surrounding plaza.

"Heh, exactly as expected. Three years have passed, yet this supposed 'number one genius' who once shook our entire town hasn't made an inch of progress. In fact, he’s plummeted all the way down to the third tier of Qi Condensation! What an absolute disgrace to the Lin Family."

"Indeed. I hear that even the envoys from the Misty Cloud Sect have already departed. They’re coming straight to our gates to annul the marriage agreement in person!"

Faced with the barrage of venomous sneers, Lin Feng took a slow, deep breath and calmly turned away. Three years ago, these very same sycophants were nothing more than crawling ants before him—fools with eyes who failed to recognize Mount Tai. Yet the path of immortal cultivation was unforgiving. His dantian was fractured and his meridians blocked; no matter how diligently he channeled the spiritual energy of heaven and earth day and night, every wisp of gathered power vanished into thin air like water through a sieve.

Returning to his spartan bamboo cottage, Lin Feng cast aside his sweat-soaked robe and gently caressed the plain, pitch-black iron ring upon his finger. It was the sole keepsake bequeathed to him by his late mother.

"Is Lin Feng truly destined to live as a frog at the bottom of a well in the eyes of the world?" he murmured softly. 

Distracted by the bitter thought, his thumb brushed against a sharp ridge along the ring's edge. A single crimson drop of essence blood seeped quietly into the dark band.

In the next heartbeat, the ancient ring that had lain dormant for three years suddenly blazed with a resplendent, ghostly-cyan radiance! Deep within his sea of consciousness, an ancient and imposing laugh echoed thunderously:

"Jie jie jie... What an unyielding little brat! After three long years, this old master has finally absorbed enough pure Yang qi from your dantian to see the light of day once more!"`,
    status: 'translated',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000
  },
  {
    id: 'sample_chap_2',
    novelId: 'sample_novel_1',
    index: 2,
    chineseTitle: '第二章 戒指里的老爷爷与九霄帝诀',
    translatedTitle: 'Chapter 2: The Old Master in the Ring and the Imperial Scripture',
    rawChineseContent: `“谁？是谁在装神弄鬼，给我滚出来！”

突如其来的诡异笑声让林枫浑身毛孔骤然紧缩，身体本能地暴退数步，后背紧紧贴在冰凉的竹墙上。他双眸如鹰隼般扫视着四周，掌心之中暗扣着三枚精钢飞刀，警惕到了极点。

“小家伙，不必如此惊慌。若是老夫对你有歹意，凭你现在练气三层那点微末道行，早便成了孤魂野鬼了。”

随着苍老的声音再度响起，那枚漆黑铁戒表面浮现出一团虚幻的白雾。雾气缭绕翻腾，最终在林枫震动惊骇的目光中，凝聚成了一道半透明的白发老者身影。

老者须发皆白，身披宽大的鹤氅道袍，虽然只是一具灵魂虚影，但周身隐隐散发出的威压，竟让整座竹舍内的空气都仿佛凝固了一般！那是远超筑基、甚至凌驾于结丹宗师之上的恐怖气息！

“你……你到底是什么人？为何会藏在我母亲留下的戒指里？”林枫强压下狂跳的心脏，沉声质问道。

白发老者抚了抚长须，眼中闪过一抹赞许：“面对未知强敌临危不乱，心性倒算上乘。至于老夫的名号，岁月太久，早已记不大清了。当年遭逆徒暗算，肉身陨灭，只剩一缕残魂寄托于这枚‘九曜神戒’之中陷入沉睡。”

说到这里，老者戏谑地瞥了一眼林枫干瘪的丹田：“若非这三年来你夜以继日地苦修，以至精至纯的先天灵气温养，老夫恐怕还要沉睡数百年方能苏醒。说起来，倒是老夫借了你三年的造化。”

林枫闻言，瞳孔骤然收缩，旋即双拳死死攥紧，眼中喷薄出压抑已久的怒焰：“你说什么？！这三年来我从天才跌落神坛，受尽族人白眼嘲弄，丹田内的灵力不翼而飞，全都是因为你在暗中吞噬我的灵气？！”

“不知天高地厚的小子，老夫乃是万界至尊药圣！”老者冷哼一声，拂袖道：“吃了你三年微末灵气，老夫自会百倍偿还于你！今日便传你无上天阶功法——《九霄天帝诀》！”`,
    status: 'raw',
    createdAt: Date.now() - 1800000,
    updatedAt: Date.now() - 1800000
  }
];

