// Global simulator instance
let simulator = new Simulator();

let autoStepInterval = null;
let isAutoStepping = false;
let autoStepDelay = 500;

// UI Functions
function onMappingAlgorithmChange() {
    const mappingAlgorithm = document.getElementById('mappingAlgorithm').value;
    const blocksPerSetGroup = document.getElementById('blocksPerSetGroup');
    const replacementPolicyGroup = document.getElementById('replacementPolicyGroup');
    const cacheBlocks = parseInt(document.getElementById('cacheBlocks').value) || 8;
    
    if (mappingAlgorithm === 'direct') {
        // Direct mapping: 1 block per set, hide blocks per set input
        blocksPerSetGroup.style.display = 'none';
        document.getElementById('blocksPerSet').value = 1;
        // Hide replacement policy since direct mapping has no choice in replacement
        replacementPolicyGroup.style.display = 'none';
        document.getElementById('replacementPolicy').value = 'fifo'; // Set to FIFO as default (though it doesn't matter)
    } else if (mappingAlgorithm === 'fully-associative') {
        // Fully associative: all blocks in one set, hide blocks per set input
        blocksPerSetGroup.style.display = 'none';
        document.getElementById('blocksPerSet').value = cacheBlocks;
        replacementPolicyGroup.style.display = 'block';
    } else {
        // Set associative: show blocks per set input
        blocksPerSetGroup.style.display = 'block';
        replacementPolicyGroup.style.display = 'block';
        if (document.getElementById('blocksPerSet').value == 1 || document.getElementById('blocksPerSet').value == cacheBlocks) {
            document.getElementById('blocksPerSet').value = 4; // Reset to reasonable default
        }
    }
}

function initializeCache() {
    const cacheBlocks = parseInt(document.getElementById('cacheBlocks').value);
    const mappingAlgorithm = document.getElementById('mappingAlgorithm').value;
    const replacementPolicy = document.getElementById('replacementPolicy').value;
    const lineSize = parseInt(document.getElementById('lineSize').value);
    let blocksPerSet = parseInt(document.getElementById('blocksPerSet').value);
    
    // Adjust blocks per set based on mapping algorithm
    if (mappingAlgorithm === 'direct') {
        blocksPerSet = 1;
    } else if (mappingAlgorithm === 'fully-associative') {
        blocksPerSet = cacheBlocks;
    }
    
    if (!isPowerOfTwo(cacheBlocks) || cacheBlocks < 4) {
        alert('Cache blocks must be a power of 2 and at least 4');
        return;
    }
    
    if (mappingAlgorithm === 'set-associative' && !isValidBlocksPerSet(blocksPerSet, cacheBlocks)) {
        alert('Blocks per set must be 1 (direct mapped) or a power of 2 that divides evenly into cache blocks');
        return;
    }
    
    if (cacheBlocks % blocksPerSet !== 0) {
        alert('Cache blocks must be divisible by blocks per set');
        return;
    }
    
    if (!isPowerOfTwo(lineSize) || lineSize < 2) {
        alert('Line size must be a power of 2 and at least 2');
        return;
    }
    
    simulator.initCache(cacheBlocks, blocksPerSet, lineSize, mappingAlgorithm, replacementPolicy);
    updateCacheDisplay();
    updateStats();
    
    const mappingType = mappingAlgorithm === 'direct' ? 'Direct Mapped' : 
                       mappingAlgorithm === 'fully-associative' ? 'Fully Associative' : 
                       `${blocksPerSet}-way Set Associative`;
    
    let logMessage = `Cache initialized: ${cacheBlocks} blocks, ${mappingType}`;
    
    // Only mention replacement policy for non-direct mapping
    if (mappingAlgorithm !== 'direct') {
        const policyName = replacementPolicy.toUpperCase();
        logMessage += `, ${policyName} replacement`;
    }
    
    logMessage += `, ${lineSize} words per line`;
    
    addLogMessage(logMessage);
}

function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}

function isValidBlocksPerSet(blocksPerSet, cacheBlocks) {
    // Allow 1 (direct mapping) even though it's not practical for our current implementation
    if (blocksPerSet === 1) return true;
    // For other values, check if it's a power of 2 and divides evenly into cache blocks
    return isPowerOfTwo(blocksPerSet) && cacheBlocks % blocksPerSet === 0;
}

