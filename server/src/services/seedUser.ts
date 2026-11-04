import { db } from '../db.js';

const DEFAULT_TERMS = [
  { original: '练气', translation: 'Qi Condensation', category: 'realm', notes: 'Initial cultivation stage' },
  { original: '炼气', translation: 'Qi Refining / Qi Condensation', category: 'realm' },
  { original: '筑基', translation: 'Foundation Establishment', category: 'realm' },
  { original: '金丹', translation: 'Golden Core', category: 'realm' },
  { original: '结丹', translation: 'Core Formation', category: 'realm' },
  { original: '元婴', translation: 'Nascent Soul', category: 'realm' },
  { original: '化神', translation: 'Soul Formation', category: 'realm' },
  { original: '炼虚', translation: 'Void Refining', category: 'realm' },
  { original: '合体', translation: 'Body Integration', category: 'realm' },
  { original: '大乘', translation: 'Mahayana / Great Ascension', category: 'realm' },
  { original: '渡劫', translation: 'Tribulation Transcendence', category: 'realm' },
  { original: '飞升', translation: 'Ascension / Immortal Ascension', category: 'term' },
  { original: '丹田', translation: 'Dantian', category: 'term', notes: 'Energy center in lower abdomen' },
  { original: '识海', translation: 'Sea of Consciousness', category: 'term', notes: 'Mental/spiritual realm in brain' },
  { original: '神识', translation: 'Divine Sense / Spiritual Sense', category: 'term' },
  { original: '经脉', translation: 'Meridians', category: 'term' },
  { original: '灵根', translation: 'Spiritual Roots', category: 'term' },
  { original: '元神', translation: 'Primordial Spirit', category: 'term' },
  { original: '走火入魔', translation: 'Qi Deviation / Cultivation Backlash', category: 'term' },
  { original: '储物戒', translation: 'Spatial Ring / Storage Ring', category: 'item' },
  { original: '灵石', translation: 'Spirit Stones', category: 'item' },
  { original: '飞剑', translation: 'Flying Sword', category: 'item' },
  { original: '掌门', translation: 'Sect Master', category: 'term' },
  { original: '有眼不识泰山', translation: 'having eyes but failing to recognize Mount Tai (failing to recognize a master)', category: 'term' },
  { original: '井底之蛙', translation: 'a frog at the bottom of a well (shortsighted fool)', category: 'term' },
  { original: '扮猪吃老虎', translation: 'playing the pig to eat the tiger (feigning weakness to strike)', category: 'term' },
  { original: '找死', translation: 'courting death!', category: 'term' },
  { original: '不知死活', translation: 'reckless fool / not knowing life from death', category: 'term' },
  { original: '蝼蚁', translation: 'mere ant', category: 'term' }
];

