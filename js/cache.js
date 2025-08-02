/**
 * Cache class implementation
 * Handles the cache memory structure and operations
 */
class Cache {
    constructor(numBlocks, ways, lineSize = 1) {
        this.numBlocks = numBlocks;
        this.ways = ways;
        this.lineSize = lineSize;
        this.cache = this.initCache();
    }

    initCache() {
        const sets = this.numBlocks / this.ways;
        return Array.from({ length: sets }, () => Array(this.ways).fill(null));
    }

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

    addBlock(block, setIndex) {
        const set = this.cache[setIndex];
        for (let i = 0; i < this.ways; i++) {
            if (set[i] === null) {
                set[i] = block;
                return true;
            }
        }
        return false;
    }

    removeBlock(block, setIndex) {
        const set = this.cache[setIndex];
        const blockIndex = set.indexOf(block);
        if (blockIndex !== -1) {
            set[blockIndex] = null;
            return true;
        }
        return false;
    }

    replaceBlock(oldBlock, newBlock, setIndex) {
        const set = this.cache[setIndex];
        const oldIndex = set.indexOf(oldBlock);
        if (oldIndex !== -1) {
            set[oldIndex] = newBlock;
        } else {
            this.addBlock(newBlock, setIndex);
        }
    }

    getSet(setIndex) {
        return this.cache[setIndex];
    }

    isSetFull(setIndex) {
        const set = this.cache[setIndex];
        return !set.includes(null);
    }

    reset() {
        this.cache = this.initCache();
    }

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

    getStats() {
        let totalBlocks = 0;
        this.cache.forEach(set => {
            totalBlocks += set.filter(block => block !== null).length;
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