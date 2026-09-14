export const NPCS = [
  {
    id: 'iria', x: 326, y: 244, tint: 0xf8d68a, name: 'Iria', role: 'Guardiana del valle',
    dialog: [
      'Algo volvió a moverse bajo el santuario del sur.',
      'Las marcas antiguas responden en este orden: SOL, RÍO y RAÍZ.',
      'Hazlas resonar y vuelve a la casa de piedra. Allí comienza el descenso.'
    ]
  },
  {
    id: 'kael', x: 205, y: 350, tint: 0x9fd9ff, name: 'Kael', role: 'Explorador',
    dialog: [
      'Las criaturas se están acercando cada vez más al camino.',
      'Debilítalas, cuida tu stamina y usa Vínculo cuando tengas una oportunidad.',
      'Si quieres practicar, vuelve conmigo después de hablar con Iria.'
    ]
  }
] as const;

export const RUNES = [
  { id: 'SOL', x: 282, y: 469, glyph: '✦' },
  { id: 'RÍO', x: 107, y: 530, glyph: '≈' },
  { id: 'RAÍZ', x: 523, y: 438, glyph: '⌘' }
] as const;

export const DUNGEON_ENTRANCE = { x: 414, y: 428 };

export const ENCOUNTER_ZONES = [
  { x: 398, y: 212, width: 110, height: 85 },
  { x: 465, y: 455, width: 100, height: 90 },
  { x: 112, y: 390, width: 90, height: 85 }
];
