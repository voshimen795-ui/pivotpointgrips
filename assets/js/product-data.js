/* Long-form product detail — everything the quick view shows and nothing the
 * cart needs. Kept out of catalog.js on purpose: catalog.js loads on every
 * page because the header badge needs it, and this copy is only read once
 * somebody opens a product.
 *
 * SOURCE. Every claim, spec, policy line and option axis below is taken from
 * the client's own product pages. Where their pages disagree with each other,
 * the operative instruction wins and the disagreement is flagged in a comment
 * rather than reproduced. Nothing here is written from imagination — if a
 * value is not in `values`, it is because it is not published anywhere we can
 * read, and the UI says so instead of inventing it.
 */

/* Repeated verbatim on every bat page on their site. */
export const APPROVED_BALLS =
  'JUGS Lite-Flite®, Marv Training Balls, Driveline Smash Factor Balls, ' +
  'wiffle balls, tennis balls, and similar. Not for use with hard baseballs ' +
  'or softballs.';

export const JAWBATS =
  'JAWBATS is a custom wood baseball bat manufacturing company that ' +
  'specializes in top of the line professional grade wood baseball bats for ' +
  'youth to professional baseball players.';

export const PATENT = 'Pivot Point Grip patent #: US20220168619A1';

export const POLICY = {
  returns:
    'If you are not satisfied with an item or need a different size from ' +
    'purchase on PivotPointGrips.com, you may return it in its original, new ' +
    'condition within 30 days of purchase for a full product refund.',
  warranty:
    'PivotPointGrips.com offers a 30-day limited warranty on wood bats and a ' +
    '6-month limited warranty on all metal bats. Contact ' +
    'info@pivotpointgrips.com for returns or warranty issues.',
  shipping: 'Orders are processed and shipped within 2–3 business days.',
};

/* --- Option axes ---------------------------------------------------------
 * `values: []` means the list is not published anywhere we can read. The
 * quick view renders an "we'll confirm this with you" panel for those rather
 * than a select full of guessed numbers, because a wrong length on a buy
 * button is a wrong order. Fill the array in and the selector appears.
 */
const HAND = {
  id: 'hand', label: 'Left or right hand hitter', type: 'choice', required: true,
  values: [{ v: 'Left' }, { v: 'Right' }],
};

const GRIP_SIZE = {
  id: 'grip', label: 'Grip size', type: 'choice', required: true,
  values: [
    { v: 'Youth', note: 'Hands under 7.25″' },
    { v: 'Adult', note: 'Hands 7.25″ and over' },
  ],
  note: 'Measured palm to fingertip — hand size, not age.',
};

// TODO(client): the published length menu. Ask for the exact list, paste it
// here as [{ v: '29″' }, …] and the selector replaces the note.
const BAT_LENGTH = {
  id: 'length', label: 'Bat length', type: 'choice', required: true, values: [],
  ask: 'Tell us the length in the order notes, or ask us which one suits the ' +
       'hitter. Every length we build takes the same grip.',
};

const BAT_SIZE = {
  id: 'size', label: 'Bat size', type: 'choice', required: true, values: [],
  ask: 'Tell us the size in the order notes and we will confirm it before we build.',
};

// TODO(client): finish names (gloss / matte / natural …).
const FINISH = {
  id: 'finish', label: 'Finish', type: 'choice', required: true, values: [],
  ask: 'Tell us the finish you want in the order notes and we will confirm it.',
};

const ADD_LOGO = {
  id: 'logo', label: 'Add a logo?', type: 'choice', required: true,
  values: [{ v: 'Yes' }, { v: 'No' }],
  note: 'Send the artwork to info@pivotpointgrips.com after you order.',
};

const ENGRAVING = {
  id: 'engraving', label: 'Custom engraving', type: 'text', required: false,
  max: 20, placeholder: 'Name, number, program…',
};

/* Sampled off the client's own colour pickers, swatch by swatch, so these are
 * their real values rather than an approximation.
 *
 * TODO(client): the bat palette's names. Several swatches render identically
 * (six read as pure black), so they are distinct finishes that a swatch alone
 * cannot tell apart — naming them here would be guessing. Ask for the list
 * and add `v:` to each entry; the UI already shows `v` when it is present.
 * The engraving palette matched standard colour names closely enough to name
 * with confidence.
 */