function onTestCaseChange() {
    const testCase = document.getElementById('testCase').value;
    const customInputGroup = document.getElementById('customInputGroup');
    const randomCountGroup = document.getElementById('randomCountGroup');
    
    customInputGroup.style.display = testCase === 'custom' ? 'block' : 'none';
    randomCountGroup.style.display = testCase === 'random' ? 'block' : 'none';
}

function autoStepTick() {
    const hasNext = simulator.nextStep();

    updateCacheDisplay();
    updateStats();
    updateCurrentStep();
    updateSequenceDisplay();
    updateStepControls();

    const currentLog = simulator.log.at(-1);
    if (currentLog) {
        addLogMessage(`Step ${currentLog.step}: ${currentLog.explanation}`);
    }

    if (!hasNext) {
        stopAutoStep(false);
        const cache = simulator.cache.getCache();
        const replacementOrders = simulator.getAllReplacementOrders();

        for (let i = 0; i < cache.length; i++) {
            const set = cache[i].map(block => block ?? '␀').join(', ');
            let logMessage = `Set ${i}: [${set}]`;
            
            // Only show replacement order for non-direct mapping
            if (simulator.mappingAlgorithm !== 'direct') {
                const orderList = replacementOrders[i].join(', ');
                const policyName = simulator.replacementType.toUpperCase();
                logMessage += ` | ${policyName}: [${orderList}]`;
            }
            
            addLogMessage(logMessage);
        }

        const stats = simulator.getStats();
        addLogMessage(`Final Results: ${stats.hits} hits, ${stats.misses} misses, ${stats.hitRate}% hit rate`);
    }
}

function loadTestCase() {
    if (!simulator.cache) {
        alert('Please initialize cache first');
        return;
    }

    const testCase = document.getElementById('testCase').value;
    const cacheBlocks = parseInt(document.getElementById('cacheBlocks').value);
    const mappingAlgorithm = document.getElementById('mappingAlgorithm').value;
    const replacementPolicy = document.getElementById('replacementPolicy').value;
    const lineSize = parseInt(document.getElementById('lineSize').value);
    let blocksPerSet = parseInt(document.getElementById('blocksPerSet').value);
    let customInput = '';
    let randomCount = 64; // default value

    // Adjust blocks per set based on mapping algorithm
    if (mappingAlgorithm === 'direct') {
        blocksPerSet = 1;
    } else if (mappingAlgorithm === 'fully-associative') {
        blocksPerSet = cacheBlocks;
    }

    if (testCase === 'custom') {
        customInput = document.getElementById('customInput').value;
        if (!customInput.trim()) {
            alert('Please enter a custom sequence');
            return;
        }
    } else if (testCase === 'random') {
        randomCount = parseInt(document.getElementById('randomCount').value);
        if (randomCount < 1) {
            alert('Random count must be greater than 0');
            return;
        } else if (randomCount > 2048) {
            alert('For the sake of your computer, please enter a smaller number.');
            return;
        }
    }

    simulator.loadTestCase(testCase, cacheBlocks, blocksPerSet, lineSize, mappingAlgorithm, replacementPolicy, customInput, randomCount);
    simulator.startStepping();

    updateSequenceDisplay();
    updateStepControls();
    updateCurrentStep();
    updateCacheDisplay();
    updateStats();

    document.getElementById('autoStepBtn').disabled = false;
    document.getElementById('autoStepBtn').classList.remove('secondary');

    addLogMessage(`Test case loaded: ${testCase}`);
    if (testCase === 'random') {
        addLogMessage(`Random sequence with ${randomCount} blocks: [${simulator.currentSequence.join(', ')}]`);
    } else {
        addLogMessage(`Sequence: [${simulator.currentSequence.join(', ')}]`);
    }
    addLogMessage('Ready to begin simulation. Use step controls to proceed.');
}

function nextStep() {
    stopAutoStep();
    if (!simulator.currentSequence.length) return alert('Please load a test case first');

    const hasNext = simulator.nextStep();
    if (hasNext) {
        updateCacheDisplay();
        updateStats();
        updateCurrentStep();
        updateSequenceDisplay();
        updateStepControls();

        const currentLog = simulator.log.at(-1);
        if (currentLog) {
            addLogMessage(`Step ${currentLog.step}: ${currentLog.explanation}`);
        }
    }
}

function prevStep() {
    stopAutoStep();
    const hasPrev = simulator.prevStep();
    if (hasPrev) {
        updateCacheDisplay();
        updateStats();
        updateCurrentStep();
        updateSequenceDisplay();
        updateStepControls();

        if (simulator.currentStep >= 0) {
            addLogMessage(`Stepped back to step ${simulator.currentStep + 1}`);
        } else {
            addLogMessage('Returned to initial state');
        }
    }
}

