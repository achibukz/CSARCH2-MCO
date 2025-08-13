/**
 * FIFO (First In First Out) class implementation
 * Handles the FIFO replacement policy logic
 */
class FIFO {
    constructor(numSets) {
        this.numSets = numSets; 
        this.fifoOrder = this.initFIFO();
    }

    initFIFO() {
        return Array.from({ length: this.numSets }, () => []);
    }

    updateFIFO(block, setIndex) {
        const fifoSet = this.fifoOrder[setIndex];
        const blockIndex = fifoSet.indexOf(block);

        // Only add if it's not already in the set (new block)
        if (blockIndex === -1) {
            fifoSet.push(block);
        }
        // For FIFO, we don't reorder on hits - order is preserved by insertion time
    }

    getBlockToEvict(setIndex) {
        const fifoSet = this.fifoOrder[setIndex];
        if (fifoSet.length === 0) {
            return null;
        }
        return fifoSet[0]; // Return first in (oldest)
    }

    removeFromFIFO(block, setIndex) {
        const fifoSet = this.fifoOrder[setIndex];
        const blockIndex = fifoSet.indexOf(block);
        if (blockIndex !== -1) {
            fifoSet.splice(blockIndex, 1);
        }
    }

    getFIFOOrder(setIndex) {
        return this.fifoOrder[setIndex];
    }

    getAllFIFOOrders() {
        const fifoCopy = [];
        for (let i = 0; i < this.fifoOrder.length; i++) {
            fifoCopy[i] = [];
            for (let j = 0; j < this.fifoOrder[i].length; j++) {
                fifoCopy[i][j] = this.fifoOrder[i][j];
            }
        }
        return fifoCopy;
    }

    reset() {
        this.fifoOrder = this.initFIFO();
    }

    generateExplanation(block, setIndex, isHit, removedBlock) {
        const fifoSet = this.fifoOrder[setIndex];
        let explanation = 'Access block ' + block + ' → Set ' + setIndex + '. ';
        
        if (isHit) {
            explanation += 'HIT! Block ' + block + ' found in cache. FIFO order unchanged.';
        } else {
            if (removedBlock !== null) {
                explanation += 'MISS! Cache full. Removed oldest block ' + removedBlock + ', loaded block ' + block + '.';
            } else {
                explanation += 'MISS! Loaded block ' + block + ' into available cache slot.';
            }
        }
        explanation += ' Current FIFO order: [' + fifoSet.join(', ') + ']';
        return explanation;
    }
}
