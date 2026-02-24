
export type GamePhase = 'MENU' | 'COMBAT' | 'DRAFT' | 'LOOT' | 'EXTRACTION' | 'META' | 'GAME_OVER';

export enum CardType {
  STRIKE = 'STRIKE',
  BLOCK = 'BLOCK',
  TECH = 'TECH',
  MOVE = 'MOVE',
  GLITCH = 'GLITCH',
  TENTACLE = 'TENTACLE',
  // New Elements
  FIRE = 'FIRE',
  ICE = 'ICE',
  THUNDER = 'THUNDER',
  POISON = 'POISON'
}

export interface CardData {
  id: string;
  type: CardType;
  name: string;
  description: string;
  color: string;
}

export interface EnemyIntent {
  type: 'ATTACK' | 'BUFF' | 'DEBUFF' | 'POLLUTE' | 'WAIT' | 'HEAL'; 
  value: number;
  description: string;
  turnsRemaining: number;
}

export interface Enemy {
  name: string;
  maxHp: number;
  currentHp: number;
  intents: EnemyIntent[];
  currentIntentIndex: number;
  statuses: Record<string, number>;
}

export interface PlayerStats {
  maxHp: number;
  currentHp: number;
  shield: number;
  energy: number;
  maxEnergy: number;
  deck: CardType[];
  blueprints: Blueprint[];
  statuses: Record<string, number>;
  // Calculated stats from Inventory
  damageBonus: number;
  shieldBonus: number; // New: Adds to Block cards
  shieldStart: number;
  thorns: number; // New: Retaliate damage
}

export interface GridItem {
  id: string;
  shape: number[][];
  originalShape?: number[][]; // For unidentified items (hidden shape)
  color: string;
  type: 'CONSUMABLE' | 'ARTIFACT' | 'LOOT'; // New types
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
  name: string;
  description: string; // New
  value: number; // New: Currency Value
  quantity?: number; // New: For stacking consumables
  stats?: {
    damageBonus?: number;
    shieldBonus?: number; // New
    hpBonus?: number;
    shieldStart?: number;
    heal?: number; // For consumables
    thorns?: number; // New
    cleanse?: boolean; // New
  };
  rotation: 0 | 90 | 180 | 270;
  x: number;
  y: number;
  isIdentified?: boolean;
}

export interface InventoryState {
  grid: (string | null)[][];
  items: GridItem[];
  width: number;
  height: number;
}

export type Blueprint = {
  id: string;
  sequence: CardType[];
  name: string;
  effectDescription: string;
  rarity: 'COMMON' | 'RARE' | 'LEGENDARY';
  type: 'DAMAGE' | 'DEFENSE' | 'UTILITY';
  damage?: number;
  shield?: number;
  statusEffect?: {
    type: 'BLEED' | 'CORRUPTION' | 'BURN' | 'POISON' | 'FROZEN' | 'DRAW_NEXT' | 'SHOCK';
    amount: number;
  };
  special?: 'HEAL' | 'DRAW' | 'CLEANSE' | 'EXECUTE_CORRUPTION' | 'FREEZE' | 'THUNDER_DETONATE' | 
            'EXECUTE_LOW_HP' | 'ABSOLUTE_DOMAIN' | 'DISCARD_HAND_DMG' | 'CONSUME_GLITCH_DMG' | 
            'DOUBLE_CAST' | 'THUNDER_BURST' | 'BYPASS_BUFFER' | 'DOUBLE_POISON' | 
            'WEAKEN_ATTACK' | 'PIERCE_DMG' | 'CONVERT_POISON_TO_BURN' | 'PERCENT_HP_DMG' | 
            'DEBUFF_VULNERABLE_OR_DRAW';
};
