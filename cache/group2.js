/*

    basically put the 2 js files together

*/

class Simulator {
    constructor() {
        this.memoryBlocks = 1024;
        this.cache = null;
        this.mru = null;
        this.log = [];
        this.currentSequence = [];
        this.currentStep = -1;
        this.stepHistory = [];
        this.isSteppingMode = false;

        this.cacheAccessTime = 1;    // 1ns for CAT
        this.memoryAccessTime = 10;  // 10ns for MAT
    }

    /**
     * Initialize cache and MRU for simulation
     */
    initCache(numBlocks, ways, lineSize = 1) {
        this.cache = new Cache(numBlocks, ways, lineSize);
        this.mru = new MRU(numBlocks / ways);
        this.stepHistory = [];
        this.currentStep = -1;
        this.log = [];
    }

    /**
     * Simple array copy function
     */
    copyArray(arr) {
        if (!Array.isArray(arr)) {
            return arr;
        }
        const copy = [];
        for (let i = 0; i < arr.length; i++) {
            if (Array.isArray(arr[i])) {
                copy[i] = this.copyArray(arr[i]);
            } else {
                copy[i] = arr[i];
            }
        }
        return copy;
    }

    /**
     * Core cache access logic using both Cache and MRU
     */
    accessCacheStep(block, ways, stepNum) {
        // Find block in cache
        const findResult = this.cache.findBlock(block);
        const setIndex = findResult.setIndex;
        
        let hit = findResult.found;
        let removedBlock = null;

        if (hit) {
            // Cache HIT - just update MRU order
            this.mru.updateMRU(block, setIndex);
        } else {
            // Cache MISS - need to load block
            if (!this.cache.isSetFull(setIndex)) {
                // Cache has space - just add the block
                this.cache.addBlock(block, setIndex);
            } else {
                // Cache full - need to evict using MRU 
                removedBlock = this.mru.getBlockToEvict(setIndex);
                
                // Remove removed block from cache and MRU tracking
                this.cache.removeBlock(removedBlock, setIndex);
                this.mru.removeFromMRU(removedBlock, setIndex);
                
                // Add new block to cache
                this.cache.addBlock(block, setIndex);
            }
            
            // Update MRU order with new block
            this.mru.updateMRU(block, setIndex);
        }

        // Create step record
        let result = 'MISS';
        if (hit) {
            result = 'HIT';
        }

        const step = this.createCacheStep(stepNum, block, setIndex, result, removedBlock);
        this.stepHistory.push(step);

        // Add to log
        this.log.push({
            step: stepNum,
            block: block,
            setIndex: setIndex,
            result: result,
            removed: removedBlock,
            explanation: this.mru.generateExplanation(block, setIndex, hit, removedBlock)
        });


        return hit;
    }

    /**
     * Create a step record for history tracking 
     */
    createCacheStep(stepNum, block, setIndex, hitStatus, removedBlock) {
        return {
            stepNum: stepNum,
            block: block,
            setIndex: setIndex,
            hitStatus: hitStatus,
            removedBlock: removedBlock,
            cacheState: this.copyArray(this.cache.getCache()),
            mruState: this.copyArray(this.mru.getAllMRUOrders())
        };
    }

    /**
     * Load different test case sequences
     */
    loadSequentialTest(numBlocks) {
        this.currentSequence = [];
        for (let i = 0; i < 2 * numBlocks; i++) this.currentSequence.push(i);
        // Add repeat sequence
        for (let i = 0; i < 2 * numBlocks; i++) this.currentSequence.push(i);
        return this.currentSequence;
    }

    loadMidRepeatTest(numBlocks) {
        this.currentSequence = [];
        for (let i = 0; i < numBlocks; i++) this.currentSequence.push(i);
        for (let i = 1; i < numBlocks; i++) this.currentSequence.push(i);
        for (let i = numBlocks; i < 2 * numBlocks; i++) this.currentSequence.push(i);
        // Add repeat
        const originalLength = this.currentSequence.length;
        for (let i = 0; i < originalLength; i++) {
            this.currentSequence.push(this.currentSequence[i]);
        }
        return this.currentSequence;
    }

    loadRandomTest() {
        this.currentSequence = [];
        for (let i = 0; i < 64; i++) {
            this.currentSequence.push(Math.floor(Math.random() * this.memoryBlocks));
        }
        return this.currentSequence;
    }

    /**
     * Load custom user input sequence
     */
    loadCustomTest(inputSequence) {
        this.currentSequence = [];
        
        // Parse input string to array of numbers
        if (typeof inputSequence === 'string') {
            // Split by comma, space, or any whitespace and filter out empty values
            const blocks = inputSequence.split(/[,\s]+/).filter(block => block.trim() !== '');
            
            for (let block of blocks) {
                const blockNum = parseInt(block.trim());
                if (!isNaN(blockNum) && blockNum >= 0 && blockNum < this.memoryBlocks) {
                    this.currentSequence.push(blockNum);
                }
            }
        } else if (Array.isArray(inputSequence)) {
            // If already an array, validate and copy
            for (let block of inputSequence) {
                const blockNum = parseInt(block);
                if (!isNaN(blockNum) && blockNum >= 0 && blockNum < this.memoryBlocks) {
                    this.currentSequence.push(blockNum);
                }
            }
        }
        
        return this.currentSequence;
    }

