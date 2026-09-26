const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'static', 'avatars');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 36 diverse characters: 18 boys, 18 girls
const characters = [
  // ─── BOYS (18) ───
  {
    id: 'avatar_01', name: 'Aarav', gender: 'boy',
    skin: '#F5D0A9', skinShadow: '#E5BD92', hair: '#1C1917',
    bg: '#4F46E5', clothes: '#1E3A8A', collar: '#FFFFFF',
    hairStyle: 'boy_side_part', smile: 'open', glasses: null
  },
  {
    id: 'avatar_03', name: 'Rohan', gender: 'boy',
    skin: '#E0AC69', skinShadow: '#CF9957', hair: '#3E2723',
    bg: '#EA580C', clothes: '#DC2626', collar: '#FEE2E2',
    hairStyle: 'boy_wavy_quiff', smile: 'open', glasses: null
  },
  {
    id: 'avatar_05', name: 'Kabir', gender: 'boy',
    skin: '#D8A064', skinShadow: '#C48D52', hair: '#1A1A1A',
    bg: '#059669', clothes: '#065F46', collar: '#D1FAE5',
    hairStyle: 'boy_curly_mop', smile: 'gentle', glasses: 'round_black'
  },
  {
    id: 'avatar_07', name: 'Vikram', gender: 'boy',
    skin: '#BD7A44', skinShadow: '#A66735', hair: '#111827',
    bg: '#2563EB', clothes: '#1D4ED8', collar: '#BFDBFE',
    hairStyle: 'boy_fade_cut', smile: 'open', glasses: null
  },
  {
    id: 'avatar_09', name: 'Arjun', gender: 'boy',
    skin: '#8D5524', skinShadow: '#764319', hair: '#0F172A',
    bg: '#9333EA', clothes: '#6D28D9', collar: '#EDE9FE',
    hairStyle: 'boy_textured_spikes', smile: 'open', glasses: null
  },
  {
    id: 'avatar_11', name: 'Dev', gender: 'boy',
    skin: '#FCD7B0', skinShadow: '#ECC197', hair: '#292524',
    bg: '#D97706', clothes: '#B45309', collar: '#FEF3C7',
    hairStyle: 'boy_straight_fringe', smile: 'gentle', glasses: null
  },
  {
    id: 'avatar_13', name: 'Reyansh', gender: 'boy',
    skin: '#6B4423', skinShadow: '#553317', hair: '#09090B',
    bg: '#0D9488', clothes: '#0F766E', collar: '#CCFBF1',
    hairStyle: 'boy_afro_fade', smile: 'open', glasses: null
  },
  {
    id: 'avatar_15', name: 'Vihaan', gender: 'boy',
    skin: '#F7D2AA', skinShadow: '#E4BD94', hair: '#3B2F2F',
    bg: '#E11D48', clothes: '#BE123C', collar: '#FFE4E6',
    hairStyle: 'boy_modern_quiff', smile: 'open', glasses: null
  },
  {
    id: 'avatar_17', name: 'Aditya', gender: 'boy',
    skin: '#C68642', skinShadow: '#AF7233', hair: '#18181B',
    bg: '#475569', clothes: '#334155', collar: '#E2E8F0',
    hairStyle: 'boy_buzz_cut', smile: 'gentle', glasses: 'square_silver'
  },
  {
    id: 'avatar_19', name: 'Aryan', gender: 'boy',
    skin: '#F5CCA0', skinShadow: '#E0B588', hair: '#4A3728',
    bg: '#0284C7', clothes: '#0369A1', collar: '#E0F2FE',
    hairStyle: 'boy_curtain_bangs', smile: 'open', glasses: null
  },
  {
    id: 'avatar_21', name: 'Sai', gender: 'boy',
    skin: '#995D3F', skinShadow: '#844D32', hair: '#18181B',
    bg: '#F97316', clothes: '#C2410C', collar: '#FFEDD5',
    hairStyle: 'boy_side_fade', smile: 'open', glasses: null
  },
  {
    id: 'avatar_23', name: 'Atharv', gender: 'boy',
    skin: '#DE9E5C', skinShadow: '#C68949', hair: '#1C1917',
    bg: '#16A34A', clothes: '#15803D', collar: '#DCFCE7',
    hairStyle: 'boy_thick_waves', smile: 'gentle', glasses: null
  },
  {
    id: 'avatar_25', name: 'Dhruv', gender: 'boy',
    skin: '#FFDCB1', skinShadow: '#E8C59A', hair: '#27272A',
    bg: '#3B82F6', clothes: '#2563EB', collar: '#DBEAFE',
    hairStyle: 'boy_crop_neat', smile: 'gentle', glasses: 'round_black'
  },
  {
    id: 'avatar_27', name: 'Ishaan', gender: 'boy',
    skin: '#CF9456', skinShadow: '#B87F43', hair: '#3F2E21',
    bg: '#6366F1', clothes: '#4338CA', collar: '#EEF2FF',
    hairStyle: 'boy_playful_spikes', smile: 'open', glasses: null
  },
  {
    id: 'avatar_29', name: 'Ansh', gender: 'boy',
    skin: '#A5673F', skinShadow: '#8F5530', hair: '#18181B',
    bg: '#7C3AED', clothes: '#6D28D9', collar: '#EDE9FE',
    hairStyle: 'boy_swept_fringe', smile: 'open', glasses: null
  },
  {
    id: 'avatar_31', name: 'Vivaan', gender: 'boy',
    skin: '#E8B382', skinShadow: '#D29D6E', hair: '#2E2219',
    bg: '#BE123C', clothes: '#881337', collar: '#FFE4E6',
    hairStyle: 'boy_short_neat', smile: 'open', glasses: null
  },
  {
    id: 'avatar_33', name: 'Krish', gender: 'boy',
    skin: '#794829', skinShadow: '#63381D', hair: '#09090B',
    bg: '#0F766E', clothes: '#115E59', collar: '#CCFBF1',
    hairStyle: 'boy_curls_undercut', smile: 'gentle', glasses: null
  },
  {
    id: 'avatar_35', name: 'Pranav', gender: 'boy',
    skin: '#F0C495', skinShadow: '#DCAE7E', hair: '#1C1917',
    bg: '#1E3A8A', clothes: '#1E40AF', collar: '#DBEAFE',
    hairStyle: 'boy_brushed_back', smile: 'gentle', glasses: 'square_silver'
  },

  // ─── GIRLS (18) ───
  {
    id: 'avatar_02', name: 'Ananya', gender: 'girl',
    skin: '#F5D0A9', skinShadow: '#E5BD92', hair: '#1C1917',
    bg: '#EC4899', clothes: '#DB2777', collar: '#FDF2F8',
    hairStyle: 'girl_long_sleek', smile: 'open', glasses: null
  },
  {
    id: 'avatar_04', name: 'Priya', gender: 'girl',
    skin: '#E0AC69', skinShadow: '#CF9957', hair: '#312017',
    bg: '#EAB308', clothes: '#CA8A04', collar: '#FEF9C3',
    hairStyle: 'girl_high_ponytail', smile: 'open', glasses: null
  },
  {
    id: 'avatar_06', name: 'Diya', gender: 'girl',
    skin: '#FFDCB1', skinShadow: '#E8C59A', hair: '#2E1F16',
    bg: '#06B6D4', clothes: '#0891B2', collar: '#CFFAFE',
    hairStyle: 'girl_wavy_bob', smile: 'open', glasses: 'round_red'
  },
  {
    id: 'avatar_08', name: 'Meera', gender: 'girl',
    skin: '#BD7A44', skinShadow: '#A66735', hair: '#18181B',
    bg: '#8B5CF6', clothes: '#7C3AED', collar: '#EDE9FE',
    hairStyle: 'girl_side_braid', smile: 'gentle', glasses: null
  },
  {
    id: 'avatar_10', name: 'Kavya', gender: 'girl',
    skin: '#8D5524', skinShadow: '#764319', hair: '#09090B',
    bg: '#10B981', clothes: '#059669', collar: '#D1FAE5',
    hairStyle: 'girl_space_buns', smile: 'open', glasses: null
  },
  {
    id: 'avatar_12', name: 'Isha', gender: 'girl',
    skin: '#DE9E5C', skinShadow: '#C68949', hair: '#1C1917',
    bg: '#F43F5E', clothes: '#E11D48', collar: '#FFE4E6',
    hairStyle: 'girl_straight_bob', smile: 'gentle', glasses: null
  },
  {
    id: 'avatar_14', name: 'Saanvi', gender: 'girl',
    skin: '#F7D2AA', skinShadow: '#E4BD94', hair: '#2A1C12',
    bg: '#2563EB', clothes: '#1D4ED8', collar: '#DBEAFE',
    hairStyle: 'girl_cascading_waves', smile: 'open', glasses: null
  },
  {
    id: 'avatar_16', name: 'Aadhya', gender: 'girl',
    skin: '#6B4423', skinShadow: '#553317', hair: '#09090B',
    bg: '#F59E0B', clothes: '#D97706', collar: '#FEF3C7',
    hairStyle: 'girl_afro_puffs', smile: 'open', glasses: null
  },
  {
    id: 'avatar_18', name: 'Tara', gender: 'girl',
    skin: '#FCD7B0', skinShadow: '#ECC197', hair: '#3F2D20',
    bg: '#A855F7', clothes: '#9333EA', collar: '#F3E8FF',
    hairStyle: 'girl_headband_medium', smile: 'gentle', glasses: null
  },
  {
    id: 'avatar_20', name: 'Anika', gender: 'girl',
    skin: '#C68642', skinShadow: '#AF7233', hair: '#18181B',
    bg: '#14B8A6', clothes: '#0D9488', collar: '#CCFBF1',
    hairStyle: 'girl_short_pixie', smile: 'open', glasses: 'round_black'
  },
  {
    id: 'avatar_22', name: 'Riya', gender: 'girl',
    skin: '#CF9456', skinShadow: '#B87F43', hair: '#271B14',
    bg: '#DC2626', clothes: '#B91C1C', collar: '#FEE2E2',
    hairStyle: 'girl_long_braid', smile: 'open', glasses: null
  },
  {
    id: 'avatar_24', name: 'Myra', gender: 'girl',
    skin: '#794829', skinShadow: '#63381D', hair: '#09090B',
    bg: '#6D28D9', clothes: '#5B21B6', collar: '#EDE9FE',
    hairStyle: 'girl_curly_volume', smile: 'open', glasses: null
  },
  {
    id: 'avatar_26', name: 'Naira', gender: 'girl',
    skin: '#E8B382', skinShadow: '#D29D6E', hair: '#1C1917',
    bg: '#0891B2', clothes: '#0E7490', collar: '#CFFAFE',
    hairStyle: 'girl_low_ponytail', smile: 'gentle', glasses: null
  },
  {
    id: 'avatar_28', name: 'Sanya', gender: 'girl',
    skin: '#D8A064', skinShadow: '#C48D52', hair: '#3A271C',
    bg: '#F472B6', clothes: '#DB2777', collar: '#FCE7F3',
    hairStyle: 'girl_curtain_layers', smile: 'open', glasses: null
  },
  {
    id: 'avatar_30', name: 'Tanvi', gender: 'girl',
    skin: '#995D3F', skinShadow: '#844D32', hair: '#18181B',
    bg: '#047857', clothes: '#065F46', collar: '#D1FAE5',
    hairStyle: 'girl_top_bun', smile: 'gentle', glasses: null
  },
  {
    id: 'avatar_32', name: 'Avani', gender: 'girl',
    skin: '#F5CCA0', skinShadow: '#E0B588', hair: '#231812',
    bg: '#4F46E5', clothes: '#4338CA', collar: '#EEF2FF',
    hairStyle: 'girl_blunt_bob', smile: 'open', glasses: 'square_silver'
  },
  {
    id: 'avatar_34', name: 'Shreya', gender: 'girl',
    skin: '#DE9E5C', skinShadow: '#C68949', hair: '#1C1917',
    bg: '#D97706', clothes: '#B45309', collar: '#FEF3C7',
    hairStyle: 'girl_twin_pigtails', smile: 'open', glasses: null
  },
  {
    id: 'avatar_36', name: 'Navya', gender: 'girl',
    skin: '#633A1E', skinShadow: '#4D2C15', hair: '#09090B',
    bg: '#9F1239', clothes: '#881337', collar: '#FFE4E6',
    hairStyle: 'girl_layered_curls', smile: 'open', glasses: null
  }
];

