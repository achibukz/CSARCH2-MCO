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
        return Array.from({ length: sets }, () => []);
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
        if (set.length < this.ways) {
            set.push(block);
            return true;
        }
        return false;
    }

    removeBlock(block, setIndex) {
        const set = this.cache[setIndex];
        const blockIndex = set.indexOf(block);
        if (blockIndex !== -1) {
            set.splice(blockIndex, 1);
            return true;
        }
        return false;
    }

    replaceBlock(oldBlock, newBlock, setIndex) {
        const set = this.cache[setIndex];
        const oldIndex = set.indexOf(oldBlock);
        if (oldIndex !== -1) {
            set.splice(oldIndex, 1);
        }
        set.push(newBlock);
    }

    getSet(setIndex) {
        return this.cache[setIndex];
    }

    isSetFull(setIndex) {
        return this.cache[setIndex].length >= this.ways;
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