    /**
     * Load a test case by name
     */
    loadTestCase(testName, numBlocks, lineSize = 1, customInput = null) {
        numBlocks = numBlocks || 8;
        this.initCache(numBlocks, 4, lineSize);
        
        if (testName === 'Sequential Test' || testName === 'sequential') {
            this.loadSequentialTest(numBlocks);
        } else if (testName === 'Mid-Repeat Test' || testName === 'mid-repeat') {
            this.loadMidRepeatTest(numBlocks);
        } else if (testName === 'Random Test' || testName === 'random') {
            this.loadRandomTest();
        } else if (testName === 'Custom Test' || testName === 'custom') {
            this.loadCustomTest(customInput || '');
        }
        
        return this.currentSequence;
    }

    /**
     * Start stepping mode
     */
    startStepping() {
        this.isSteppingMode = true;
        this.currentStep = -1;
    }

    /**
     * Execute next step in simulation
     */
    nextStep() {
        if (this.currentStep >= this.currentSequence.length - 1) {
            return false; // No more steps
        }

        this.currentStep++;
        const block = this.currentSequence[this.currentStep];
        const hit = this.accessCacheStep(block, 4, this.currentStep + 1);
        
        return true;
    }

    /**
     * Go back to previous step 
     */
    prevStep() {
        if (this.currentStep <= 0) return false;
        
        this.currentStep--;
        
        // Restore previous state
        if (this.currentStep >= 0) {
            const stepData = this.stepHistory[this.currentStep];
            // Restore cache state
            this.cache.cache = this.copyArray(stepData.cacheState);
            // Restore MRU state
            this.mru.mruOrder = this.copyArray(stepData.mruState);
            
            // Trim history and log to current step
            this.stepHistory = this.stepHistory.slice(0, this.currentStep + 1);
            this.log = this.log.slice(0, this.currentStep + 1);
        } else {
            // Reset to initial state
            this.cache.reset();
            this.mru.reset();
            this.stepHistory = [];
            this.log = [];
        }
        
        return true;
    }

    /**
     * Run all remaining steps
     */
    runAll() {
        while (this.currentStep < this.currentSequence.length - 1) {
            this.nextStep();
        }
    }

    /**
     * Reset simulation to initial state
     */
    reset() {
        if (this.cache) this.cache.reset();
        if (this.mru) this.mru.reset();
        this.currentStep = -1;
        this.stepHistory = [];
        this.log = [];
        this.isSteppingMode = false;
    }

    /**
     * Get simulation statistics
     */
    getStats() {
        const totalAccesses = Math.max(this.currentStep + 1, 0);
        const hits = this.log.filter(entry => entry.result === 'HIT').length;
        const misses = this.log.filter(entry => entry.result === 'MISS').length;

        // Handle progress display
        let progress = '0 / 0';
        if (this.currentSequence.length > 0) {
            progress = `${totalAccesses} / ${this.currentSequence.length}`;
        }

        // Determine line size
        let lineSize = 1;
        if (this.cache && this.cache.lineSize != null) {
            lineSize = this.cache.lineSize;
        }

        // Calculate total memory access time
        const totalMemoryAccessTime =
            hits * lineSize * this.cacheAccessTime +
            misses * (this.cacheAccessTime + lineSize * this.cacheAccessTime + lineSize * this.memoryAccessTime);

        // Calculate average memory access time
        let averageMemoryAccessTime = 0;
        if (totalAccesses > 0) {
            averageMemoryAccessTime =
                (hits / totalAccesses) * this.cacheAccessTime +
                (misses / totalAccesses) * (this.cacheAccessTime + lineSize * this.memoryAccessTime + this.cacheAccessTime);
        }

        // Return final stats
        let hitRate = "0.00";
        let missRate = "0.00";

        if (totalAccesses > 0) {
            hitRate = ((hits / totalAccesses) * 100).toFixed(2);
            missRate = ((misses / totalAccesses) * 100).toFixed(2);
        }

        return {
            totalAccesses: totalAccesses,
            hits: hits,
            misses: misses,
            hitRate: hitRate,
            missRate: missRate,
            averageMemoryAccessTime: averageMemoryAccessTime.toFixed(2),
            totalMemoryAccessTime: totalMemoryAccessTime.toFixed(2),
            progress: progress
        };
    }

    /**
     * Get current simulation state
     */
    getState() {
        let cache = [];
        let mruOrder = [];

        if (this.cache) {
            cache = this.cache.getCache();
        }

        if (this.mru) {
            mruOrder = this.mru.getAllMRUOrders();
        }

        return {
            cache: cache,
            mruOrder: mruOrder,
            currentStep: this.currentStep,
            sequence: this.currentSequence,
            log: this.log,
            stats: this.getStats()
        };
    }


    /**
     * Check if simulation is complete
     */
    isComplete() {
        return this.currentStep >= this.currentSequence.length - 1;
    }
}