function generateHairBack(c) {
  const h = c.hair;
  switch (c.hairStyle) {
    case 'girl_long_sleek':
      return `<path d="M34 50 C26 70 28 98 32 108 C34 112 42 110 40 102 C36 86 38 68 40 54 Z" fill="${h}"/>
              <path d="M86 50 C94 70 92 98 88 108 C86 112 78 110 80 102 C84 86 82 68 80 54 Z" fill="${h}"/>
              <path d="M36 40 C34 65 34 85 44 95 C54 100 66 100 76 95 C86 85 86 65 84 40 Z" fill="${h}"/>`;
    case 'girl_cascading_waves':
      return `<path d="M30 46 C22 65 24 95 34 114 C36 116 42 112 40 106 C32 88 34 70 38 52 Z" fill="${h}"/>
              <path d="M90 46 C98 65 96 95 86 114 C84 116 78 112 80 106 C88 88 86 70 82 52 Z" fill="${h}"/>
              <ellipse cx="60" cy="62" rx="28" ry="34" fill="${h}"/>`;
    case 'girl_high_ponytail':
      return `<path d="M74 34 C88 28 98 42 96 60 C94 72 88 80 84 82 C82 82 82 76 84 70 C88 56 82 44 74 38 Z" fill="${h}"/>
              <ellipse cx="73" cy="35" rx="5" ry="5" fill="#E11D48"/>`;
    case 'girl_side_braid':
      return `<path d="M78 48 C86 62 88 82 86 104 C85 110 79 110 80 102 C82 88 80 72 74 58 Z" fill="${h}"/>
              <ellipse cx="84" cy="98" rx="4" ry="2.5" fill="#EAB308"/>`;
    case 'girl_long_braid':
      return `<path d="M76 46 C84 60 88 78 86 98 C85 106 79 106 80 98 C82 84 80 70 74 56 Z" fill="${h}"/>
              <ellipse cx="83" cy="94" rx="4" ry="3" fill="#DC2626"/>`;
    case 'girl_space_buns':
      return `<circle cx="34" cy="32" r="12" fill="${h}"/>
              <circle cx="86" cy="32" r="12" fill="${h}"/>`;
    case 'girl_afro_puffs':
      return `<circle cx="32" cy="36" r="14" fill="${h}"/>
              <circle cx="88" cy="36" r="14" fill="${h}"/>`;
    case 'girl_twin_pigtails':
      return `<path d="M34 50 C24 64 22 84 26 96 C28 98 34 96 32 90 C30 80 32 68 38 56 Z" fill="${h}"/>
              <path d="M86 50 C96 64 98 84 94 96 C92 98 86 96 88 90 C90 80 88 68 82 56 Z" fill="${h}"/>
              <ellipse cx="32" cy="52" rx="4" ry="3" fill="#D97706"/>
              <ellipse cx="88" cy="52" rx="4" ry="3" fill="#D97706"/>`;
    case 'girl_top_bun':
      return `<ellipse cx="60" cy="24" rx="13" ry="11" fill="${h}"/>`;
    case 'girl_curly_volume':
      return `<ellipse cx="60" cy="52" rx="32" ry="32" fill="${h}"/>`;
    case 'girl_layered_curls':
      return `<ellipse cx="60" cy="58" rx="30" ry="34" fill="${h}"/>`;
    default:
      return '';
  }
}

