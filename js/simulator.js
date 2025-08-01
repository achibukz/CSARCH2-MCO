/**
 * Simulator class implementation
 * Main simulation logic and coordination between Cache and MRU classes
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
        this.cacheAccessTime = 1;
        this.memoryAccessTime = 10;
    }

    initCache(numBlocks, ways, lineSize = 1) {
        this.cache = new Cache(numBlocks, ways, lineSize);
        this.mru = new MRU(numBlocks / ways);
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

    accessCacheStep(block, ways, stepNum) {
        const findResult = this.cache.findBlock(block);
        const setIndex = findResult.setIndex;
        
        let hit = findResult.found;
        let removedBlock = null;

        if (hit) {
            this.mru.updateMRU(block, setIndex);
        } else {
            if (!this.cache.isSetFull(setIndex)) {
                this.cache.addBlock(block, setIndex);
            } else {
                removedBlock = this.mru.getBlockToEvict(setIndex);
                this.cache.removeBlock(removedBlock, setIndex);
                this.mru.removeFromMRU(removedBlock, setIndex);
                this.cache.addBlock(block, setIndex);
            }
            this.mru.updateMRU(block, setIndex);
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
            explanation: this.mru.generateExplanation(block, setIndex, hit, removedBlock)
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
            mruState: this.copyArray(this.mru.getAllMRUOrders())
        };
    }

    loadSequentialTest(numBlocks) {
        this.currentSequence = [];
        for (let i = 0; i < 2 * numBlocks; i++) this.currentSequence.push(i);
        for (let i = 0; i < 2 * numBlocks; i++) this.currentSequence.push(i);
        return this.currentSequence;
    }

    loadMidRepeatTest(numBlocks) {
        this.currentSequence = [];
        for (let i = 0; i < numBlocks; i++) this.currentSequence.push(i);
        for (let i = 1; i < numBlocks; i++) this.currentSequence.push(i);
        for (let i = numBlocks; i < 2 * numBlocks; i++) this.currentSequence.push(i);
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
        const hit = this.accessCacheStep(block, 4, this.currentStep + 1);
        
        return true;
    }

    prevStep() {
        if (this.currentStep <= 0) return false;
        
        this.currentStep--;
        
        if (this.currentStep >= 0) {
            const stepData = this.stepHistory[this.currentStep];
            this.cache.cache = this.copyArray(stepData.cacheState);
            this.mru.mruOrder = this.copyArray(stepData.mruState);
            
            this.stepHistory = this.stepHistory.slice(0, this.currentStep + 1);
            this.log = this.log.slice(0, this.currentStep + 1);
        } else {
            this.cache.reset();
            this.mru.reset();
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
        if (this.mru) this.mru.reset();
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

    isComplete() {
        return this.currentStep >= this.currentSequence.length - 1;
        }
    }