/*

Idea dump: 
Tracks which blocks are used
Decides the block to remove 
Updates the order

*/

class MRUPolicy {
    
    constructor(numSets) {
        this.numSets = numSets;
        this.mruOrder = this.initMRU();
    }

    /**
     * Initialize MRU tracking arrays for each set
     */
    initMRU() {
        return Array.from({ length: this.numSets }, () => []);
    }

    /**
     * Update MRU order when a block is accessed
     * Most recently used block goes to the end of the array
     */
    updateMRU(block, setIndex) {
        const mruSet = this.mruOrder[setIndex];
        const blockIndex = mruSet.indexOf(block);

        // Remove block from current position if it exists
        if (blockIndex !== -1) {
            mruSet.splice(blockIndex, 1);
        }
        
        // Add block to end (most recent position)
        mruSet.push(block);
    }

    /**
     * Get the block to evict (Most Recently Used)
     * Returns the block that should be Removed
     */
    getBlockToEvict(setIndex) {
        const mruSet = this.mruOrder[setIndex];
        if (mruSet.length === 0) {
            return null;
        }
        // Return the most recently used block (last in array)
        return mruSet[mruSet.length - 1];
    }

    /**
     * Remove a block from MRU tracking (when Removed)
     */
    removeFromMRU(block, setIndex) {
        const mruSet = this.mruOrder[setIndex];
        const blockIndex = mruSet.indexOf(block);
        if (blockIndex !== -1) {
            mruSet.splice(blockIndex, 1);
        }
    }

    /**
     * Get current MRU order for a specific set
     */
    getMRUOrder(setIndex) {
        return this.mruOrder[setIndex];
    }

    /**
     * Get all MRU orders
     */
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

    /**
     * Reset MRU tracking to initial state
     */
    reset() {
        this.mruOrder = this.initMRU();
    }

    /**
     * Generate explanation of MRU decision
     */
    generateExplanation(block, setIndex, isHit, RemovedBlock) {
        const mruSet = this.mruOrder[setIndex];
        let explanation = 'Access block ' + block + ' → Set ' + setIndex + '. ';
        
        if (isHit) {
            explanation += 'HIT! Block ' + block + ' found in cache. Updated MRU order.';
        } else {
            if (RemovedBlock !== null) {
                explanation += 'MISS! Cache full. Removed MRU block ' + RemovedBlock + ', loaded block ' + block + '.';
            } else {
                explanation += 'MISS! Loaded block ' + block + ' into available cache slot.';
            }
        }
        explanation += ' Current MRU order: [' + mruSet.join(', ') + ']';
        return explanation;
    }
}
