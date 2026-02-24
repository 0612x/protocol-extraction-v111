
import { GridItem } from '../types';
import { EQUIPMENT_ROW_COUNT } from '../constants';

export const rotateMatrix = (matrix: number[][]): number[][] => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const newMatrix: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      newMatrix[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return newMatrix;
};

export const canPlaceItem = (
  grid: (string | null)[][],
  item: GridItem,
  gridX: number,
  gridY: number,
  rotation: number = 0
): boolean => {
  let shape = item.shape;
  for (let i = 0; i < rotation / 90; i++) {
    shape = rotateMatrix(shape);
  }

  const rows = shape.length;
  const cols = shape[0].length;
  const gridHeight = grid.length;
  const gridWidth = grid[0].length;

  // Zone Boundary Check
  // Only enforce Zone Logic (Equipment vs Backpack) for the Player Grid (height > 4).
  // Loot crates (height 4) are single-zone and allow free placement.
  const isPlayerInventory = gridHeight > 4;
  const startZone = gridY < EQUIPMENT_ROW_COUNT ? 'EQUIPMENT' : 'BACKPACK';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shape[r][c] === 1) {
        const targetX = gridX + c;
        const targetY = gridY + r;

        // 1. Out of bounds check
        if (targetX < 0 || targetX >= gridWidth || targetY < 0 || targetY >= gridHeight) {
          return false;
        }

        // 2. Zone Crossing Check (Player Inventory Only)
        if (isPlayerInventory) {
            const currentCellZone = targetY < EQUIPMENT_ROW_COUNT ? 'EQUIPMENT' : 'BACKPACK';
            if (currentCellZone !== startZone) {
                return false; // Item is trying to cross the border
            }
        }

        // 3. Collision check
        const cellId = grid[targetY][targetX];
        if (cellId !== null && cellId !== item.id) {
          return false;
        }
      }
    }
  }

  return true;
};

export const placeItemInGrid = (
  grid: (string | null)[][],
  item: GridItem,
  x: number,
  y: number
): (string | null)[][] => {
  const newGrid = grid.map(row => [...row]);
  let shape = item.shape;
  for (let i = 0; i < item.rotation / 90; i++) {
    shape = rotateMatrix(shape);
  }

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c] === 1) {
        newGrid[y + r][x + c] = item.id;
      }
    }
  }
  return newGrid;
};

export const createEmptyGrid = (w: number, h: number) => 
  Array.from({ length: h }, () => Array(w).fill(null));

export const removeItemFromGrid = (grid: (string | null)[][], itemId: string) => {
  return grid.map(row => row.map(cell => (cell === itemId ? null : cell)));
};

// --- SMART AUTO-ARRANGE LOGIC ---

/**
 * Attempts to find a valid arrangement where the `fixedItem` is placed at `fixedX, fixedY`,
 * and any overlapping items are moved to nearby open spaces, potentially rotating them.
 * 
 * Returns: An array of GridItems with updated coordinates/rotations for the moved items, 
 *          or NULL if no valid arrangement exists.
 */
