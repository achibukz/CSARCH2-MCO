/*

Idea dump: 
Tracks which blocks are used
Decides the block to remove 
Updates the order

*/

class MRU{
    constructor(numSets){
        this.numSets = numSets;
        this.mruOrder = this.initMRU();
    }

    initMRU(){
        return Array.from({ length: this.numSets}, () => []);
    }

    // Update the MRU order when a block is accessed, MRU block goes to the end of the array (push)
    updateMRU(block, setIndex){
        const mruSET = this.mruOrder[setIndex];
        const blockIndex = mruSet.indexOf(block);

        // Remove the block from its current pos
        if (blockIndex !== -1){
            mruSet.splice(blockIndex, 1);
        }

        // Add block to most recent position
        mruSet.push(block);
    }

    // get the block to remove , returns the block that will be removed
    removeBlock(setIndex){
        const mruSet = this.mruOrder[setIndex];
        if (mruSet.length == 0){
            return null;
        }

        return mruSet[mruSet.length - 1];
    }

    // remove a block from the MRU order (if its removed)
    removeFromMRU(block, setIndex){
        const mruSet = this.mruOrder[setIndex];
        const blockIndex = mruSet.indexOf(block);

        if (blockIndex !== -1){
            mruSet.splice(blockIndex, 1);
        }
    }

    // get the current MRU order for a set
    getMRUOrder(setIndex){
        return this.mruOrder[setIndex];
    }

    // return all the MRU orders of ALL sets
    getAllOrder(){
        return this.mruOrder;
    }

    // reset the MRU order back to initial state
    reset(){
        this.mruOrder = this.initMRU();
    }

    /*
        Since part of the specs is showing of logs whether a certain block from MM is a hit or miss, 
        this function will show that
    */
    generateLog(block, setIndex, hit, removeBlock = null){
        const mruSet = this.mruOrder[setIndex];

        let output = "Access Block ${block} in Set #{setIndex}. ";
         
        if (hit){
            output = output + "HIT! Block ${block} is in the Cache.";
        }
        else{
            if (removeBlock !== null){
                output = output + "MISS! Cache is FULL. Removed MRU Block ${removeBlock}, Loaded Block ${block}. ";
            }
            else{
                output = output + "MISS! Loaded Block ${block}. "
            }
        }

        output = output + "MRU Order: [${mruSet.join(', ')}]";
        return output;
    }
}