function generateHairFront(c) {
  const h = c.hair;
  switch (c.hairStyle) {
    // BOYS
    case 'boy_side_part':
      return `<path d="M36 50 C36 32 46 25 60 25 C75 25 84 34 84 50 C84 46 80 34 68 34 C54 34 42 42 36 50 Z" fill="${h}"/>
              <path d="M36 46 C42 38 55 35 70 38 C78 40 82 46 84 50 C82 44 76 39 68 38 C56 36 44 40 36 46 Z" fill="${h}"/>`;
    case 'boy_wavy_quiff':
      return `<path d="M36 50 C35 34 48 24 62 23 C76 22 86 32 84 48 C82 38 74 30 62 30 C50 30 40 40 36 50 Z" fill="${h}"/>
              <path d="M46 28 C56 18 72 20 78 28 C70 24 58 24 46 28 Z" fill="${h}"/>`;
    case 'boy_curly_mop':
      return `<circle cx="44" cy="32" r="9" fill="${h}"/>
              <circle cx="56" cy="28" r="9" fill="${h}"/>
              <circle cx="68" cy="28" r="9" fill="${h}"/>
              <circle cx="78" cy="34" r="8" fill="${h}"/>
              <circle cx="38" cy="40" r="7" fill="${h}"/>
              <circle cx="82" cy="42" r="7" fill="${h}"/>
              <path d="M38 46 C44 38 76 38 82 46 C78 40 68 37 60 37 C52 37 42 40 38 46 Z" fill="${h}"/>`;
    case 'boy_fade_cut':
      return `<path d="M38 48 C38 34 46 28 60 28 C74 28 82 34 82 48 C80 40 72 34 60 34 C48 34 40 40 38 48 Z" fill="${h}"/>`;
    case 'boy_textured_spikes':
      return `<path d="M36 50 C36 34 48 26 60 26 C72 26 84 34 84 50 C80 44 76 38 68 36 C60 34 50 38 46 36 C42 34 38 42 36 50 Z" fill="${h}"/>
              <polygon points="48,28 52,18 56,28" fill="${h}"/>
              <polygon points="56,26 61,16 66,26" fill="${h}"/>
              <polygon points="66,27 71,19 75,28" fill="${h}"/>`;
    case 'boy_straight_fringe':
      return `<path d="M36 50 C36 34 46 26 60 26 C74 26 84 34 84 50 C82 44 78 40 68 40 C58 40 44 42 36 50 Z" fill="${h}"/>
              <path d="M40 44 L44 48 L48 43 L53 47 L58 42 L64 47 L70 43 L76 47 L80 44 C76 38 68 36 60 36 C52 36 44 38 40 44 Z" fill="${h}"/>`;
    case 'boy_afro_fade':
      return `<ellipse cx="60" cy="36" rx="23" ry="15" fill="${h}"/>
              <circle cx="44" cy="32" r="7" fill="${h}"/>
              <circle cx="56" cy="28" r="7" fill="${h}"/>
              <circle cx="68" cy="30" r="7" fill="${h}"/>
              <circle cx="76" cy="34" r="6" fill="${h}"/>`;
    case 'boy_modern_quiff':
      return `<path d="M36 48 C36 32 46 22 62 21 C76 20 84 32 84 48 C80 40 72 32 60 32 C48 32 40 40 36 48 Z" fill="${h}"/>
              <path d="M52 23 C58 14 74 15 80 24 C72 20 62 20 52 23 Z" fill="${h}"/>`;
    case 'boy_buzz_cut':
      return `<path d="M38 50 C38 36 46 30 60 30 C74 30 82 36 82 50 C80 46 76 42 60 42 C44 42 40 46 38 50 Z" fill="${h}" opacity="0.95"/>`;
    case 'boy_curtain_bangs':
      return `<path d="M36 50 C36 34 46 26 60 26 C74 26 84 34 84 50 C80 42 74 36 64 38 C60 39 58 43 56 46 C54 43 52 39 48 38 C42 36 38 42 36 50 Z" fill="${h}"/>
              <path d="M40 46 C44 40 50 38 54 42 C51 46 47 48 42 48 Z" fill="${h}"/>
              <path d="M80 46 C76 40 70 38 66 42 C69 46 73 48 78 48 Z" fill="${h}"/>`;
    case 'boy_side_fade':
      return `<path d="M40 50 C40 34 48 26 62 26 C74 26 82 32 82 48 C80 42 74 34 62 34 C50 34 44 42 40 50 Z" fill="${h}"/>
              <path d="M50 28 C58 20 70 22 76 28 C70 24 60 24 50 28 Z" fill="${h}"/>`;
    case 'boy_thick_waves':
      return `<path d="M36 52 C35 34 46 25 60 25 C75 25 85 34 84 52 C82 42 76 35 66 36 C56 37 46 42 36 52 Z" fill="${h}"/>
              <ellipse cx="48" cy="30" rx="9" ry="6" fill="${h}"/>
              <ellipse cx="66" cy="30" rx="10" ry="6" fill="${h}"/>`;
    case 'boy_crop_neat':
      return `<path d="M37 50 C37 36 46 28 60 28 C74 28 83 36 83 50 C80 42 74 38 60 38 C46 38 40 42 37 50 Z" fill="${h}"/>`;
    case 'boy_playful_spikes':
      return `<path d="M36 50 C36 34 46 28 60 28 C74 28 84 34 84 50 C80 42 74 36 60 36 C46 36 40 42 36 50 Z" fill="${h}"/>
              <polygon points="42,32 46,20 50,30" fill="${h}"/>
              <polygon points="50,30 55,18 60,29" fill="${h}"/>
              <polygon points="60,29 65,19 70,30" fill="${h}"/>
              <polygon points="70,31 75,22 78,33" fill="${h}"/>`;
    case 'boy_swept_fringe':
      return `<path d="M36 50 C36 32 48 25 62 25 C76 25 84 34 84 50 C80 42 72 34 60 34 C46 34 40 42 36 50 Z" fill="${h}"/>
              <path d="M40 44 C48 38 62 36 76 44 C68 40 56 40 46 46 Z" fill="${h}"/>`;
    case 'boy_short_neat':
      return `<path d="M38 50 C38 34 47 28 60 28 C73 28 82 34 82 50 C80 42 72 36 60 36 C48 36 40 42 38 50 Z" fill="${h}"/>`;
    case 'boy_curls_undercut':
      return `<circle cx="48" cy="30" r="8" fill="${h}"/>
              <circle cx="60" cy="27" r="8" fill="${h}"/>
              <circle cx="72" cy="30" r="8" fill="${h}"/>
              <ellipse cx="60" cy="35" rx="18" ry="8" fill="${h}"/>`;
    case 'boy_brushed_back':
      return `<path d="M37 50 C37 32 46 24 60 24 C74 24 83 32 83 50 C80 38 72 32 60 32 C48 32 40 38 37 50 Z" fill="${h}"/>
              <path d="M46 28 C54 22 66 22 74 28 C66 24 54 24 46 28 Z" fill="${h}"/>`;

    // GIRLS
    case 'girl_long_sleek':
      return `<path d="M36 50 C36 34 46 26 60 26 C74 26 84 34 84 50 C82 42 76 36 64 36 C50 36 42 42 36 50 Z" fill="${h}"/>
              <path d="M38 46 C44 38 56 36 68 42 C60 40 48 42 42 48 Z" fill="${h}"/>`;
    case 'girl_high_ponytail':
      return `<path d="M36 50 C36 34 46 26 60 26 C74 26 84 34 84 50 C80 40 72 34 60 34 C48 34 40 40 36 50 Z" fill="${h}"/>
              <path d="M42 42 C48 38 56 36 64 38 C72 40 76 44 78 48 C74 42 66 38 58 38 C50 38 44 42 42 42 Z" fill="${h}"/>`;
    case 'girl_wavy_bob':
      return `<path d="M34 52 C34 34 46 25 60 25 C74 25 86 34 86 52 C84 62 82 72 86 78 C82 76 78 70 78 62 C78 44 74 36 60 36 C46 36 42 44 42 62 C42 70 38 76 34 78 C38 72 36 62 34 52 Z" fill="${h}"/>`;
    case 'girl_side_braid':
      return `<path d="M36 50 C36 34 46 26 60 26 C74 26 84 34 84 50 C80 40 72 35 60 35 C48 35 40 40 36 50 Z" fill="${h}"/>
              <path d="M38 46 C44 40 52 38 60 40 C52 42 44 46 40 50 Z" fill="${h}"/>`;
    case 'girl_space_buns':
      return `<path d="M36 50 C36 34 46 27 60 27 C74 27 84 34 84 50 C80 40 72 35 60 35 C48 35 40 40 36 50 Z" fill="${h}"/>
              <path d="M42 46 C46 42 50 40 54 42 C51 45 47 48 44 48 Z" fill="${h}"/>
              <path d="M78 46 C74 42 70 40 66 42 C69 45 73 48 76 48 Z" fill="${h}"/>`;
    case 'girl_straight_bob':
      return `<path d="M34 50 C34 32 46 24 60 24 C74 24 86 32 86 50 C86 64 84 74 80 78 C80 72 80 60 80 50 C78 40 72 36 60 36 C48 36 42 40 40 50 C40 60 40 72 40 78 C36 74 34 64 34 50 Z" fill="${h}"/>
              <rect x="40" y="36" width="40" height="8" rx="2" fill="${h}"/>`;
    case 'girl_cascading_waves':
      return `<path d="M34 50 C34 32 46 24 60 24 C74 24 86 32 86 50 C82 40 74 34 60 34 C46 34 38 40 34 50 Z" fill="${h}"/>
              <path d="M38 46 C44 38 54 36 64 40 C72 44 76 50 78 54 C74 46 66 40 58 40 C50 40 44 44 38 46 Z" fill="${h}"/>`;
    case 'girl_afro_puffs':
      return `<path d="M38 50 C38 36 46 29 60 29 C74 29 82 36 82 50 C80 42 74 37 60 37 C46 37 40 42 38 50 Z" fill="${h}"/>`;
    case 'girl_headband_medium':
      return `<path d="M34 52 C34 34 46 25 60 25 C74 25 86 34 86 52 C84 62 82 72 84 76 C80 72 78 64 78 54 C76 42 70 36 60 36 C50 36 44 42 42 54 C42 64 40 72 36 76 C38 72 36 62 34 52 Z" fill="${h}"/>
              <path d="M36 44 C42 32 78 32 84 44" stroke="#A855F7" stroke-width="4.5" stroke-linecap="round" fill="none"/>
              <circle cx="42" cy="38" r="3.5" fill="#E9D5FF"/>`;
    case 'girl_short_pixie':
      return `<path d="M36 50 C36 32 46 24 60 24 C74 24 84 32 84 50 C82 40 76 34 64 34 C50 34 40 42 36 50 Z" fill="${h}"/>
              <path d="M40 44 C46 38 58 36 72 40 C62 40 50 44 44 48 Z" fill="${h}"/>`;
    case 'girl_long_braid':
      return `<path d="M36 50 C36 34 46 26 60 26 C74 26 84 34 84 50 C80 40 72 35 60 35 C48 35 40 40 36 50 Z" fill="${h}"/>
              <path d="M40 44 C48 38 60 38 70 44 C62 42 52 42 44 48 Z" fill="${h}"/>`;
    case 'girl_curly_volume':
      return `<path d="M36 52 C36 34 46 26 60 26 C74 26 84 34 84 52 C80 44 74 38 60 38 C46 38 40 44 36 52 Z" fill="${h}"/>
              <circle cx="42" cy="40" r="6" fill="${h}"/>
              <circle cx="52" cy="36" r="6" fill="${h}"/>
              <circle cx="62" cy="36" r="6" fill="${h}"/>
              <circle cx="74" cy="40" r="6" fill="${h}"/>`;
    case 'girl_low_ponytail':
      return `<path d="M36 50 C36 34 46 26 60 26 C74 26 84 34 84 50 C80 40 72 35 60 35 C48 35 40 40 36 50 Z" fill="${h}"/>
              <path d="M42 44 C48 40 54 38 60 40 C54 42 48 46 44 48 Z" fill="${h}"/>
              <path d="M78 44 C72 40 66 38 60 40 C66 42 72 46 76 48 Z" fill="${h}"/>`;
    case 'girl_curtain_layers':
      return `<path d="M34 52 C34 34 46 25 60 25 C74 25 86 34 86 52 C84 62 82 72 84 76 C80 70 78 62 78 52 C76 42 70 36 60 36 C50 36 44 42 42 52 C42 62 40 70 36 76 C38 72 36 62 34 52 Z" fill="${h}"/>
              <path d="M40 46 C44 40 50 38 56 42 C52 46 47 48 42 48 Z" fill="${h}"/>
              <path d="M80 46 C76 40 70 38 64 42 C68 46 73 48 78 48 Z" fill="${h}"/>`;
    case 'girl_top_bun':
      return `<path d="M36 50 C36 34 46 27 60 27 C74 27 84 34 84 50 C80 40 72 35 60 35 C48 35 40 40 36 50 Z" fill="${h}"/>
              <path d="M42 44 C48 40 56 38 66 42 C58 42 50 44 44 48 Z" fill="${h}"/>`;
    case 'girl_blunt_bob':
      return `<path d="M34 50 C34 32 46 24 60 24 C74 24 86 32 86 50 C86 64 84 72 82 76 C80 70 80 58 78 50 C76 40 70 36 60 36 C50 36 44 40 42 50 C40 58 40 70 38 76 C36 72 34 64 34 50 Z" fill="${h}"/>
              <rect x="40" y="35" width="40" height="9" rx="2" fill="${h}"/>`;
    case 'girl_twin_pigtails':
      return `<path d="M36 50 C36 34 46 27 60 27 C74 27 84 34 84 50 C80 40 72 35 60 35 C48 35 40 40 36 50 Z" fill="${h}"/>
              <path d="M42 44 C48 40 54 38 60 40 C54 42 48 46 44 48 Z" fill="${h}"/>
              <path d="M78 44 C72 40 66 38 60 40 C66 42 72 46 76 48 Z" fill="${h}"/>`;
    case 'girl_layered_curls':
      return `<path d="M34 52 C34 34 46 25 60 25 C74 25 86 34 86 52 C84 62 82 72 84 76 C80 70 78 62 78 52 C76 42 70 36 60 36 C50 36 44 42 42 52 C42 62 40 70 36 76 C38 72 36 62 34 52 Z" fill="${h}"/>
              <circle cx="44" cy="42" r="5" fill="${h}"/>
              <circle cx="76" cy="42" r="5" fill="${h}"/>`;
    default:
      return '';
  }
}