function runAll() {
    stopAutoStep();
    if (!simulator.currentSequence.length) return alert('Please load a test case first');

    addLogMessage('Running all remaining steps...');

    // 🔐 Track step before running
    simulator.currentStepBeforeRun = simulator.currentStep;

    simulator.runAll();

    // ✅ Only show newly added logs
    for (let i = simulator.currentStepBeforeRun + 1; i <= simulator.currentStep; i++) {
        const entry = simulator.log[i];
        if (entry) {
            addLogMessage(`Step ${entry.step}: ${entry.explanation}`);
        }
    }

    updateCacheDisplay();
    updateStats();
    updateCurrentStep();
    updateSequenceDisplay();
    updateStepControls();

    addLogMessage('Simulation completed!');

    const cache = simulator.cache.getCache();
    const replacementOrders = simulator.getAllReplacementOrders();

    for (let i = 0; i < cache.length; i++) {
        const set = cache[i].map(block => block ?? '␀').join(', ');
        let logMessage = `Set ${i}: [${set}]`;
        
        // Only show replacement order for non-direct mapping
        if (simulator.mappingAlgorithm !== 'direct') {
            const orderList = replacementOrders[i].join(', ');
            const policyName = simulator.replacementType.toUpperCase();
            logMessage += ` | ${policyName}: [${orderList}]`;
        }
        
        addLogMessage(logMessage);
    }

    const stats = simulator.getStats();
    document.getElementById('autoStepBtn').classList.add('secondary');
    addLogMessage(`Final Results: ${stats.hits} hits, ${stats.misses} misses, ${stats.hitRate}% hit rate`);
}

function toggleAutoStep() {
    const autoStepBtn = document.getElementById('autoStepBtn');
    const speedSlider = document.getElementById('autoStepSpeed');
    const speedContainer = document.getElementById('autoStepSpeedContainer');

    if (!isAutoStepping) {
            isAutoStepping = true;
            autoStepBtn.textContent = 'Auto Step: ON';
            speedContainer.style.display = 'block';
            autoStepDelay = parseInt(speedSlider.value);
            addLogMessage('Auto step simulation started...');

            autoStepInterval = setInterval(() => {
            const hasNext = simulator.nextStep();

            updateCacheDisplay();
            updateStats();
            updateCurrentStep();
            updateSequenceDisplay();
            updateStepControls();

            const currentLog = simulator.log.at(-1);
            if (currentLog) {
                addLogMessage(`Step ${currentLog.step}: ${currentLog.explanation}`);
            }

            if (!hasNext) {
                stopAutoStep(false);
                updateStats();

                const cache = simulator.cache.getCache();
                const replacementOrders = simulator.getAllReplacementOrders();

                for (let i = 0; i < cache.length; i++) {
                    const set = cache[i].map(block => block ?? '␀').join(', ');
                    const orderList = replacementOrders[i].join(', ');
                    const policyName = simulator.replacementType.toUpperCase();
                    addLogMessage(`Set ${i}: [${set}] | ${policyName}: [${orderList}]`);
                }

                const stats = simulator.getStats();
                addLogMessage(`Final Results: ${stats.hits} hits, ${stats.misses} misses, ${stats.hitRate}% hit rate`);
            }
        }, autoStepDelay);

    } else {
        stopAutoStep();
    }
}

function stopAutoStep(manual = true) {
    if (autoStepInterval !== null) {
        clearInterval(autoStepInterval);
        autoStepInterval = null;
        isAutoStepping = false;

        document.getElementById('autoStepBtn').textContent = 'Auto Step: OFF';
        document.getElementById('autoStepSpeedContainer').style.display = 'none';

        if (manual) addLogMessage('Auto step stopped due to manual action.');
    }
}

function resetSimulation() {
    stopAutoStep();
    isAutoStepping = false;
    document.getElementById('autoStepBtn').textContent = 'Auto Step: OFF';
    document.getElementById('autoStepSpeedContainer').style.display = 'none';
    
    simulator.reset();
    updateCacheDisplay();
    updateStats();
    updateCurrentStep();
    updateSequenceDisplay();
    updateStepControls();

    document.getElementById('logContent').innerHTML = 'Simulation reset. Load a test case to begin.';
    document.getElementById('autoStepBtn').disabled = false;
    document.getElementById('autoStepBtn').classList.remove('secondary');
}

