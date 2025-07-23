class Cache{

    /* 
    numBlocks: Number of Cache Blocks
    num: constant, divide always by 4 since its 4-way
    */
    constructor(numBlocks, num){ 
        this.numBlocks = numBlocks;
        this.num = num;
        this.cache = this.initCache();
        this.MRU = this.initMRU();
    }

    initCache(){
        const sets = this.numBlocks / this.num; // Getting Number of sets 
        return Array.from({length: sets}, () => []); // creates sub-arrays [ [],[],[] ]
    }

    initMRU(){
        const sets = this.numBlocks / this.num; // Getting Number of sets 
        return Array.from({length: sets}, () => []); // creates sub-arrays [ [],[],[] ]
    }

    /* 
    Accessing a block in the cache
    Returns: 
        hit: boolean
        index: number
        removeBlock: null or number
    */
    accessBlock(block){
        const index = block % this.cache.length;
        const set = this.cache[index];
        const mruSet = this.MRU[index];
        const hitIndex = set.indexOf(block);

        let hit = false;  // Cache Hit
        let removeBlock = null; // Block that gets removed from the cache when the set is already full 
        
        if (hitIndex != -1){
            hit = true; 

            // Update the MRU order
            const mruPos = mruSet.indexOf(block);
            if (mruPos !== -1) {
                mruSet.splice(mruPos, 1);
            }
            mruSet.push(block);
        }
        else {
           // Cache miss
            if (set.length >= this.num) {
                // Cache set is full, evict the least recently used (first in MRU)
                removeBlock = mruSet.shift(); // pop from front
                const removeIndex = set.indexOf(removeBlock);
                if (removeIndex !== -1) {
                    set.splice(removeIndex, 1);
                }
            }

            // Add new block to set and MRU
            set.push(block);
            mruSet.push(block);
        }

        return {hit, index, removeBlock};
    }

    // Random Idea but out program should have a button that will clear or RESET the cache into its empty state
    resetCache(){
        this.cache = this.initCache();
        this.MRU = this.initMRU();
    }

    //Function that will get the current state of the cache
    getCache(){
        return this.cache;
    }

    //Funtion that will get the current state of the MRU
    getMRU(){
        return this.MRU;
    }

    /* Adlers notes, cache statistics
    Total Accesess, # of hits , # of miss , and hit rate
    */
   getStats() {
        let totalBlocks = 0;
        this.cache.forEach(set => {
            totalBlocks = totalBlocks + set.length;
        })

        return{
            totalBlocks, sets: this.cache.length, num: this.num, util: ((totalBlocks/this.numBlocks) * 100).toFixed(2) + '%'
        };
   }
}