export const findSmartArrangement = (
    currentGridItems: GridItem[],
    fixedItem: GridItem,
    fixedX: number,
    fixedY: number,
    gridWidth: number,
    gridHeight: number
): GridItem[] | null => {
    // 1. Identify items colliding with the dragged item at the target position
    const draggedMask = new Set<string>();
    const draggedShape = fixedItem.shape; 
    
    const collidingIds = new Set<string>();
    
    const getItemAt = (x: number, y: number, items: GridItem[]) => {
        return items.find(i => {
             if (i.id === fixedItem.id) return false;
             // Check if item i covers (x,y)
             const localX = x - i.x;
             const localY = y - i.y;
             if (localX >= 0 && localY >= 0 && localY < i.shape.length && localX < i.shape[0].length) {
                 return i.shape[localY][localX] === 1;
             }
             return false;
        });
    };

    for (let r = 0; r < draggedShape.length; r++) {
        for (let c = 0; c < draggedShape[0].length; c++) {
            if (draggedShape[r][c] === 1) {
                const tx = fixedX + c;
                const ty = fixedY + r;
                
                // Bounds Check for Dragged Item
                if (tx < 0 || tx >= gridWidth || ty < 0 || ty >= gridHeight) return null; // Impossible
                
                // Zone Logic Check
                const isPlayerInventory = gridHeight > 4;
                const fixedStartZone = fixedY < EQUIPMENT_ROW_COUNT ? 'EQUIPMENT' : 'BACKPACK';
                if (isPlayerInventory) {
                    const currentCellZone = ty < EQUIPMENT_ROW_COUNT ? 'EQUIPMENT' : 'BACKPACK';
                    if (currentCellZone !== fixedStartZone) return null; // Cannot cross zone
                }

                // Identify Collision
                const hitItem = getItemAt(tx, ty, currentGridItems);
                if (hitItem) {
                    collidingIds.add(hitItem.id);
                }
            }
        }
    }

    if (collidingIds.size === 0) return null; // No need to rearrange, standard placement works

    // 2. Prepare for Rearrangement
    const itemsToMove = currentGridItems.filter(i => collidingIds.has(i.id));
    const staticItems = currentGridItems.filter(i => !collidingIds.has(i.id) && i.id !== fixedItem.id);
    
    // Build a temporary grid with STATIC items + FIXED dragged item
    let tempGrid = createEmptyGrid(gridWidth, gridHeight);
    
    // Place Statics
    for (const item of staticItems) {
        tempGrid = placeItemInGrid(tempGrid, item, item.x, item.y);
    }
    // Place Fixed Dragged Item (Pass rotation 0 because shape is source of truth)
    const fixedItemObj = { ...fixedItem, x: fixedX, y: fixedY, rotation: 0 as const }; 
    tempGrid = placeItemInGrid(tempGrid, fixedItemObj, fixedX, fixedY);

    // 3. Try to place displaced items with Rotation
    const newPositions: GridItem[] = [];

    // Heuristic: Sort items to move by size (largest first usually harder to place)
    itemsToMove.sort((a, b) => (b.shape.length * b.shape[0].length) - (a.shape.length * a.shape[0].length));

    for (const item of itemsToMove) {
        let placed = false;
        
        // Search Radius Strategy: Spiral out from original position
        const candidates: {x: number, y: number, dist: number}[] = [];
        
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                const dist = Math.abs(x - item.x) + Math.abs(y - item.y); 
                candidates.push({ x, y, dist });
            }
        }
        candidates.sort((a, b) => a.dist - b.dist);

        for (const pos of candidates) {
            if (placed) break;

            // Try all 4 rotations, starting with CURRENT rotation
            // We use item.originalShape (base unrotated) if available to generate pure rotations,
            // otherwise we rotate current item.shape.
            
            // Note: In this app, item.originalShape seems to be kept in sync with item.shape via rotation logic 
            // in InventoryView (handleRotate updates both). So item.originalShape effectively represents 
            // the shape at 'current' orientation but maybe before some specialized masking.
            // Let's assume item.shape is the definitive shape at current rotation.
            
            let testShape = item.originalShape || item.shape;

            for (let r = 0; r < 4; r++) {
                 // Try rotations: 0, 90, 180, 270 relative to base shape
                 // But wait, we want to try *current* rotation first to minimize spinning.
                 // Let's just iterate 0..3 on top of testShape.
                 // We need to calculate the actual new Rotation attribute.
                 
                 // If we rotate 'testShape', we are effectively adding 90deg to the rotation.
                 // r=0: current base shape (originalShape is synced to current state in this app logic)
                 
                 const newRotation = (item.rotation + (r * 90)) % 360 as 0 | 90 | 180 | 270;
                 
                 const testItem = { 
                     ...item, 
                     x: pos.x, 
                     y: pos.y, 
                     shape: testShape,
                     rotation: newRotation,
                     // We update originalShape in result to match the visual shape if that's how app state tracks it
                     originalShape: item.originalShape ? testShape : undefined
                 };
                 
                 // Check placement (rotation=0 because shape is manually rotated)
                 if (canPlaceItem(tempGrid, testItem, pos.x, pos.y, 0)) {
                     // Success
                     tempGrid = placeItemInGrid(tempGrid, testItem, pos.x, pos.y);
                     newPositions.push(testItem);
                     placed = true;
                     break;
                 }
                 
                 // Rotate shape for next iteration
                 testShape = rotateMatrix(testShape);
            }
        }

        if (!placed) return null; // Failed to find space for one of the displaced items
    }

    return newPositions;
};
