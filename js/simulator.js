/**
 * Simulator class implementation
 * Main simulation logic and coordination between Cache and MRU classes
 */
class Simulator {
    constructor() {
        this.memoryBlocks = 1024;
        this.cache = null;
        this.replacementPolicy = null;
        this.replacementType = 'mru'; // 'mru', 'lru', 'fifo'
        this.mappingAlgorithm = 'set-associative'; // 'direct', 'set-associative', 'fully-associative'
        this.log = [];
        this.currentSequence = [];
        this.currentStep = -1;
        this.stepHistory = [];
        this.isSteppingMode = false;
        this.cacheAccessTime = 1;
        this.memoryAccessTime = 10;
    }

    initCache(numBlocks, ways, lineSize = 1, mappingAlgorithm = 'set-associative', replacementType = 'mru', memoryBlocks = 1024) {
        this.mappingAlgorithm = mappingAlgorithm;
        this.replacementType = replacementType;
        this.memoryBlocks = memoryBlocks;
        
        // Adjust ways based on mapping algorithm
        if (mappingAlgorithm === 'direct') {
            ways = 1;
        } else if (mappingAlgorithm === 'fully-associative') {
            ways = numBlocks;
        }
        
        this.cache = new Cache(numBlocks, ways, lineSize);
        
        // Initialize replacement policy based on type
        const numSets = numBlocks / ways;
        switch (replacementType) {
            case 'lru':
                this.replacementPolicy = new LRU(numSets);
                break;
            case 'fifo':
                this.replacementPolicy = new FIFO(numSets);
                break;
            case 'mru':
                this.replacementPolicy = new MRU(numSets);
                break;
        }
        
        this.stepHistory = [];
        this.currentStep = -1;
        this.log = [];
    }

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

    accessCacheStep(block, stepNum) {
        const findResult = this.cache.findBlock(block);
        const setIndex = findResult.setIndex;
        
        let hit = findResult.found;
        let removedBlock = null;

        if (hit) {
            // Update replacement policy for hit
            this.updateReplacementPolicy(block, setIndex);
        } else {
            if (!this.cache.isSetFull(setIndex)) {
                this.cache.addBlock(block, setIndex);
            } else {
                removedBlock = this.getBlockToEvict(setIndex);
                this.cache.removeBlock(removedBlock, setIndex);
                this.removeFromReplacementPolicy(removedBlock, setIndex);
                this.cache.addBlock(block, setIndex);
            }
            this.updateReplacementPolicy(block, setIndex);
        }

        let result = hit ? 'HIT' : 'MISS';
        const step = this.createCacheStep(stepNum, block, setIndex, result, removedBlock);
        this.stepHistory.push(step);

        this.log.push({
            step: stepNum,
            block: block,
            setIndex: setIndex,
            result: result,
            removed: removedBlock,
            explanation: this.generateExplanation(block, setIndex, hit, removedBlock)
        });

        return hit;
    }

    createCacheStep(stepNum, block, setIndex, hitStatus, removedBlock) {
        return {
            stepNum: stepNum,
            block: block,
            setIndex: setIndex,
            hitStatus: hitStatus,
            removedBlock: removedBlock,
            cacheState: this.copyArray(this.cache.getCache()),
            replacementState: this.copyArray(this.getAllReplacementOrders())
        };
    }

    updateReplacementPolicy(block, setIndex) {
        switch (this.replacementType) {
            case 'lru':
                this.replacementPolicy.updateLRU(block, setIndex);
                break;
            case 'fifo':
                this.replacementPolicy.updateFIFO(block, setIndex);
                break;
            case 'mru':
                this.replacementPolicy.updateMRU(block, setIndex);
                break;
        }
    }

    getBlockToEvict(setIndex) {
        return this.replacementPolicy.getBlockToEvict(setIndex);
    }