function generateGlasses(c) {
  if (!c.glasses) return '';
  if (c.glasses === 'round_black') {
    return `
      <!-- Round Glasses Black -->
      <circle cx="50" cy="54" r="8" fill="rgba(255,255,255,0.15)" stroke="#18181B" stroke-width="2"/>
      <circle cx="70" cy="54" r="8" fill="rgba(255,255,255,0.15)" stroke="#18181B" stroke-width="2"/>
      <line x1="58" y1="54" x2="62" y2="54" stroke="#18181B" stroke-width="2"/>
      <line x1="42" y1="53" x2="38" y2="51" stroke="#18181B" stroke-width="1.8"/>
      <line x1="78" y1="53" x2="82" y2="51" stroke="#18181B" stroke-width="1.8"/>
    `;
  }
  if (c.glasses === 'round_red') {
    return `
      <!-- Round Glasses Red -->
      <circle cx="50" cy="54" r="8" fill="rgba(255,255,255,0.18)" stroke="#DC2626" stroke-width="2.2"/>
      <circle cx="70" cy="54" r="8" fill="rgba(255,255,255,0.18)" stroke="#DC2626" stroke-width="2.2"/>
      <line x1="58" y1="54" x2="62" y2="54" stroke="#DC2626" stroke-width="2.2"/>
      <line x1="42" y1="53" x2="38" y2="51" stroke="#DC2626" stroke-width="2"/>
      <line x1="78" y1="53" x2="82" y2="51" stroke="#DC2626" stroke-width="2"/>
    `;
  }
  if (c.glasses === 'square_silver') {
    return `
      <!-- Square Glasses Silver/Dark -->
      <rect x="42" y="47" width="16" height="13" rx="3.5" fill="rgba(255,255,255,0.15)" stroke="#334155" stroke-width="2"/>
      <rect x="62" y="47" width="16" height="13" rx="3.5" fill="rgba(255,255,255,0.15)" stroke="#334155" stroke-width="2"/>
      <line x1="58" y1="53" x2="62" y2="53" stroke="#334155" stroke-width="2"/>
      <line x1="42" y1="52" x2="38" y2="50" stroke="#334155" stroke-width="1.8"/>
      <line x1="78" y1="52" x2="82" y2="50" stroke="#334155" stroke-width="1.8"/>
    `;
  }
  return '';
}

