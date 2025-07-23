/*

Idea dump: 
Cache is handling the cache structure
Finding the # of blocks
Adding or Removing blocks from the cache
Checker for Set and Getters

*/

class Cache {
    
    constructor(numBlocks, ways, lineSize = 1) {
        this.numBlocks = numBlocks;
        this.ways = ways;
        this.lineSize = lineSize; // words per cache line
        this.cache = this.initCache();
    }

    /**
     * Initialize cache structure - array of sets, each set is an array of blocks
     */
    initCache() {
        const sets = this.numBlocks / this.ways;
        return Array.from({ length: sets }, () => []);
    }

    /**
     * Find a block in the cache
     * Returns: { found: boolean, setIndex: number, wayIndex: number }
     */
    findBlock(block) {
        const setIndex = block % this.cache.length;
        const set = this.cache[setIndex];
        const wayIndex = set.findIndex(entry => entry === block);
        
        return {
            found: wayIndex !== -1,
            setIndex: setIndex,
            wayIndex: wayIndex
        };
    }

    /**
     * Add a block to a specific set
     * Returns: boolean (success/failure)
     */
    addBlock(block, setIndex) {
        const set = this.cache[setIndex];
        if (set.length < this.ways) {
            set.push(block);
            return true;
        }
        return false; // Set is full
    }

    /**
     * Remove a block from cache
     * Returns: boolean (success/failure)
     */
    removeBlock(block, setIndex) {
        const set = this.cache[setIndex];
        const blockIndex = set.indexOf(block);
        if (blockIndex !== -1) {
            set.splice(blockIndex, 1);
            return true;
        }
        return false;
    }

    /**
     * Replace a block in cache (remove old, add new)
     */
    replaceBlock(oldBlock, newBlock, setIndex) {
        const set = this.cache[setIndex];
        const oldIndex = set.indexOf(oldBlock);
        if (oldIndex !== -1) {
            set.splice(oldIndex, 1);
        }
        set.push(newBlock);
    }

    /**
     * Get a specific set
     */
    getSet(setIndex) {
        return this.cache[setIndex];
    }

    /**
     * Check if a set is full
     */
    isSetFull(setIndex) {
        return this.cache[setIndex].length >= this.ways;
    }

    /**
     * Reset cache to initial empty state
     */
    reset() {
        this.cache = this.initCache();
    }

    /**
     * Get current cache state (simple copy)
     */
    getCache() {
        const cacheCopy = [];
        for (let i = 0; i < this.cache.length; i++) {
            cacheCopy[i] = [];
            for (let j = 0; j < this.cache[i].length; j++) {
                cacheCopy[i][j] = this.cache[i][j];
            }
        }
        return cacheCopy;
    }

    /**
     * Get cache statistics
     */
    getStats() {
        let totalBlocks = 0;
        this.cache.forEach(set => {
            totalBlocks += set.length;
        });
        
        return {
            totalBlocks: totalBlocks,
            sets: this.cache.length,
            ways: this.ways,
            lineSize: this.lineSize,
            utilization: ((totalBlocks / this.numBlocks) * 100).toFixed(2) + '%'
        };
    }
}