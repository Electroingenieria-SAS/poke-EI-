export const NPCS = [
  {
    id: 'iria', x: 330, y: 250, tint: 0xf7d36b, name: 'Iria',
    dialog: [
      'El santuario del sur volvió a despertar.',
      'Activa las tres runas en este orden: SOL, RÍO y RAÍZ.',
      'Cuando el sello ceda, baja y descubre qué está alterando a las criaturas.'
    ]
  },
  {
    id: 'kael', x: 220, y: 350, tint: 0x8ed8ff, name: 'Kael',
    dialog: [
      'Fuera de los caminos seguros aparecen criaturas salvajes.',
      'Golpéalas, administra tu stamina y usa Vínculo cuando estén debilitadas.',
      'Si quieres probar el combate rápido, vuelve a hablar conmigo después de aceptar la misión.'
    ]
  }
] as const;

export const RUNES = [
  { id: 'SOL', x: 260, y: 300, glyph: '☀' },
  { id: 'RÍO', x: 420, y: 255, glyph: '≈' },
  { id: 'RAÍZ', x: 470, y: 450, glyph: '⌘' }
] as const;

export const DUNGEON_ENTRANCE = { x: 550, y: 500 };

export const ENCOUNTER_ZONES = [
  { x: 165, y: 150, width: 120, height: 110 },
  { x: 430, y: 315, width: 115, height: 120 }
];
