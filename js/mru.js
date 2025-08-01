/**
 * MRU (Most Recently Used) class implementation
 * Handles the MRU replacement policy logic
 */
class MRU {
    constructor(numSets) {
        this.numSets = numSets; 
        this.mruOrder = this.initMRU();
    }

    initMRU() {
        return Array.from({ length: this.numSets }, () => []);
    }

    updateMRU(block, setIndex) {
        const mruSet = this.mruOrder[setIndex];
        const blockIndex = mruSet.indexOf(block);

        if (blockIndex !== -1) {
            mruSet.splice(blockIndex, 1);
        }
        
        mruSet.push(block);
    }

    getBlockToEvict(setIndex) {
        const mruSet = this.mruOrder[setIndex];
        if (mruSet.length === 0) {
            return null;
        }
        return mruSet[mruSet.length - 1];
    }

    removeFromMRU(block, setIndex) {
        const mruSet = this.mruOrder[setIndex];
        const blockIndex = mruSet.indexOf(block);
        if (blockIndex !== -1) {
            mruSet.splice(blockIndex, 1);
        }
    }

    getMRUOrder(setIndex) {
        return this.mruOrder[setIndex];
    }

    getAllMRUOrders() {
        const mruCopy = [];
        for (let i = 0; i < this.mruOrder.length; i++) {
            mruCopy[i] = [];
            for (let j = 0; j < this.mruOrder[i].length; j++) {
                mruCopy[i][j] = this.mruOrder[i][j];
            }
        }
        return mruCopy;
    }

    reset() {
        this.mruOrder = this.initMRU();
    }

    generateExplanation(block, setIndex, isHit, removedBlock) {
        const mruSet = this.mruOrder[setIndex];
        let explanation = 'Access block ' + block + ' → Set ' + setIndex + '. ';
        
        if (isHit) {
            explanation += 'HIT! Block ' + block + ' found in cache. Updated MRU order.';
        } else {
            if (removedBlock !== null) {
                explanation += 'MISS! Cache full. Removed MRU block ' + removedBlock + ', loaded block ' + block + '.';
            } else {
                explanation += 'MISS! Loaded block ' + block + ' into available cache slot.';
            }
        }
        explanation += ' Current MRU order: [' + mruSet.join(', ') + ']';
        return explanation;
    }
}