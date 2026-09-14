import { MAP_0 } from './map0';
import { MAP_1 } from './map1';
import { MAP_2 } from './map2';
import { MAP_3 } from './map3';
import { MAP_4 } from './map4';
import { PLAYER_WALK } from './playerWalk';
import { PLAYER_IDLE } from './playerIdle';
import { PLAYER_SLASH } from './playerSlash';

const map = MAP_0 + MAP_1 + MAP_2 + MAP_3 + MAP_4;

export const RUNTIME_ASSETS = {
  worldMap: `data:image/webp;base64,${map}`,
  playerWalk: `data:image/png;base64,${PLAYER_WALK}`,
  playerIdle: `data:image/png;base64,${PLAYER_IDLE}`,
  playerSlash: `data:image/png;base64,${PLAYER_SLASH}`
} as const;