const BAT_COLORS = [
  '#d9d6b0', '#f1e6e6', '#00ffff', '#000000', '#3c77ce', '#14e10f', '#dfb36c', '#f78411',
  '#df3838', '#000000', '#000000', '#cc6b23', '#000000', '#d2042d', '#d0cccc', '#df8f47',
  '#88aedd', '#a41919', '#b8b4b4', '#000000', '#5df10d', '#000000', '#228b22', '#000000',
  '#dfd7ad', '#0cc4e5', '#290bff', '#156f23', '#ffa500', '#ff0000', '#0000ff', '#ffffff',
  '#ffff00',
].map((hex, i) => ({ hex, v: 'Bat color ' + (i + 1) }));

const BAT_COLOR = {
  id: 'color', label: 'Bat color', type: 'swatch', required: true,
  values: BAT_COLORS,
  note: 'Colors shown are approximate and may vary slightly from the product received.',
};

const ENGRAVING_COLOR = {
  id: 'engcolor', label: 'Engraving color', type: 'swatch', required: true,
  values: [
    { v: 'White', hex: '#ffffff' }, { v: 'Black', hex: '#000000' },
    { v: 'Gold', hex: '#ffd700' }, { v: 'Silver', hex: '#c0c0c0' },
    { v: 'Red', hex: '#ff0000' }, { v: 'Maroon', hex: '#800000' },
    { v: 'Orange', hex: '#ffa500' }, { v: 'Yellow', hex: '#ffff00' },
    { v: 'Lime', hex: '#a6ff39' }, { v: 'Green', hex: '#008000' },
    { v: 'Dark green', hex: '#006400' }, { v: 'Teal', hex: '#008080' },
    { v: 'Sky blue', hex: '#69c8d2' }, { v: 'Blue', hex: '#0000ff' },
    { v: 'Navy', hex: '#100579' }, { v: 'Purple', hex: '#800080' },
    { v: 'Pink', hex: '#ffc0cb' }, { v: 'Gray', hex: '#808080' },
  ],
};

const CUSTOM_OPTIONS = [
  HAND, BAT_LENGTH, BAT_COLOR, FINISH, ENGRAVING_COLOR, ADD_LOGO, ENGRAVING,
];

/* Shared closing blocks, so a change to their policy is one edit. */
const WOOD_TRAINER = {
  use: 'Pre-installed with the Pivot Point Grip. Use indoors or outdoors for ' +
       'tee work, soft toss, and machine training.',
  balls: APPROVED_BALLS,
  maker: JAWBATS,
  patent: PATENT,
  policy: POLICY,
};

const GRIP_FEATURES = [
  'Power Grooves™ for proper hand alignment',
  'Ergonomic Palm Pads for complete comfort',
  'Integrated Knob to improve range of motion and barrel accuracy',
];

