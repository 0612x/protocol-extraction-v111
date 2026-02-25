import React from 'react';
import { InventoryState, MetaState, GridItem } from '../../types';
import { InventoryView } from './InventoryView';

interface WarehouseViewProps {
  metaState: MetaState;
  setMetaState: React.Dispatch<React.SetStateAction<MetaState>>;
  onBack: () => void;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({ metaState, setMetaState, onBack }) => {
  const activeCharacter = metaState.roster.find(c => c.id === metaState.activeCharacterId);

  if (!activeCharacter) {
    return <div>No active character selected.</div>;
  }

  const handleCharacterInventoryUpdate = (newInventory: InventoryState) => {
    setMetaState(prev => ({
      ...prev,
      roster: prev.roster.map(c => 
        c.id === activeCharacter.id ? { ...c, inventory: newInventory } : c
      ),
    }));
  };

  const handleWarehouseInventoryUpdate = (newInventory: InventoryState) => {
    setMetaState(prev => ({
      ...prev,
      warehouse: newInventory,
    }));
  };

  return (
    <div className="h-full w-full bg-stone-900 text-white p-4 flex flex-col font-mono">
      <h1 className="text-3xl font-bold text-center mb-4 text-yellow-300">Warehouse</h1>
      <div className="flex-grow flex gap-4">
        <div className="w-1/2 flex flex-col">
            <h2 className="text-xl text-center mb-2">{activeCharacter.name}'s Inventory</h2>
            <InventoryView
                inventory={activeCharacter.inventory}
                setInventory={handleCharacterInventoryUpdate}
                externalInventory={metaState.warehouse}
                setExternalInventory={handleWarehouseInventoryUpdate}
                externalTitle="Warehouse"
                onFinish={() => {}} // No-op
                isLootPhase={false} // Not applicable
                currentStage={0} // Not applicable
                maxStage={0} // Not applicable
                setMetaState={setMetaState}
            />
        </div>
        <div className="w-1/2 flex flex-col">
             <h2 className="text-xl text-center mb-2">Warehouse</h2>
             {/* This is a bit redundant, but the InventoryView is designed to have a primary and an external. */}
             {/* We'll render another one, but swap the inventories. */}
             <InventoryView
                inventory={metaState.warehouse}
                setInventory={handleWarehouseInventoryUpdate}
                externalInventory={activeCharacter.inventory}
                setExternalInventory={handleCharacterInventoryUpdate}
                externalTitle={`${activeCharacter.name}'s Inventory`}
                onFinish={() => {}} // No-op
                isLootPhase={false} // Not applicable
                currentStage={0} // Not applicable
                maxStage={0} // Not applicable
                setMetaState={setMetaState}
            />
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <button 
          onClick={onBack}
          className="bg-yellow-500 hover:bg-yellow-600 text-stone-900 font-bold py-2 px-6 rounded-lg transition-colors"
        >
          Back to Base Camp
        </button>
      </div>
    </div>
  );
};