export function seedNewUserData(userId: string) {
  const now = Date.now();

  // 1. Seed user settings
  const insertSettings = db.prepare(`
    INSERT OR IGNORE INTO user_settings (
      user_id, provider, gemini_model, deepseek_model, openai_model,
      default_genre, auto_extract_glossary, reader_theme, font_family,
      font_size, line_height, max_width, view_mode, show_chinese_on_hover
    ) VALUES (?, 'gemini', 'gemini-2.5-flash', 'deepseek-chat', 'gpt-4o-mini', 'xianxia', 1, 'dark', 'serif', 18, 1.8, 'medium', 'english', 1)
  `);
  insertSettings.run(userId);

  // 2. Seed default glossary
  const insertGlossary = db.prepare(`
    INSERT INTO glossary (id, user_id, original, translation, category, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    DEFAULT_TERMS.forEach((t, i) => {
      insertGlossary.run(`gloss_${userId}_${i}_${now}`, userId, t.original, t.translation, t.category, t.notes || null, now);
    });

    // 3. Seed starter sample novel
    const novelId = `nov_sample_${userId}_${now}`;
    const chap1Id = `chap_sample_1_${userId}_${now}`;
    const chap2Id = `chap_sample_2_${userId}_${now}`;

    db.prepare(`
      INSERT INTO novels (id, user_id, title, translated_title, author, description, genre, current_chapter_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      novelId,
      userId,
      '九霄天帝诀 (Nine Heavens Emperor Scripture)',
      'Nine Heavens Emperor Scripture',
      '天蚕 (Heavenly Silkworm)',
      'An orphaned youth discovers a dormant ancient ring within his dantian, defying the heavens to carve his immortal path.',
      'xianxia',
      chap1Id,
      now,
      now
    );

    db.prepare(`
      INSERT INTO chapters (id, novel_id, user_id, chapter_index, chinese_title, translated_title, raw_content, translated_content, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      chap1Id,
      novelId,
      userId,
      1,
      '第一章 陨落的天才与神秘古戒',
      'Chapter 1: The Fallen Prodigy and the Mysterious Ancient Ring',
      `青石镇，林家演武场。\n\n“斗之气，三段！”\n\n望着测验魔石碑上闪亮的五个大字，少年面无表情，唇角噙着一抹自嘲，紧握的手掌因为用力过度，指甲深深地刺进了掌心之中，带来一阵阵钻心的微痛。\n\n“林枫，斗之气，三段！级别：低级！”测验碑旁，中年男子冷漠地宣布着结果。\n\n话音刚落，演武场周围便骤然爆发出一阵嘲弄的喧哗声。\n\n“呵呵，意料之中，这个曾经名动青石镇的‘第一天才’，如今三年过去了，修为非但没有寸进，居然还倒退到了练气三层，真是给林家丢人现眼！”\n\n面对四周刺耳的冷嘲热讽，林枫深深吸了一口气，神色平静地转过身去。若是换作三年前，这群人在他面前不过是摇尾乞怜的蝼蚁，有眼不识泰山罢了。然而修仙之路漫漫，丹田破损，任凭他如何苦修，体内灵力都会无端消逝。\n\n回到竹舍，林枫脱下浸满汗水的青衫，抚摸着手指上的古朴铁戒。指尖不慎被戒边凹槽割破，一滴殷红精血浸润入戒指之中。下一刻，黑色古戒骤然泛起一层幽青色光芒！\n\n“桀桀桀……好一个坚韧的小娃娃。苦熬三年，老夫终于吸饱了你丹田内的纯阳灵气，重见天日了！”`,
      `Qingshi Town, Lin Family Martial Arena.\n\n"Dou Qi, Third Stage!"\n\nGazing at the five luminous characters etched across the testing stele, the youth’s expression remained indifferent. A faint, self-mocking sneer curled upon his lips as his clenched fists dug so deeply into his palms that his fingernails pierced flesh, sending sharp stabs of pain shooting through his arms.\n\n"Lin Feng: Dou Qi, Third Stage! Grade: Low!" Beside the stele, a middle-aged proctor announced the result with cold detachment.\n\nThe moment the words rang out, an uproar of mocking jeers erupted across the surrounding plaza.\n\n"Heh, exactly as expected. Three years have passed, yet this supposed 'number one genius' who once shook our entire town hasn't made an inch of progress. In fact, he’s plummeted all the way down to the third tier of Qi Condensation! What an absolute disgrace to the Lin Family."\n\nFaced with the barrage of venomous sneers, Lin Feng took a slow, deep breath and calmly turned away. Three years ago, these very same sycophants were nothing more than crawling ants before him—fools with eyes who failed to recognize Mount Tai. Yet the path of immortal cultivation was unforgiving. His dantian was fractured; no matter how diligently he channeled spiritual energy, every wisp of gathered power vanished into thin air.\n\nReturning to his bamboo cottage, Lin Feng gently caressed the plain iron ring upon his finger. His thumb brushed against a sharp ridge along the edge, and a single crimson drop of essence blood seeped quietly into the dark band. In the next heartbeat, the ancient ring blazed with a resplendent, ghostly-cyan radiance!\n\n"Jie jie jie... What an unyielding little brat! After three long years, this old master has finally absorbed enough pure Yang qi from your dantian to see the light of day once more!"`,
      'translated',
      now - 3600000,
      now - 3600000
    );

    db.prepare(`
      INSERT INTO chapters (id, novel_id, user_id, chapter_index, chinese_title, translated_title, raw_content, translated_content, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      chap2Id,
      novelId,
      userId,
      2,
      '第二章 戒指里的老爷爷与九霄帝诀',
      'Chapter 2: The Old Master in the Ring and the Imperial Scripture',
      `“谁？是谁在装神弄鬼，给我滚出来！”\n\n突如其来的诡异笑声让林枫浑身毛孔骤然紧缩，身体本能地暴退数步，后背紧紧贴在冰凉的竹墙上。他双眸如鹰隼般扫视着四周，警惕到了极点。\n\n“小家伙，不必如此惊慌。若是老夫对你有歹意，凭你现在练气三层那点微末道行，早便成了孤魂野鬼了。”\n\n随着苍老的声音再度响起，那枚漆黑铁戒表面浮现出一团虚幻的白雾，最终凝聚成了一道半透明的白发老者身影。\n\n“老夫乃是万界至尊药圣！”老者抚须傲然道：“吃了你三年微末灵气，老夫自会百倍偿还于你！今日便传你无上天阶功法——《九霄天帝诀》！”`,
      null,
      'raw',
      now - 1800000,
      now - 1800000
    );
  });

  tx();
}

