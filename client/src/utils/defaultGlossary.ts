import { GlossaryItem } from '../types/novel';

export const DEFAULT_GLOSSARY: Omit<GlossaryItem, 'id'>[] = [
  // Cultivation Realms
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
  { original: '真仙', translation: 'True Immortal', category: 'realm' },
  { original: '金仙', translation: 'Golden Immortal', category: 'realm' },

  // Anatomy & Cultivation Mechanics
  { original: '丹田', translation: 'Dantian', category: 'term', notes: 'Energy center in lower abdomen' },
  { original: '识海', translation: 'Sea of Consciousness', category: 'term', notes: 'Mental/spiritual realm in brain' },
  { original: '神识', translation: 'Divine Sense / Spiritual Sense', category: 'term' },
  { original: '经脉', translation: 'Meridians', category: 'term' },
  { original: '灵根', translation: 'Spiritual Roots', category: 'term' },
  { original: '元神', translation: 'Primordial Spirit', category: 'term' },
  { original: '顿悟', translation: 'Epiphany / Sudden Enlightenment', category: 'term' },
  { original: '走火入魔', translation: 'Qi Deviation / Cultivation Backlash', category: 'term' },
  { original: '心魔', translation: 'Heart Demon / Inner Demon', category: 'term' },
  { original: '天劫', translation: 'Heavenly Tribulation', category: 'term' },
  { original: '雷劫', translation: 'Lightning Tribulation', category: 'term' },
  { original: '天道', translation: 'Heavenly Dao', category: 'term' },
  { original: '因果', translation: 'Karma', category: 'term' },

  // Items & Resources
  { original: '储物戒', translation: 'Spatial Ring / Storage Ring', category: 'item' },
  { original: '储物袋', translation: 'Storage Pouch', category: 'item' },
  { original: '灵石', translation: 'Spirit Stones', category: 'item' },
  { original: '极品灵石', translation: 'Top-grade Spirit Stone', category: 'item' },
  { original: '飞剑', translation: 'Flying Sword', category: 'item' },
  { original: '法宝', translation: 'Dharma Treasure / Magic Artifact', category: 'item' },
  { original: '本命法宝', translation: 'Natal Artifact / Lifebound Artifact', category: 'item' },
  { original: '阵法', translation: 'Formation / Array', category: 'term' },
  { original: '护山大阵', translation: 'Mountain-Protecting Array', category: 'term' },
  { original: '符箓', translation: 'Talisman', category: 'item' },
  { original: '丹药', translation: 'Medicinal Pill / Elixir', category: 'item' },
  { original: '筑基丹', translation: 'Foundation Establishment Pill', category: 'item' },
  { original: '洗髓丹', translation: 'Marrow Cleansing Pill', category: 'item' },

  // Social & Sect Hierarchy
  { original: '掌门', translation: 'Sect Master', category: 'term' },
  { original: '宗主', translation: 'Sect Leader / Sect Master', category: 'term' },
  { original: '太上长老', translation: 'Supreme Elder / Grand Elder', category: 'term' },
  { original: '传功长老', translation: 'Martial Teaching Elder', category: 'term' },
  { original: '真传弟子', translation: 'True Disciple / Core Disciple', category: 'term' },
  { original: '内门弟子', translation: 'Inner Sect Disciple', category: 'term' },
  { original: '外门弟子', translation: 'Outer Sect Disciple', category: 'term' },
  { original: '杂役弟子', translation: 'Handyman Disciple / Servant Disciple', category: 'term' },
  { original: '师尊', translation: 'Master / Honored Master', category: 'term' },
  { original: '师兄', translation: 'Senior Martial Brother', category: 'term' },
  { original: '师姐', translation: 'Senior Martial Sister', category: 'term' },
  { original: '师弟', translation: 'Junior Martial Brother', category: 'term' },
  { original: '师妹', translation: 'Junior Martial Sister', category: 'term' },

  // Idioms & Frequent Metaphors
  { original: '有眼不识泰山', translation: 'having eyes but failing to recognize Mount Tai (failing to recognize a master)', category: 'term' },
  { original: '井底之蛙', translation: 'a frog at the bottom of a well (shortsighted fool)', category: 'term' },
  { original: '扮猪吃老虎', translation: 'playing the pig to eat the tiger (feigning weakness to strike)', category: 'term' },
  { original: '找死', translation: 'courting death!', category: 'term' },
  { original: '不知死活', translation: 'reckless fool / not knowing life from death', category: 'term' },
  { original: '给脸不要脸', translation: 'refusing the face you were given / throwing away kindness', category: 'term' },
  { original: '蝼蚁', translation: 'mere ant', category: 'term' },
  { original: '吐血三升', translation: 'coughing up pints of blood', category: 'term' },
  { original: '顺我者昌，逆我者亡', translation: 'those who obey me will prosper; those who resist will perish', category: 'term' },
  { original: '留得青山在，不怕没柴烧', translation: 'as long as the green mountains remain, there is no fear of running out of firewood (where there is life, there is hope)', category: 'term' }
];