function resetCache() {
    simulator.reset();
    
    // Reset cache config inputs to default values
    document.getElementById('cacheBlocks').value = 8;
    document.getElementById('mappingAlgorithm').value = 'set-associative';
    document.getElementById('blocksPerSet').value = 4;
    document.getElementById('replacementPolicy').value = 'mru';
    document.getElementById('lineSize').value = 4;

    // Update UI based on mapping algorithm
    onMappingAlgorithmChange();
    
    // Initialize the cache after resetting values
    initializeCache();

    simulator.currentSequence = [];
    simulator.currentStep = -1;

    // Clear the cache display
    document.getElementById('cacheTable').innerHTML = '';

    // Reset test case selection and inputs
    const testCaseSelect = document.getElementById('testCase');
    testCaseSelect.selectedIndex = 0;
    document.getElementById('customInput').value = '';
    document.getElementById('randomCount').value = 64; // Reset to default
    document.getElementById('customInputGroup').style.display = 'none';
    document.getElementById('randomCountGroup').style.display = 'none';

    // Reset UI states
    document.getElementById('logContent').innerHTML = 'Cache reset. Load a test case to begin.';
    updateSequenceDisplay();
    updateStats();
    updateCurrentStep();
    updateStepControls();
}

function resetTestCase() {
    // Clear sequence and step
    simulator.currentSequence = [];
    simulator.currentStep = -1;

    // Clear UI
    document.getElementById('sequenceDisplay').innerHTML = '<strong>Sequence:</strong> Load a test case to see the sequence';
    document.getElementById('logContent').innerHTML = 'Test case reset. Load a new test case to begin.';
    document.getElementById('customInput').value = '';
    document.getElementById('randomCount').value = 64; // Reset to default
    document.getElementById('customInputGroup').style.display = 'none';
    document.getElementById('randomCountGroup').style.display = 'none';

    // Update visuals and stats
    updateStats();
    updateCurrentStep();
    updateStepControls();
    resetSimulation();  

    const testCaseSelect = document.getElementById('testCase');
    testCaseSelect.selectedIndex = 0;
}

function updateCacheDisplay() {
    const cacheTable = document.getElementById('cacheTable');
    
    if (!simulator.cache) {
        cacheTable.innerHTML = '<p>Initialize cache to see memory snapshot</p>';
        return;
    }
    
    const cache = simulator.cache.getCache();
    const replacementOrders = simulator.replacementPolicy ? simulator.getAllReplacementOrders() : [];
    const ways = simulator.cache.ways;
    const replacementType = simulator.replacementType.toUpperCase();
    const mappingAlgorithm = simulator.mappingAlgorithm;
    
    let html = '<table class="cache-table">';
    html += '<thead><tr><th>Set</th>';
    
    // Dynamic number of way columns based on actual ways
    for (let way = 0; way < ways; way++) {
        html += `<th>Block ${way}</th>`;
    }
    
    // Only show replacement order column for set associative and fully associative
    if (mappingAlgorithm !== 'direct') {
        html += `<th>${replacementType} Order</th>`;
    }
    
    html += '</tr></thead>';
    html += '<tbody>';
    
    for (let setIndex = 0; setIndex < cache.length; setIndex++) {
        html += `<tr><td><strong>Set ${setIndex}</strong></td>`;
        
        const setBlocks = cache[setIndex] || [];
        
        // Display blocks in their actual way positions
        for (let way = 0; way < ways; way++) {
            html += '<td>';
            if (way < setBlocks.length && setBlocks[way] !== null && setBlocks[way] !== undefined) {
                html += `<div class="cache-block">${setBlocks[way]}</div>`;
            }
            html += '</td>';
        }
        
        // Display replacement order separately (only for non-direct mapping)
        if (mappingAlgorithm !== 'direct') {
            html += '<td>';
            if (replacementOrders[setIndex] && replacementOrders[setIndex].length > 0) {
                let orderLabel = '';
                if (replacementType === 'LRU') {
                    orderLabel = 'LRU ← [' + replacementOrders[setIndex].join(', ') + '] → MRU';
                } else if (replacementType === 'FIFO') {
                    orderLabel = 'Oldest ← [' + replacementOrders[setIndex].join(', ') + '] → Newest';
                } else { // MRU
                    orderLabel = 'LRU ← [' + replacementOrders[setIndex].join(', ') + '] → MRU';
                }
                html += `<div class="replacement-order">${orderLabel}</div>`;
            }
            html += '</td>';
        }
        
        html += '</tr>';
    }
    
    html += '</tbody></table>';
    cacheTable.innerHTML = html;
}

