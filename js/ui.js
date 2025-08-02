// Global simulator instance
let simulator = new Simulator();

let autoStepInterval = null;
let isAutoStepping = false;
let autoStepDelay = 500;

// UI Functions
function initializeCache() {
    const cacheBlocks = parseInt(document.getElementById('cacheBlocks').value);
    const lineSize = parseInt(document.getElementById('lineSize').value);
    
    if (!isPowerOfTwo(cacheBlocks) || cacheBlocks < 4) {
        alert('Cache blocks must be a power of 2 and at least 4');
        return;
    }
    
    if (!isPowerOfTwo(lineSize) || lineSize < 2) {
        alert('Line size must be a power of 2 and at least 2');
        return;
    }
    
    simulator.initCache(cacheBlocks, 4, lineSize);
    updateCacheDisplay();
    updateStats();
    addLogMessage(`Cache initialized: ${cacheBlocks} blocks, 4-way associative, ${lineSize} words per line`);
}

function isPowerOfTwo(n) {
    return n > 0 && (n & (n - 1)) === 0;
}

function onTestCaseChange() {
    const testCase = document.getElementById('testCase').value;
    const customInputGroup = document.getElementById('customInputGroup');
    customInputGroup.style.display = testCase === 'custom' ? 'block' : 'none';
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
        const mru = simulator.mru.getAllMRUOrders();

        for (let i = 0; i < cache.length; i++) {
            const set = cache[i].map(block => block ?? '␀').join(', ');
            const mruList = mru[i].join(', ');
            addLogMessage(`Set ${i}: [${set}] | MRU: [${mruList}]`);
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
    const lineSize = parseInt(document.getElementById('lineSize').value);
    let customInput = '';

    if (testCase === 'custom') {
        customInput = document.getElementById('customInput').value;
        if (!customInput.trim()) {
            alert('Please enter a custom sequence');
            return;
        }
    }

    simulator.loadTestCase(testCase, cacheBlocks, lineSize, customInput);
    simulator.startStepping();

    updateSequenceDisplay();
    updateStepControls();
    updateCurrentStep();
    updateCacheDisplay();
    updateStats();

    document.getElementById('autoStepBtn').disabled = false;
    document.getElementById('autoStepBtn').classList.remove('secondary');

    addLogMessage(`Test case loaded: ${testCase}`);
    addLogMessage(`Sequence: [${simulator.currentSequence.join(', ')}]`);
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
    simulator.runAll();

    updateCacheDisplay();
    updateStats();
    updateCurrentStep();
    updateSequenceDisplay();
    updateStepControls();

    addLogMessage('Simulation completed!');
    const cache = simulator.cache.getCache();
    const mru = simulator.mru.getAllMRUOrders();

    for (let i = 0; i < cache.length; i++) {
        const set = cache[i].map(block => block ?? '␀').join(', ');
        const mruList = mru[i].join(', ');
        addLogMessage(`Set ${i}: [${set}] | MRU: [${mruList}]`);
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
                const mru = simulator.mru.getAllMRUOrders();

                for (let i = 0; i < cache.length; i++) {
                    const set = cache[i].map(block => block ?? '␀').join(', ');
                    const mruList = mru[i].join(', ');
                    addLogMessage(`Set ${i}: [${set}] | MRU: [${mruList}]`);
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
    initializeCache();

    simulator.currentSequence = [];
    simulator.currentStep = -1;

    // Reset cache config inputs to default values
    document.getElementById('cacheBlocks').value = 8;
    document.getElementById('lineSize').value = 4;

    // Clear the cache display
    document.getElementById('cacheTable').innerHTML = '';

    // Reset test case selection and inputs
    const testCaseSelect = document.getElementById('testCase');
    testCaseSelect.selectedIndex = 0;
    document.getElementById('customInput').value = '';
    document.getElementById('customInputGroup').style.display = 'none';

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
    document.getElementById('customInputGroup').style.display = 'none';

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
    const mruOrders = simulator.mru?.getAllMRUOrders() ?? [];

    let html = '<table class="cache-table">';
    html += '<thead><tr><th>Set</th><th>Way 0</th><th>Way 1</th><th>Way 2</th><th>Way 3</th><th>MRU Order</th></tr></thead><tbody>';

    for (let setIndex = 0; setIndex < cache.length; setIndex++) {
        html += `<tr><td><strong>Set ${setIndex}</strong></td>`;
        for (let way = 0; way < 4; way++) {
            html += '<td>';
            if (cache[setIndex][way] !== undefined) {
                html += `<div class="cache-block">${cache[setIndex][way]}</div>`;
            }
            html += '</td>';
        }
        html += `<td><div class="mru-order">LRU ← [${mruOrders[setIndex]?.join(', ') ?? ''}] → MRU</div></td></tr>`;
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

    addLogMessage('Cache Simulation System initialized');
    addLogMessage('Configure cache parameters and load a test case to begin');
    updateStepControls();
});