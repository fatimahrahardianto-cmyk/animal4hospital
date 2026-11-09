/* ============================================================================
   ANOMALY HOSPITAL - Complete Lore, Character Skin Shop, Shifts 1-12, & Items
   ============================================================================ */

window.GAME_DATA = {
  // Character Skin Shop Classes (Default beginner skin is FREE; all others cost coins!)
  characters: [
    {
      id: 'intern_rascal',
      icon: '🐰',
      name: 'Intern Rascal',
      subtitle: 'Free Starter Class',
      costType: 'free',
      cost: 0,
      carryCapacity: 1,
      speedMult: 1.0,
      healTime: 5.0,
      sanityDrainMult: 1.0,
      milkBonus: 25,
      emergencyBonusSec: 0,
      startsWithTaser: false,
      startsWithUV: false,
      perk: 'Playful Starter Intern • Standard 1-Item Carry & Balanced Speed',
      lore: 'Playful variant for the free starter Class. Eager to prove himself on his very first night shift at Animal Hospital!'
    },
    {
      id: 'nurse_assistant',
      icon: '🐱',
      name: 'Nurse Assistant Nurse',
      subtitle: 'Extra Inventory Slot Class',
      costType: 'hospital',
      cost: 20,
      carryCapacity: 2,
      speedMult: 1.05,
      healTime: 4.0,
      sanityDrainMult: 1.0,
      milkBonus: 25,
      emergencyBonusSec: 10,
      startsWithTaser: false,
      startsWithUV: false,
      perk: 'Extra Inventory Slot (Carry 2 Items at Once!) & +20% Faster Treatment',
      lore: 'Extra inventory slot Class cosmetically restyled. Can hold two medicines or cards at the same time to heal patients super fast!'
    },
    {
      id: 'psychologist_psycho',
      icon: '🐻',
      name: 'Psychologist Psycho',
      subtitle: 'Expert Sanity Manipulation Class',
      costType: 'hospital',
      cost: 45,
      carryCapacity: 1,
      speedMult: 1.05,
      healTime: 4.5,
      sanityDrainMult: 0.5,
      milkBonus: 38,
      emergencyBonusSec: 0,
      startsWithTaser: false,
      startsWithUV: false,
      perk: '50% Slower Sanity Drain, +50% Milk Healing & Ceiling Panic Resistance',
      lore: 'Edgy variant on the expert-tier Sanity manipulation Class. Studied the hospital anomalies for years without losing his cool.'
    },
    {
      id: 'security_cop',
      icon: '🐶',
      name: 'Security Hospital Cop',
      subtitle: 'Law Enforcement Taser Class',
      costType: 'hospital',
      cost: 50,
      carryCapacity: 1,
      speedMult: 1.25,
      healTime: 5.0,
      sanityDrainMult: 0.85,
      milkBonus: 25,
      emergencyBonusSec: 0,
      startsWithTaser: true,
      startsWithUV: false,
      perk: 'Starts Every Shift with a FREE Taser [T/Q] & +25% Sprint Speed!',
      lore: 'Law enforcement aesthetic on the Taser Class. Patrols the Reception Office and zaps red-eyed anomalies on sight!'
    },
    {
      id: 'head_nurse_supervisor',
      icon: '👑',
      name: 'Head Nurse Supervisor',
      subtitle: 'Ultimate Supervisory Class (Best Character!)',
      costType: 'premium',
      cost: 20,
      carryCapacity: 2,
      speedMult: 1.25,
      healTime: 3.5,
      sanityDrainMult: 0.5,
      milkBonus: 40,
      emergencyBonusSec: 30,
      startsWithTaser: true,
      startsWithUV: true,
      perk: 'FREE Taser + UV Light + Carry 2 Items + Fast Heal + +30s Emergency Time!',
      lore: 'Premium Anomaly Coin supervisory skin. The highest-ranking doctor in Anomaly Hospital with every elite advantage unlocked!'
    }
  ],

  // Uniform Color Skins (First beginner skin is FREE; all others cost 10 Hospital Coins!)
  playerSkins: [
    { id: 'skin_blue', name: 'Beginner Clinical Blue (Default)', hex: '#38bdf8', cost: 0 },
    { id: 'skin_mint', name: 'Surgical Mint', hex: '#34d399', cost: 10 },
    { id: 'skin_lavender', name: 'Lavender Coat', hex: '#a855f7', cost: 15 },
    { id: 'skin_amber', name: 'Amber Hazmat', hex: '#fbbf24', cost: 20 },
    { id: 'skin_rose', name: 'Rose Scrubs', hex: '#f472b6', cost: 25 },
    { id: 'skin_arctic', name: 'Arctic White', hex: '#f1f5f9', cost: 30 }
  ],

  // Safe Color Palette for Patients (Strictly excludes Red and Pure Black as requested)
  safeColors: [
    { name: 'Pastel Pink', hex: '#f9a8d4', num: 0xf9a8d4 },
    { name: 'Lavender Purple', hex: '#c084fc', num: 0xc084fc },
    { name: 'Sky Blue', hex: '#7dd3fc', num: 0x7dd3fc },
    { name: 'Mint Green', hex: '#6ee7b7', num: 0x6ee7b7 },
    { name: 'Pastel Yellow', hex: '#fde047', num: 0xfde047 },
    { name: 'Soft Peach', hex: '#fdba74', num: 0xfdba74 },
    { name: 'Pure White', hex: '#f8fafc', num: 0xf8fafc },
    { name: 'Soft Teal', hex: '#5eead4', num: 0x5eead4 }
  ],

  // 5 Distinct Patient Species
  species: [
    { id: 'rabbit', label: 'Rabbit', earType: 'tall_rounded' },
    { id: 'cat', label: 'Cat', earType: 'pointy' },
    { id: 'dog', label: 'Dog', earType: 'floppy' },
    { id: 'bear', label: 'Bear / Sheep', earType: 'round_sphere', canLightBulbGag: true },
    { id: 'devil_cat', label: 'Horned Cat', earType: 'devil_horns' }
  ],

  patientFirstNames: [
    'Barnaby', 'Mochi', 'Clover', 'Pippin', 'Waffles', 'Biscuit',
    'Luna', 'Ollie', 'Pudding', 'Truffle', 'Milo', 'Daisy',
    'Peanut', 'Maple', 'Sunny', 'Boba', 'Poppy', 'Coco', 'Marshmallow'
  ],
  patientLastNames: [
    'Paws', 'Hopkins', 'Whiskers', 'Fluffington', 'Meadows',
    'Bell', 'Cotton', 'Cloverfield', 'Bramble', 'Velvet', 'Dew'
  ],

  // The 10 Hallway Supply Shelf Medicines (Free & always stocked on left/right hall shelves)
  wardMedicines: [
    { id: 'pill_bottle', name: 'Pill Bottle (Medicine)', symptom: 'Headache', desc: 'Treats headaches.', icon: '💊', color: 0x22c55e },
    { id: 'herbs', name: 'Herbs', symptom: 'Stomach Ache', desc: 'Treats stomach aches.', icon: '🌿', color: 0x16a34a },
    { id: 'cough_syrup', name: 'Cough Syrup', symptom: 'Flu & Cough', desc: 'Treats the flu. Also chokes/melts Slimebert!', icon: '🍯', color: 0xeab308 },
    { id: 'maple_syrup', name: 'Maple / Honey Syrup', symptom: 'Low Sugar (Canadian Condition)', desc: 'Treats low sugar & calms Under-Bed Monster!', icon: '🍁', color: 0xd97706 },
    { id: 'medkit', name: 'Medkit', symptom: 'Bruises & Lacerations', desc: 'Treats bruises and lacerations.', icon: '🧰', color: 0xef4444 },
    { id: 'thermometer', name: 'Thermometer', symptom: 'High Fever', desc: 'Treats fevers.', icon: '🌡️', color: 0xf87171 },
    { id: 'iv_drops', name: 'IV Drops', symptom: 'Dehydration', desc: 'Treats dehydration.', icon: '💧', color: 0x38bdf8 },
    { id: 'eye_drops', name: 'Eye Drops', symptom: 'Dry Eyes', desc: 'Treats dry eyes, calms Ceiling Monster & Ritual Candles!', icon: '👁️', color: 0x60a5fa },
    { id: 'ointment', name: 'Ointment', symptom: 'Burns & Rashes', desc: 'Treats burns and rashes.', icon: '🧴', color: 0xfbbf24 },
    { id: 'bandages', name: 'Bandages', symptom: 'Bleeding', desc: 'Treats bleeding.', icon: '🩹', color: 0xf1f5f9 }
  ],

  // High-Level Emergency Room Surgery Items (Placed on tables inside Top Emergency Room)
  emergencyItems: [
    { id: 'scalpel', name: 'Scalpel', symptom: 'Internal Blockage', desc: 'Emergency surgical incision tool.', icon: '🔪', color: 0xcbd5e1 },
    { id: 'scissors', name: 'Surgical Scissors', symptom: 'Damaged Tissue', desc: 'Emergency suture & tissue cutter.', icon: '✂️', color: 0x94a3b8 },
    { id: 'organ', name: 'Heart Organ', symptom: 'Cardiac Failure', desc: 'Emergency organ replacement (Also calms Bed Monster).', icon: '🫀', color: 0xdc2626 },
    { id: 'transplant', name: 'Tissue Transplant', symptom: 'Severe Trauma', desc: 'Emergency tissue graft (Also calms Bed Monster).', icon: '🥩', color: 0xb91c1c },
    { id: 'antibiotics', name: 'Antibiotics', symptom: 'Acute Sepsis', desc: 'High-strength emergency infection cure.', icon: '🧪', color: 0x15803d }
  ],

  // Supply Shop Items
  shopItems: [
    { id: 'scanner', name: 'Medical DNA Scanner', cost: 45, icon: '📟', desc: 'Scans patient bio-signatures. Shows purple ??? on the Stalker!' },
    { id: 'coffee', name: 'Hot Coffee', cost: 25, icon: '☕', desc: 'Instant +20% Sanity boost anywhere.' },
    { id: 'chocolate', name: 'Chocolate Bar', cost: 20, icon: '🍫', desc: 'Restores +15% Sanity on the spot.' },
    { id: 'cola', name: 'Run Fast Cola', cost: 35, icon: '🥤', desc: 'Permanently boosts sprint speed for this shift.' },
    { id: 'uv_camera', name: 'UV Light Upgrade', cost: 60, icon: '🔮', desc: 'Early access to UV inspection beam (Free from Liz in Shift 10).' },
    { id: 'sam_helper', name: 'Hire Sam (Hazmat NPC)', cost: 250, icon: '🧑‍🚀', desc: 'Available Shift 10+: Sam cleans slime and helps neutralize anomalies!' }
  ],

  // Exact Shift 1 - 12 Progression & Story Events
  shifts: [
    {
      shift: 1,
      difficulty: 'Easy (Tutorial)',
      normalCount: 3,
      anomalyCount: 0,
      cctvActive: false,
      cctvCanBreak: false,
      ceilingMonster: false,
      bedMonster: false,
      camoMonster: false,
      lightsOff: false,
      storyNote: 'Shift 1: Welcome to Animal Hospital! All 3 patients today are 100% Normal. Take their snapshot, click Confirm & Print Tag on the PC, pick up the 3D ID Card from the Printer, assign them to a Ward Bed, and administer their required medicines from the Hall Shelves.'
    },
    {
      shift: 2,
      difficulty: 'Easy-Medium',
      normalCount: 3,
      anomalyCount: 1,
      cctvActive: true,
      cctvCanBreak: false,
      ceilingMonster: true,
      bedMonster: false,
      camoMonster: false,
      lightsOff: false,
      storyNote: 'Shift 2: CCTV is now ONLINE! 3 Normal patients and 1 Anomaly will visit. Anomalies can ONLY be seen on CCTV or in Camera Polaroid photos (red/wide eyes or ear distortion). Watch out for the "Don\'t look up" ceiling monster!'
    },
    {
      shift: 3,
      difficulty: 'Medium',
      normalCount: 3,
      anomalyCount: 2,
      cctvActive: true,
      cctvCanBreak: true,
      ceilingMonster: true,
      bedMonster: true,
      camoMonster: true,
      lightsOff: false,
      specialVisitors: ['barney_s3', 'rathew_s3'],
      storyNote: 'Shift 3: Fire Extinguisher & Wheelchair unlocked! 3 Normal patients (including Rathew the Black Rat) and 2 Anomalies. Barney will also visit asking for Milk and leaving a mysterious suitcase. CCTV cameras can now break and require repair!'
    },
    {
      shift: 4,
      difficulty: 'Medium-Hard',
      normalCount: 2,
      anomalyCount: 2,
      cctvActive: true,
      cctvCanBreak: true,
      ceilingMonster: true,
      bedMonster: true,
      camoMonster: true,
      lightsOff: false,
      specialVisitors: ['barney_s4', 'rathew_s4'],
      storyNote: 'Shift 4: 2 Normal patients and 2 Anomalies. Barney returns asking for Milk and a photo of his face. Rathew will faint upon arrival—carry him to a bed and cure him so he reveals the secret of his twin sister Rattina and gives you the Vault Key!'
    },
    {
      shift: 5,
      difficulty: 'Hard (Ambulance Rush)',
      normalCount: 7,
      anomalyCount: 3,
      cctvActive: true,
      cctvCanBreak: true,
      ceilingMonster: true,
      bedMonster: false,
      camoMonster: true,
      lightsOff: false,
      ambulanceEvent: true,
      deathRitualCount: 1,
      specialVisitors: ['barney_s5'],
      storyNote: 'Shift 5: EMERGENCY AMBULANCE! The Wheelbed is unlocked (+30s emergency timer). An ambulance barges in dropping 7 Normal patients & 3 Anomalies fainted in front of Registration without registering! Carry them to beds, watch out for 1 Death Ritual room, and Barney picks up his suitcase.'
    },
    {
      shift: 6,
      difficulty: 'Hard (Manager Box & Police)',
      normalCount: 5,
      anomalyCount: 3,
      cctvActive: true,
      cctvCanBreak: true,
      ceilingMonster: true,
      bedMonster: true,
      camoMonster: true,
      lightsOff: false,
      managerBoxTask: true,
      hungryAnomaliesHuntPatients: true,
      specialVisitors: ['barney_police_s6'],
      storyNote: 'Shift 6: Carry the Delivery Box to unlock the Manager\'s Office! 5 Normal & 3 Anomalies. Hungry anomalies now hunt recovering patients (16s to save them). At shift end, Barney begs you to hide him from the Police—choose wisely to earn the Infinite Revolver Gun!'
    },
    {
      shift: 7,
      difficulty: 'Very Hard (The Stalker)',
      normalCount: 8,
      anomalyCount: 4,
      cctvActive: true,
      cctvCanBreak: true,
      ceilingMonster: true,
      bedMonster: true,
      camoMonster: true,
      lightsOff: false,
      hungryAnomaliesHuntPatients: true,
      specialVisitors: ['rattina_stalker_s7'],
      storyNote: 'Shift 7: 8 Normal patients & 4 Anomalies. One anomaly is Rattina (The Stalker)—she hands a glitchy Animal Corp form, bends down to block the shutters, and reacts to Rattina\'s Vault Photo & the Medical Scanner. Snap a Camera photo of her to make her vanish!'
    },
    {
      shift: 8,
      difficulty: 'Very Hard (Under-Bed Outbreak)',
      normalCount: 6,
      anomalyCount: 4,
      cctvActive: true,
      cctvCanBreak: true,
      ceilingMonster: true,
      bedMonster: true,
      bedMonsterHighFreq: true,
      camoMonster: true,
      lightsOff: false,
      hungryAnomaliesHuntPatients: true,
      storyNote: 'Shift 8: 6 Normal patients & 4 Anomalies. High Under-Bed Monster activity (mutated low-sanity cat from Room 4). Step clear of red bed zones or feed it Maple Syrup, an Organ, or a Transplant!'
    },
    {
      shift: 9,
      difficulty: 'Extreme (Blackout Shift)',
      normalCount: 4,
      anomalyCount: 3,
      cctvActive: true,
      cctvCanBreak: true,
      ceilingMonster: true,
      bedMonster: true,
      camoMonster: true,
      lightsOff: true,
      gunStationActive: true,
      hungryAnomaliesHuntPatients: true,
      storyNote: 'Shift 9: 4 Normal patients & 3 Anomalies. Hospital Lights go OFF—use your bright Flashlight [F] and restore the Fuse Box! The Defense Gun is available (only 1 player can hold the shared station gun at a time).'
    },
    {
      shift: 10,
      difficulty: 'Extreme (Slimebert & Liz UV)',
      normalCount: 7,
      anomalyCount: 3,
      cctvActive: true,
      cctvCanBreak: true,
      ceilingMonster: true,
      bedMonster: true,
      camoMonster: true,
      lightsOff: false,
      slimebertActive: true,
      lizVisits: true,
      hungryAnomaliesHuntPatients: true,
      storyNote: 'Shift 10: Liz (Lisbeth) arrives to give you the UV Camera / UV Light! 7 Normal & 3 Anomalies. SLIMEBERT the giant green slime monster spawns—he is immune to guns/tasers; stun him with the Fire Extinguisher or melt him with Cough Syrup!'
    },
    {
      shift: 11,
      difficulty: 'Extreme+ (Death Rituals)',
      normalCount: 9,
      anomalyCount: 3,
      cctvActive: true,
      cctvCanBreak: true,
      ceilingMonster: true,
      bedMonster: true,
      camoMonster: true,
      lightsOff: false,
      slimebertActive: true,
      deathRitualCount: 2,
      lizVisits: true,
      hungryAnomaliesHuntPatients: true,
      storyNote: 'Shift 11: 9 Normal patients & 3 Anomalies. Multiple Death Ritual emergencies will occur—extinguish all levitating patient candles within 35s using Eye Drops (no sanity loss), Interacting [E], or Tasing the patient!'
    },
    {
      shift: 12,
      difficulty: 'NIGHTMARE FINALE',
      normalCount: 10,
      anomalyCount: 2,
      cctvActive: true,
      cctvCanBreak: true,
      ceilingMonster: true,
      bedMonster: true,
      camoMonster: true,
      lightsOff: true,
      finalBossManagerEvent: true,
      hungryAnomaliesHuntPatients: true,
      storyNote: 'Shift 12 (FINALE): 10 Normal & 2 Anomalies. Lights off, Ceiling & Bed Monsters active. Investigate the bloody Manager\'s Office door—survive the 10s Gun showdown against the Manager-Eating Anomaly, extinguish the 3s Hospital Fire, and unlock the Grand Disco Celebration!'
    }
  ]
};
