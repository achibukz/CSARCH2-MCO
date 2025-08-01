/**
 * UI Functions and Event Handlers
 * Handles all user interface interactions and display updates
 */

// Global simulator instance
let simulator = new Simulator();

// UI Functions
function initializeCache() {
    const cacheBlocks = parseInt(document.getElementById('cacheBlocks').value);
    const lineSize = parseInt(document.getElementById('lineSize').value);
    
    // Validate power of 2
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
    
    if (testCase === 'custom') {
        customInputGroup.style.display = 'block';
    } else {
        customInputGroup.style.display = 'none';
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
    
    addLogMessage(`Test case loaded: ${testCase}`);
    addLogMessage(`Sequence: [${simulator.currentSequence.join(', ')}]`);
    addLogMessage('Ready to begin simulation. Use step controls to proceed.');
}

function nextStep() {
    if (!simulator.currentSequence.length) {
        alert('Please load a test case first');
        return;
    }
    
    const hasNext = simulator.nextStep();
    if (hasNext) {
        updateCacheDisplay();
        updateStats();
        updateCurrentStep();
        updateSequenceDisplay();
        updateStepControls();
        
        // Add current step to log
        const currentLog = simulator.log[simulator.log.length - 1];
        if (currentLog) {
            addLogMessage(`Step ${currentLog.step}: ${currentLog.explanation}`);
        }
    }
}

function prevStep() {
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
    if (!simulator.currentSequence.length) {
        alert('Please load a test case first');
        return;
    }
    
    addLogMessage('Running all remaining steps...');
    simulator.runAll();
    
    updateCacheDisplay();
    updateStats();
    updateCurrentStep();
    updateSequenceDisplay();
    updateStepControls();
    
    addLogMessage('Simulation completed!');
    
    // Show final statistics
    const stats = simulator.getStats();
    addLogMessage(`Final Results: ${stats.hits} hits, ${stats.misses} misses, ${stats.hitRate}% hit rate`);
}

function resetSimulation() {
    simulator.reset();
    updateCacheDisplay();
    updateStats();
    updateCurrentStep();
    updateSequenceDisplay();
    updateStepControls();
    
    // Clear log
    document.getElementById('logContent').innerHTML = 'Simulation reset. Load a test case to begin.';
}

function updateCacheDisplay() {
    const cacheTable = document.getElementById('cacheTable');
    
    if (!simulator.cache) {
        cacheTable.innerHTML = '<p>Initialize cache to see memory snapshot</p>';
        return;
    }
    
    const cache = simulator.cache.getCache();
    const mruOrders = simulator.mru ? simulator.mru.getAllMRUOrders() : [];
    
    let html = '<table class="cache-table">';
    html += '<thead><tr><th>Set</th><th>Way 0</th><th>Way 1</th><th>Way 2</th><th>Way 3</th><th>MRU Order</th></tr></thead>';
    html += '<tbody>';
    
    for (let setIndex = 0; setIndex < cache.length; setIndex++) {
        html += `<tr><td><strong>Set ${setIndex}</strong></td>`;
        
        // Display blocks in each way
        for (let way = 0; way < 4; way++) {
            html += '<td>';
            if (cache[setIndex][way] !== undefined) {
                html += `<div class="cache-block">${cache[setIndex][way]}</div>`;
            }
            html += '</td>';
        }
        
        // Display MRU order
        html += '<td>';
        if (mruOrders[setIndex] && mruOrders[setIndex].length > 0) {
            html += `<div class="mru-order">LRU ← [${mruOrders[setIndex].join(', ')}] → MRU</div>`;
        }
        html += '</td>';
        
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
}

function updateCurrentStep() {
    const currentStepDiv = document.getElementById('currentStep');
    
    if (!simulator.currentSequence.length) {
        currentStepDiv.textContent = 'No simulation loaded';
        return;
    }
    
    const stats = simulator.getStats();
    if (simulator.currentStep >= 0) {
        const currentBlock = simulator.currentSequence[simulator.currentStep];
        const currentLog = simulator.log[simulator.log.length - 1];
        const result = currentLog ? currentLog.result : '';
        
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
    
    let html = '<strong>Sequence:</strong> ';
    
    // Show only first 20 items to avoid cluttering
    const displaySequence = simulator.currentSequence.slice(0, 20);
    const hasMore = simulator.currentSequence.length > 20;
    
    for (let i = 0; i < displaySequence.length; i++) {
        const block = displaySequence[i];
        let className = 'sequence-item';
        
        if (i === simulator.currentStep) {
            className += ' current';
        } else if (i < simulator.currentStep) {
            className += ' completed';
        }
        
        html += `<span class="${className}">${block}</span>`;
    }
    
    if (hasMore) {
        html += '<span class="sequence-item">...</span>';
        html += `<span style="margin-left: 10px; color: #666;">(${simulator.currentSequence.length} total blocks)</span>`;
    }
    
    sequenceDisplay.innerHTML = html;
}

function updateStepControls() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const runAllBtn = document.getElementById('runAllBtn');
    
    const hasSequence = simulator.currentSequence.length > 0;
    const canGoPrev = simulator.currentStep > -1;
    const canGoNext = simulator.currentStep < simulator.currentSequence.length - 1;
    
    prevBtn.disabled = !canGoPrev;
    nextBtn.disabled = !canGoNext || !hasSequence;
    runAllBtn.disabled = !canGoNext || !hasSequence;
}

function addLogMessage(message) {
    const logContent = document.getElementById('logContent');
    const timestamp = new Date().toLocaleTimeString();
    logContent.innerHTML += `<div>[${timestamp}] ${message}</div>`;
    logContent.scrollTop = logContent.scrollHeight;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners
    document.getElementById('initCacheBtn').addEventListener('click', initializeCache);
    document.getElementById('testCase').addEventListener('change', onTestCaseChange);
    document.getElementById('loadTestBtn').addEventListener('click', loadTestCase);
    document.getElementById('prevBtn').addEventListener('click', prevStep);
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    document.getElementById('runAllBtn').addEventListener('click', runAll);
    document.getElementById('resetBtn').addEventListener('click', resetSimulation);
    
    // Initialize UI
    addLogMessage('Cache Simulation System initialized');
    addLogMessage('Configure cache parameters and load a test case to begin');
    updateStepControls();
});