function updateStats() {
    const stats = simulator.getStats();
    document.getElementById('totalAccesses').textContent = stats.totalAccesses;
    document.getElementById('cacheHits').textContent = stats.hits;
    document.getElementById('cacheMisses').textContent = stats.misses;
    document.getElementById('hitRate').textContent = stats.hitRate + '%';
    document.getElementById('missRate').textContent = stats.missRate + '%';
    document.getElementById('avgAccessTime').textContent = stats.averageMemoryAccessTime + 'ns';
    document.getElementById('totalAccessTime').textContent = stats.totalMemoryAccessTime + 'ns';
}

function updateCurrentStep() {
    const currentStepDiv = document.getElementById('currentStep');
    const stats = simulator.getStats();

    if (!simulator.currentSequence.length) {
        currentStepDiv.textContent = 'No simulation loaded';
    } else if (simulator.currentStep >= 0) {
        const currentBlock = simulator.currentSequence[simulator.currentStep];
        const currentLog = simulator.log.at(-1);
        const result = currentLog?.result ?? '';
        currentStepDiv.innerHTML = `Step ${simulator.currentStep + 1}: Accessing block ${currentBlock} → <strong>${result}</strong> | Progress: ${stats.progress}`;
    } else {
        currentStepDiv.innerHTML = `Ready to start | Progress: ${stats.progress}`;
    }
}

function updateSequenceDisplay() {
    const sequenceDisplay = document.getElementById('sequenceDisplay');
    if (!simulator.currentSequence.length) {
        sequenceDisplay.innerHTML = '<strong>Sequence:</strong> Load a test case to see the sequence';
        return;
    }

    const displaySequence = simulator.currentSequence;

    let html = '<strong>Sequence:</strong> ';
    displaySequence.forEach((block, i) => {
        let className = 'sequence-item';
        if (i === simulator.currentStep) className += ' current';
        else if (i < simulator.currentStep) className += ' completed';
        html += `<span class="${className}">${block}</span>`;
    });

    sequenceDisplay.innerHTML = html;
}


function updateStepControls() {
    const hasSequence = simulator.currentSequence.length > 0;
    const canGoPrev = simulator.currentStep > -1;
    const canGoNext = simulator.currentStep < simulator.currentSequence.length - 1;

    document.getElementById('prevBtn').disabled = !canGoPrev;
    document.getElementById('nextBtn').disabled = !canGoNext || !hasSequence;
    document.getElementById('runAllBtn').disabled = !canGoNext || !hasSequence;
    document.getElementById('autoStepBtn').disabled = !canGoNext || !hasSequence;
}

function addLogMessage(message) {
    const logContent = document.getElementById('logContent');
    const timestamp = new Date().toLocaleTimeString();
    logContent.innerHTML += `<div>[${timestamp}] ${message}</div>`;
    logContent.scrollTop = logContent.scrollHeight;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('mappingAlgorithm').addEventListener('change', onMappingAlgorithmChange);
    document.getElementById('initCacheBtn').addEventListener('click', initializeCache);
    document.getElementById('testCase').addEventListener('change', onTestCaseChange);
    document.getElementById('loadTestBtn').addEventListener('click', loadTestCase);
    document.getElementById('prevBtn').addEventListener('click', prevStep);
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    document.getElementById('autoStepBtn').addEventListener('click', toggleAutoStep);
    document.getElementById('runAllBtn').addEventListener('click', runAll);
    document.getElementById('resetBtn').addEventListener('click', resetSimulation);
    document.getElementById('reset-cache-btn').addEventListener('click', resetCache);
    document.getElementById('reset-testcase-btn').addEventListener('click', resetTestCase);

    document.getElementById('autoStepSpeed').addEventListener('input', () => {
        const speed = parseInt(document.getElementById('autoStepSpeed').value);
        document.getElementById('autoStepSpeedValue').textContent = `${speed}ms`;
        autoStepDelay = speed;

        if (isAutoStepping) {
            clearInterval(autoStepInterval);
            autoStepInterval = setInterval(autoStepTick, autoStepDelay);
        }
    });

    // Initialize UI state
    onMappingAlgorithmChange();
    addLogMessage('Cache Simulation System initialized');
    addLogMessage('Configure cache parameters and load a test case to begin');
    updateStepControls();
});