    removeFromReplacementPolicy(block, setIndex) {
        switch (this.replacementType) {
            case 'lru':
                this.replacementPolicy.removeFromLRU(block, setIndex);
                break;
            case 'fifo':
                this.replacementPolicy.removeFromFIFO(block, setIndex);
                break;
            case 'mru':
                this.replacementPolicy.removeFromMRU(block, setIndex);
                break;
        }
    }

    generateExplanation(block, setIndex, isHit, removedBlock) {
        if (this.mappingAlgorithm === 'direct') {
            return this.generateDirectMappingExplanation(block, setIndex, isHit, removedBlock);
        } else {
            // For set associative and fully associative, use the replacement policy explanation
            return this.replacementPolicy.generateExplanation(block, setIndex, isHit, removedBlock);
        }
    }

    generateDirectMappingExplanation(block, setIndex, isHit, removedBlock) {
        let explanation = `Access block ${block} → Set ${setIndex} (${block} mod ${this.cache.cache.length}). `;

        if (isHit) {
            explanation += `HIT! Block ${block} found in cache.`;
        } else {
            if (removedBlock !== null) {
                explanation += `MISS! Replaced block ${removedBlock} with block ${block}.`;
            } else {
                explanation += `MISS! Loaded block ${block} into empty cache slot.`;
            }
        }
        return explanation;
    }

    getAllReplacementOrders() {
        switch (this.replacementType) {
            case 'lru':
                return this.replacementPolicy.getAllLRUOrders();
            case 'fifo':
                return this.replacementPolicy.getAllFIFOOrders();
            case 'mru':
                return this.replacementPolicy.getAllMRUOrders();
        }
    }

    loadSequentialTest(numBlocks) {
        this.currentSequence = [];
        const maxBlock = Math.min(2 * numBlocks, this.memoryBlocks);
        for (let i = 0; i < maxBlock; i++) this.currentSequence.push(i);
        for (let i = 0; i < maxBlock; i++) this.currentSequence.push(i);
        return this.currentSequence;
    }

    loadMidRepeatTest(numBlocks) {
        this.currentSequence = [];
        const maxBlock = Math.min(2 * numBlocks, this.memoryBlocks);
        for (let i = 0; i < Math.min(numBlocks, this.memoryBlocks); i++) this.currentSequence.push(i);
        for (let i = 1; i < Math.min(numBlocks, this.memoryBlocks); i++) this.currentSequence.push(i);
        for (let i = numBlocks; i < maxBlock; i++) this.currentSequence.push(i);
        const originalLength = this.currentSequence.length;
        for (let i = 0; i < originalLength; i++) {
            this.currentSequence.push(this.currentSequence[i]);
        }
        return this.currentSequence;
    }

    loadRandomTest(randomCount = 64) {
        this.currentSequence = [];
        for (let i = 0; i < randomCount; i++) {
            this.currentSequence.push(Math.floor(Math.random() * this.memoryBlocks));
        }
        return this.currentSequence;
    }

    loadCustomTest(inputSequence) {
        this.currentSequence = [];
        
        if (typeof inputSequence === 'string') {
            const blocks = inputSequence.split(/[,\s]+/).filter(block => block.trim() !== '');
            
            for (let block of blocks) {
                const blockNum = parseInt(block.trim());
                if (!isNaN(blockNum) && blockNum >= 0 && blockNum < this.memoryBlocks) {
                    this.currentSequence.push(blockNum);
                }
            }
        } else if (Array.isArray(inputSequence)) {
            for (let block of inputSequence) {
                const blockNum = parseInt(block);
                if (!isNaN(blockNum) && blockNum >= 0 && blockNum < this.memoryBlocks) {
                    this.currentSequence.push(blockNum);
                }
            }
        }
        
        return this.currentSequence;
    }