/* --- The products -------------------------------------------------------- */
export const DETAIL = {
  'half-bat': {
    tagline: 'Finisher or Iron · Maple · Grip pre-installed',
    lead: { text: 'Ships in 2–3 business days' },
    pitch: [
      'One half bat, two builds. The Finisher is the lighter of the two and ' +
      'the one most hitters start on; the Iron is built closer to game weight ' +
      'for hitters who already have the mechanics and want the load.',
    ],
    sections: [
      {
        title: 'Finisher — lighter, faster, repeatable',
        body: 'Built for bat speed, control, and consistency. It promotes ' +
              'proper barrel pivoting without overloading the hands or arms.',
        list: [
          'Youth, middle school, and high school hitters',
          'Improving bat-to-ball skills and barrel awareness',
          'Building quick hands and efficient swing mechanics',
        ],
        listTitle: 'Best for',
        foot: 'The lighter weight allows fast, repeatable swings while ' +
              'reinforcing clean hand paths and barrel control — ideal ' +
              'for long-term skill development.',
      },
      {
        title: 'Iron — heavier, game-like feel',
        body: 'The Iron Half Bat is built closer to game weight, giving ' +
              'advanced hitters a realistic training feel. It challenges ' +
              'strength, control, and precision while demanding efficient ' +
              'mechanics.',
        listTitle: 'Best for',
        list: [
          'College and professional hitters',
          'Advanced high school players preparing for the next level',
          'High-intent, game-speed training',
        ],
        foot: 'The added weight exposes swing inefficiencies, builds ' +
              'strength, and helps advanced hitters transfer training ' +
              'directly to in-game performance.',
      },
      {
        listTitle: 'Why it works',
        list: [
          'Improves bat-to-ball skills and hand-eye coordination',
          'Teaches proper barrel pivoting and bat control',
          'Reinforces consistent, repeatable swing mechanics',
          'Develops efficient hand path and increased bat speed',
          'Builds confidence that carries into game swings',
        ],
      },
    ],
    specs: [
      'Half bat trainer with Pivot Point Grip (pre-installed)',
      'Made with high quality maple wood',
      'Approximately 22 oz Finisher & 28 oz Iron',
    ].concat(GRIP_FEATURES),
    options: [
      {
        id: 'build', label: 'Finisher or Iron', type: 'choice', required: true,
        values: [
          { v: 'Finisher', note: '≈22 oz' },
          { v: 'Iron', note: '≈28 oz' },
        ],
      },
    ],
    ...WOOD_TRAINER,
  },

  'youth-finisher': {
    tagline: 'Youth · Maple · Grip pre-installed',
    lead: { text: 'Ships in 2–3 business days' },
    pitch: [
      'A flat-barrel training bat built for young hitters developing flush ' +
      'contact, barrel control, and consistent swing patterns.',
      'The flat barrel teaches young hitters to square the ball cleanly, so ' +
      'contact quality shows up as immediate feedback rather than something ' +
      'a coach has to call out.',
    ],
    sections: [
      {
        listTitle: 'Best for',
        list: [
          'Youth hitters developing bat-to-ball skills',
          'Players learning barrel control and consistent contact',
          'Hitters 12 and under',
        ],
      },
      {
        listTitle: 'Why it works',
        list: [
          'Flat barrel promotes flush contact at impact',
          'Improves bat-to-ball skills and barrel accuracy',
          'Reinforces proper grip mechanics and hand path',
          'Builds consistent, repeatable swing patterns',
        ],
      },
    ],
    specs: [
      'Youth half bat trainer with Pivot Point Grip (pre-installed)',
      'Made with high quality maple wood',
      'Ideal for hitters 12 and under',
    ].concat(GRIP_FEATURES),
    options: [BAT_LENGTH],
    ...WOOD_TRAINER,
  },

  'sledge': {
    tagline: 'Advanced hitters only · Strength · Precision · Feedback',
    lead: { text: 'Expected to ship in 2–3 weeks', preorder: true },
    reviews: { avg: 5.0, count: 5 },
    pitch: [
      'The Sledge Heavy Half Bat is built for hitters who already have ' +
      'refined mechanics and elite intent. This is not a development bat ' +
      '— it is a challenge tool designed to expose weaknesses and ' +
      'sharpen barrel control at the highest level.',
      'Heavier than game weight, The Sledge demands strength, speed, and ' +
      'commitment through the swing. If you cannot launch it quickly, it ' +
      'will let you know. The reduced barrel size forces absolute precision.',
      'There is no room for mishits — every rep delivers immediate, ' +
      'honest feedback through the hands and the sound of contact. This bat ' +
      'insists you are precise.',
    ],
    sections: [
      {
        listTitle: 'Best for',
        list: [
          'College hitters',
          'Professional hitters',
          'Advanced hitters training with game-speed intent',
        ],
      },
      {
        listTitle: 'Why train with The Sledge',
        list: [
          'Heavier-than-game weight builds swing strength and intent',
          'Small barrel surface exposes barrel accuracy flaws',
          'Immediate feedback on flush vs. off-barrel contact',
          'Reinforces elite-level hand speed and barrel control',
        ],
      },
    ],
    specs: [
      'Heavy half bat trainer with Pivot Point Grip (pre-installed)',
      'Maple wood construction',
      'Approx. −1 oz weighted feel',
    ].concat(GRIP_FEATURES),
    options: [
      HAND,
      {
        id: 'color', label: 'Color', type: 'swatch', required: true,
        values: [{ v: 'Black', hex: '#111111' }],
      },
      BAT_SIZE,
    ],
    ...WOOD_TRAINER,
  },

  'nocast': {
    tagline: 'Connection · Speed · Efficiency — anti-casting training bat',
    lead: { text: 'Expected to ship in 1–2 weeks', preorder: true },
    reviews: { avg: 5.0, count: 1 },
    pitch: [
      'The NoCastBat is a compact, game-weight training bat built to ' +
      'eliminate casting and create faster, more powerful contact. Its ' +
      'shortened design forces proper hand positioning and keeps the barrel ' +
      'connected through the swing, accelerating barrel efficiency through ' +
      'the zone.',
      'Constructed from durable composite Delrin and paired with Pivot Point ' +
      'Grip technology, the NoCastBat delivers instant, honest feedback. ' +
      'Hitters immediately feel when the barrel stays tight and efficient ' +
      '— and when it does not. That allows focused, high-rep training ' +
      'with real swing transfer to the field.',
    ],
    sections: [
      {
        listTitle: 'Best for',
        list: [
          'Hitters who cast or sweep the barrel',
          'Players looking to improve hand positioning and connection',
          'High-rep, focused swing training',
          'Youth and adult hitters training with intent',
        ],
      },
      {
        listTitle: 'Why train with the NoCastBat',
        list: [
          'Eliminates casting for faster, more powerful contact',
          'Trains proper grip and hand positioning',
          'Game-weight design transfers directly to game swings',
          'Provides immediate feedback hitters can feel',
          'Built for durability and repeatable reps',
        ],
      },
    ],
    specs: [
      'NoCastBat training bat, Pivot Point Grip pre-installed',
      'Composite Delrin (acetal homopolymer) construction',
      'Youth 23 in / 25 oz — Adult 23 in / 31 oz',
      'Small-size grip recommended for hands under 7.25 in',
      'Compact design for precision training',
    ].concat(GRIP_FEATURES),
    options: [HAND, GRIP_SIZE],
    ...WOOD_TRAINER,
  },

  'custom-youth-finisher': {
    gallery: ['bat-custom-youth-finisher.png', 'bat-custom-finisher.png', 'bat-custom-iron.png'],
    tagline: 'Precision · Confidence · Personalization',
    lead: { text: 'Ships in 3–4 weeks', preorder: true },
    reviews: { avg: 5.0, count: 3 },
    pitch: [
      'The Custom Youth Finisher Half Bat is a flat-barrel training bat ' +
      'designed to help young hitters develop flush contact, barrel control, ' +
      'and consistent swing patterns — now with full customization to ' +
      'make it uniquely theirs.',
      'Its flat barrel design teaches young hitters to square the ball ' +
      'cleanly, providing instant feedback on contact quality. Paired with a ' +
      'customizable Pivot Point Grip, players can choose bat colors, add ' +
      'engraving, or include logo customization — creating a ' +
      'personalized training tool that builds confidence while reinforcing ' +
      'proper mechanics.',
    ],
    sections: [
      {
        listTitle: 'Best for',
        list: [
          'Youth hitters developing bat-to-ball skills',
          'Players learning barrel control and consistent contact',
          'Teams, facilities, and families looking for customized training tools',
        ],
      },
      {
        listTitle: 'Why train with it',
        list: [
          'Flat barrel promotes flush contact at impact',
          'Improves bat-to-ball skills and barrel accuracy',
          'Reinforces proper grip mechanics and hand path',
          'Builds consistent, repeatable swing patterns',
          'Custom grip colors, engraving, and logo options',
        ],
      },
    ],
    specs: [
      'Colors shown are approximate and may vary slightly from the product received',
      'Youth half bat trainer with Pivot Point Grip (pre-installed)',
      'Made with high quality maple wood',
      'Ideal for hitters 12 and under',
    ].concat(GRIP_FEATURES),
    options: CUSTOM_OPTIONS,
    ...WOOD_TRAINER,
  },

  'custom-finisher': {
    gallery: ['bat-custom-finisher.png', 'bat-custom-youth-finisher.png', 'bat-custom-iron.png'],
    tagline: 'Precision · Confidence · Personalization',
    lead: { text: 'Ships in 3–4 weeks', preorder: true },
    pitch: [
      'The Finisher Half Bat, built in your colors. Same flat barrel, same ' +
      'pre-installed Pivot Point Grip, finished the way your program looks.',
      'Choose the bat color and finish, pick an engraving color, and add your ' +
      'logo or a line of your own on the barrel.',
    ],
    sections: [
      {
        listTitle: 'Best for',
        list: [
          'Middle school and high school hitters',
          'Teams and facilities that want their own identity on the rack',
          'Gifts and awards that still get used every day',
        ],
      },
    ],
    specs: [
      'Colors shown are approximate and may vary slightly from the product received',
      'Half bat trainer with Pivot Point Grip (pre-installed)',
      'Made with high quality maple wood',
      'Approximately 22 oz',
    ].concat(GRIP_FEATURES),
    options: CUSTOM_OPTIONS,
    ...WOOD_TRAINER,
  },

  'custom-iron': {
    gallery: ['bat-custom-iron.png', 'bat-custom-finisher.png', 'bat-custom-youth-finisher.png'],
    tagline: 'Heavier · Game-like feel · Personalization',
    lead: { text: 'Ships in 3–4 weeks', preorder: true },
    pitch: [
      'The Iron Half Bat, built in your colors. Closer to game weight, so it ' +
      'challenges strength, control, and precision while demanding efficient ' +
      'mechanics.',
      'Choose the bat color and finish, pick an engraving color, and add your ' +
      'logo or a line of your own on the barrel.',
    ],
    sections: [
      {
        listTitle: 'Best for',
        list: [
          'College and professional hitters',
          'Advanced high school players preparing for the next level',
          'High-intent, game-speed training',
        ],
      },
    ],
    specs: [
      'Colors shown are approximate and may vary slightly from the product received',
      'Half bat trainer with Pivot Point Grip (pre-installed)',
      'Made with high quality maple wood',
      'Approximately 28 oz',
    ].concat(GRIP_FEATURES),
    options: CUSTOM_OPTIONS,
    ...WOOD_TRAINER,
  },

  'stringking-metal2': {
    tagline: 'BBCOR · Metal · Pivot Point Grip fitted',
    lead: { text: 'Ships in 2–3 business days' },
    pitch: [
      'A StringKing Metal 2 BBCOR bat with the Pivot Point Grip already ' +
      'fitted — the grip on a game-legal bat, so the hands you train ' +
      'are the hands you take to the plate.',
    ],
    sections: [
      {
        listTitle: 'Why it works',
        list: [
          'BBCOR certified, so it is legal where BBCOR is required',
          'Same Power Grooves™ alignment as every PPG trainer',
          'Nothing to install — the grip arrives fitted',
        ],
      },
    ],
    specs: [
      'StringKing Metal 2 BBCOR with Pivot Point Grip (pre-installed)',
      'Metal construction — carries the 6-month metal bat warranty',
    ].concat(GRIP_FEATURES),
    options: [BAT_LENGTH],
    use: 'A game-legal bat. Use it as you would any BBCOR bat.',
    maker: '',
    patent: PATENT,
    policy: POLICY,
  },

  'skinny-trainer': {
    tagline: 'Barrel accuracy · High-rep work',
    lead: { text: 'Ships in 2–3 business days' },
    pitch: [
      'A thin-barrel trainer. The smaller the barrel, the less room there is ' +
      'to be almost right — which is the whole point of picking one up.',
    ],
    specs: ['PPG Skinny Training Bat', 'For training use only'],
    options: [],
    use: 'Tee work and soft toss.',
    balls: APPROVED_BALLS,
    patent: PATENT,
    policy: POLICY,
  },

  'wiffle': {
    tagline: 'Indoors · Backyard · Every day',
    lead: { text: 'Ships in 2–3 business days' },
    pitch: [
      'The wiffle bat, built around the same grip. The one that ends up in ' +
      'the garage in February and in the yard all summer.',
    ],
    specs: ['PPG Wiffle Bat', 'For training use only'],
    options: [],
    use: 'Wiffle balls, indoors or out.',
    balls: 'Wiffle balls and similar light training balls only.',
    patent: PATENT,
    policy: POLICY,
  },

  'ppg-grip-adult': {
    tagline: 'Adult · Self installation · Fits the bat you already own',
    lead: { text: 'Ships in 2–3 business days' },
    pitch: [
      'The Pivot Point Grip on its own, for the bat that is already in the ' +
      'bag. One piece: the knob is part of the grip rather than bolted under ' +
      'it.',
    ],
    sections: [
      {
        listTitle: 'What it does',
        list: GRIP_FEATURES,
      },
    ],
    specs: [
      'Adult Pivot Point Grip — hands 7.25″ and over',
      'Self installation — see the installation guide',
      'Free installation on team orders',
    ],
    options: [],
    use: 'Fits most bats. The existing knob comes off first — the ' +
         'installation guide covers it, including DeMarini and hard plastic knobs.',
    patent: PATENT,
    policy: POLICY,
  },

  'ppg-grip-youth': {
    tagline: 'Youth · Self installation · Fits the bat you already own',
    lead: { text: 'Ships in 2–3 business days' },
    pitch: [
      'The Youth Pivot Point Grip on its own, for the bat that is already in ' +
      'the bag. Same three features as the adult grip, sized for smaller hands.',
    ],
    sections: [
      {
        listTitle: 'What it does',
        list: GRIP_FEATURES,
      },
    ],
    specs: [
      'Youth Pivot Point Grip — hands under 7.25″',
      'Self installation — see the installation guide',
      'Free installation on team orders',
    ],
    options: [],
    use: 'Fits most bats. The existing knob comes off first — the ' +
         'installation guide covers it, including DeMarini and hard plastic knobs.',
    patent: PATENT,
    policy: POLICY,
  },
};

/* The Finisher landing page's own SKU shares the half bat's detail — it is
   the same bat sold through a focused page. */
DETAIL['finisher'] = DETAIL['half-bat'];