function generateSmile(c) {
  if (c.smile === 'open') {
    return `
      <!-- Cheerful Open Smile with Teeth -->
      <path d="M53 66 Q60 75 67 66 Z" fill="#991B1B"/>
      <path d="M54 66 Q60 70 66 66 Z" fill="#FFFFFF"/>
    `;
  }
  return `
    <!-- Gentle Warm Smile -->
    <path d="M54 66 Q60 71 66 66" stroke="#991B1B" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  `;
}

function generateSvg(c) {
  const clipId = `clip_${c.id}`;
  const hairBack = generateHairBack(c);
  const hairFront = generateHairFront(c);
  const glasses = generateGlasses(c);
  const smile = generateSmile(c);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
  <!-- Background Circle (Colorable via id="avatar-bg") -->
  <circle id="avatar-bg" cx="60" cy="60" r="58" fill="${c.bg}"/>

  <defs>
    <clipPath id="${clipId}">
      <circle cx="60" cy="60" r="58"/>
    </clipPath>
  </defs>

  <g clip-path="url(#${clipId})">
    <!-- Back Hair (if applicable) -->
    ${hairBack}

    <!-- Shoulders & Clothes -->
    <path d="M16 120 C16 94 36 84 60 84 C84 84 104 94 104 120 Z" fill="${c.clothes}"/>

    <!-- Clothing Collar / Neckline -->
    <path d="M48 84 L60 96 L72 84 Z" fill="${c.collar}"/>
    <path d="M52 84 L60 92 L68 84 Z" fill="${c.clothes}" opacity="0.3"/>

    <!-- Neck Shadow & Neck -->
    <path d="M51 72 L51 90 C51 95 69 95 69 90 L69 72 Z" fill="${c.skinShadow}"/>
    <rect x="52" y="70" width="16" height="16" rx="8" fill="${c.skin}"/>

    <!-- Ears -->
    <circle cx="37" cy="56" r="5.5" fill="${c.skin}"/>
    <circle cx="37" cy="56" r="3" fill="${c.skinShadow}" opacity="0.6"/>
    <circle cx="83" cy="56" r="5.5" fill="${c.skin}"/>
    <circle cx="83" cy="56" r="3" fill="${c.skinShadow}" opacity="0.6"/>

    <!-- Head / Face -->
    <ellipse cx="60" cy="55" rx="22" ry="25" fill="${c.skin}"/>

    <!-- Soft Cheeks Blush -->
    <circle cx="47" cy="62" r="3.5" fill="#F43F5E" opacity="0.35"/>
    <circle cx="73" cy="62" r="3.5" fill="#F43F5E" opacity="0.35"/>

    <!-- Eyebrows -->
    <path d="M45 47 Q50 44 55 46" stroke="${c.hair}" stroke-width="2.2" stroke-linecap="round" fill="none"/>
    <path d="M65 46 Q70 44 75 47" stroke="${c.hair}" stroke-width="2.2" stroke-linecap="round" fill="none"/>

    <!-- Eyes (Big, Bright & Friendly) -->
    <ellipse cx="50" cy="53" rx="3.2" ry="3.8" fill="#0F172A"/>
    <circle cx="51" cy="52" r="1.3" fill="#FFFFFF"/>
    <circle cx="49" cy="54.5" r="0.7" fill="#FFFFFF"/>

    <ellipse cx="70" cy="53" rx="3.2" ry="3.8" fill="#0F172A"/>
    <circle cx="71" cy="52" r="1.3" fill="#FFFFFF"/>
    <circle cx="69" cy="54.5" r="0.7" fill="#FFFFFF"/>

    <!-- Cute Nose -->
    <path d="M60 55 Q61 59 58 60" stroke="${c.skinShadow}" stroke-width="1.8" stroke-linecap="round" fill="none"/>

    <!-- Smile -->
    ${smile}

    <!-- Glasses (if applicable) -->
    ${glasses}

    <!-- Front Hair -->
    ${hairFront}
  </g>
</svg>`;
}

// Generate all 36 SVGs
let count = 0;
characters.forEach(c => {
  const filePath = path.join(targetDir, `${c.id}.svg`);
  const svg = generateSvg(c);
  fs.writeFileSync(filePath, svg, 'utf8');
  count++;
});

console.log(`Successfully generated ${count} high-quality human character avatars in ${targetDir}`);