    loadTestCase(testName, numBlocks, ways, lineSize = 1, mappingAlgorithm = 'set-associative', replacementType = 'mru', customInput = null, randomCount = 64, memoryBlocks = 1024) {
        numBlocks = numBlocks || 8;
        ways = ways || 4;
        this.initCache(numBlocks, ways, lineSize, mappingAlgorithm, replacementType, memoryBlocks);
        
        if (testName === 'Sequential Test' || testName === 'sequential') {
            this.loadSequentialTest(numBlocks);
        } else if (testName === 'Mid-Repeat Test' || testName === 'mid-repeat') {
            this.loadMidRepeatTest(numBlocks);
        } else if (testName === 'Random Test' || testName === 'random') {
            this.loadRandomTest(randomCount);
        } else if (testName === 'Custom Test' || testName === 'custom') {
            this.loadCustomTest(customInput || '');
        }
        
        return this.currentSequence;
    }

    startStepping() {
        this.isSteppingMode = true;
        this.currentStep = -1;
    }

    nextStep() {
        if (this.currentStep >= this.currentSequence.length - 1) {
            return false;
        }

        this.currentStep++;
        const block = this.currentSequence[this.currentStep];
        const hit = this.accessCacheStep(block, this.currentStep + 1);
        
        return true;
    }

    prevStep() {
        if (this.currentStep <= 0) return false;
        
        this.currentStep--;
        
        if (this.currentStep >= 0) {
            const stepData = this.stepHistory[this.currentStep];
            this.cache.cache = this.copyArray(stepData.cacheState);
            
            // Restore replacement policy state
            switch (this.replacementType) {
                case 'lru':
                    this.replacementPolicy.lruOrder = this.copyArray(stepData.replacementState);
                    break;
                case 'fifo':
                    this.replacementPolicy.fifoOrder = this.copyArray(stepData.replacementState);
                    break;
                case 'mru':
                    this.replacementPolicy.mruOrder = this.copyArray(stepData.replacementState);
                    break;
            }
            
            this.stepHistory = this.stepHistory.slice(0, this.currentStep + 1);
            this.log = this.log.slice(0, this.currentStep + 1);
        } else {
            this.cache.reset();
            this.replacementPolicy.reset();
            this.stepHistory = [];
            this.log = [];
        }
        
        return true;
    }

    runAll() {
        while (this.currentStep < this.currentSequence.length - 1) {
            this.nextStep();
        }
    }

    reset() {
        if (this.cache) this.cache.reset();
        if (this.replacementPolicy) this.replacementPolicy.reset();
        this.currentStep = -1;
        this.stepHistory = [];
        this.log = [];
        this.isSteppingMode = false;
    }

    getStats() {
        const totalAccesses = Math.max(this.currentStep + 1, 0);
        const hits = this.log.filter(entry => entry.result === 'HIT').length;
        const misses = this.log.filter(entry => entry.result === 'MISS').length;

        let progress = '0 / 0';
        if (this.currentSequence.length > 0) {
            progress = `${totalAccesses} / ${this.currentSequence.length}`;
        }

        let lineSize = 1;
        if (this.cache && this.cache.lineSize != null) {
            lineSize = this.cache.lineSize;
        }

        const totalMemoryAccessTime =
            hits * lineSize * this.cacheAccessTime +
            misses * (this.cacheAccessTime + lineSize * this.cacheAccessTime + lineSize * this.memoryAccessTime);

        let averageMemoryAccessTime = 0;
        if (totalAccesses > 0) {
            averageMemoryAccessTime =
                (hits / totalAccesses) * this.cacheAccessTime +
                (misses / totalAccesses) * (this.cacheAccessTime + lineSize * this.memoryAccessTime + this.cacheAccessTime);
        }

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

    getState() {
        let cache = [];
        let replacementOrder = [];

        if (this.cache) {
            cache = this.cache.getCache();
        }

        if (this.replacementPolicy) {
            replacementOrder = this.getAllReplacementOrders();
        }

        return {
            cache: cache,
            replacementOrder: replacementOrder,
            currentStep: this.currentStep,
            sequence: this.currentSequence,
            log: this.log,
            stats: this.getStats(),
            mappingAlgorithm: this.mappingAlgorithm,
            replacementType: this.replacementType
        };
    }

    isComplete() {
        return this.currentStep >= this.currentSequence.length - 1;
        }
    }