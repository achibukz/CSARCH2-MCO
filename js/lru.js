/**
 * LRU (Least Recently Used) class implementation
 * Handles the LRU replacement policy logic
 */
class LRU {
    constructor(numSets) {
        this.numSets = numSets; 
        this.lruOrder = this.initLRU();
    }

    initLRU() {
        return Array.from({ length: this.numSets }, () => []);
    }

    updateLRU(block, setIndex) {
        const lruSet = this.lruOrder[setIndex];
        const blockIndex = lruSet.indexOf(block);

        if (blockIndex !== -1) {
            lruSet.splice(blockIndex, 1);
        }
        
        lruSet.push(block);
    }

    getBlockToEvict(setIndex) {
        const lruSet = this.lruOrder[setIndex];
        if (lruSet.length === 0) {
            return null;
        }
        return lruSet[0]; // Return least recently used (first in array)
    }

    removeFromLRU(block, setIndex) {
        const lruSet = this.lruOrder[setIndex];
        const blockIndex = lruSet.indexOf(block);
        if (blockIndex !== -1) {
            lruSet.splice(blockIndex, 1);
        }
    }

    getLRUOrder(setIndex) {
        return this.lruOrder[setIndex];
    }

    getAllLRUOrders() {
        const lruCopy = [];
        for (let i = 0; i < this.lruOrder.length; i++) {
            lruCopy[i] = [];
            for (let j = 0; j < this.lruOrder[i].length; j++) {
                lruCopy[i][j] = this.lruOrder[i][j];
            }
        }
        return lruCopy;
    }

    reset() {
        this.lruOrder = this.initLRU();
    }

    generateExplanation(block, setIndex, isHit, removedBlock) {
        const lruSet = this.lruOrder[setIndex];
        let explanation = 'Access block ' + block + ' → Set ' + setIndex + '. ';
        
        if (isHit) {
            explanation += 'HIT! Block ' + block + ' found in cache. Updated LRU order.';
        } else {
            if (removedBlock !== null) {
                explanation += 'MISS! Cache full. Removed LRU block ' + removedBlock + ', loaded block ' + block + '.';
            } else {
                explanation += 'MISS! Loaded block ' + block + ' into available cache slot.';
            }
        }
        explanation += ' Current LRU order: [' + lruSet.join(', ') + ']';
        return explanation;
    }
}
