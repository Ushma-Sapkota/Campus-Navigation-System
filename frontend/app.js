/**
 * Main Application Logic
 * Orchestrates all components
 */

class CampusNavigatorApp {
    constructor() {
        this.currentAlgorithm = null;
        this.steps = [];
        this.currentStep = 0;
        this.isPlaying = false;
        this.playInterval = null;
        this.speed = 1000;
        this.graphData = null;
        
        // Pseudocode templates
        this.pseudocodes = {
            dijkstra: `function dijkstra(graph, start, end):
    dist[start] = 0
    for each vertex v:
        if v ≠ start:
            dist[v] = ∞
    
    Q = priority queue with all vertices
    
    while Q is not empty:
        u = vertex with min dist in Q
        remove u from Q
        
        for each neighbor v of u:
            alt = dist[u] + weight(u, v)
            if alt < dist[v]:
                dist[v] = alt
                previous[v] = u
    
    return dist, previous`,
            
            search: `function binarySearch(array, target):
    left = 0
    right = length(array) - 1
    
    while left ≤ right:
        mid = left + (right - left) / 2
        
        if array[mid] == target:
            return mid
        
        if array[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1  // not found`,
            
            sort: `function quicksort(array, low, high):
    if low < high:
        // Partition the array
        pivot = array[high]
        i = low - 1
        
        for j = low to high - 1:
            if array[j] < pivot:
                i = i + 1
                swap array[i] with array[j]
        
        swap array[i + 1] with array[high]
        pivotIndex = i + 1
        
        // Recursively sort subarrays
        quicksort(array, low, pivotIndex - 1)
        quicksort(array, pivotIndex + 1, high)`
        };
    }

    // Fallback campus data when backend is not available 
    getFallbackGraphData() {
        return {
            nodes: [
                { id: 0, name: "Library",        x: 150, y: 120 },
                { id: 1, name: "Science Hall",   x: 400, y: 100 },
                { id: 2, name: "Gym",            x: 550, y: 250 },
                { id: 3, name: "Student Center", x: 350, y: 350 },
                { id: 4, name: "Dorms",          x: 120, y: 320 },
                { id: 5, name: "Engineering",    x: 500, y: 500 },
                { id: 6, name: "Arts Building",  x: 200, y: 530 },
                { id: 7, name: "Cafeteria",      x: 350, y: 580 }
            ],
            edges: [
                { from: 0, to: 1, weight: 250 },
                { from: 0, to: 3, weight: 300 },
                { from: 0, to: 4, weight: 200 },
                { from: 1, to: 2, weight: 200 },
                { from: 1, to: 3, weight: 280 },
                { from: 2, to: 3, weight: 220 },
                { from: 2, to: 5, weight: 260 },
                { from: 3, to: 4, weight: 240 },
                { from: 3, to: 5, weight: 200 },
                { from: 3, to: 6, weight: 220 },
                { from: 4, to: 6, weight: 250 },
                { from: 5, to: 7, weight: 180 },
                { from: 6, to: 7, weight: 160 }
            ]
        };
    }

    // Initialize the application

    async init() {
        // Always set up event listeners and populate selectors first
        this.setupEventListeners();

        try {
            // Show loading
            this.showStatus('Loading campus data...');

            // Try to load from backend
            const isRunning = await api.ping();
            if (isRunning) {
                this.graphData = await api.getGraph();
            } else {
                // Use fallback data so the UI still works
                this.graphData = this.getFallbackGraphData();
                this.showStatus('Running in offline mode (no backend). Select an algorithm to begin.');
            }
        } catch (error) {
            // Use fallback data on any error
            this.graphData = this.getFallbackGraphData();
            this.showStatus('Running in offline mode. Select an algorithm to begin.');
        }

        // Populate dropdowns and draw canvas with whatever data we have
        visualizer.setGraphData(this.graphData);
        this.populateNodeSelectors();
        this.showStatus('Ready! Select an algorithm to begin.');
    }

    // Setup event listeners
    setupEventListeners() {
        // Algorithm selection
        document.getElementById('algo-select').addEventListener('change', (e) => {
            this.onAlgorithmChange(e.target.value);
        });
        
        // Speed slider
        document.getElementById('speed-slider').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
            document.getElementById('speed-display').textContent = this.speed + 'ms';
            const footerSpeed = document.getElementById('footer-speed');
            if (footerSpeed) footerSpeed.textContent = this.speed;
        });
        
        // Enter key triggers
        document.getElementById('search-query').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadSearch();
        });

        // Tab switching (Explanation / Code tabs in right sidebar)
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
            });
        });
    }

    // Populate node selectors
    
    populateNodeSelectors() {
        const selectors = ['start-node', 'end-node', 'sort-reference'];
        
        selectors.forEach(selectorId => {
            const select = document.getElementById(selectorId);
            select.innerHTML = '';
            
            this.graphData.nodes.forEach(node => {
                const option = document.createElement('option');
                option.value = node.id;
                option.textContent = node.name;
                select.appendChild(option);
            });
        });
        
        // Set defaults
        document.getElementById('start-node').value = 0;
        document.getElementById('end-node').value = 9;
        document.getElementById('sort-reference').value = 0;
    }

    // Handle algorithm selection change
    onAlgorithmChange(algorithm) {
        // Hide all option panels by removing 'active' class
        document.querySelectorAll('.algo-options').forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Show selected algorithm options by adding 'active' class
        if (algorithm) {
            const panel = document.getElementById(`${algorithm}-options`);
            if (panel) panel.classList.add('active');
        }

        // Update header badge
        const algoBadge = document.getElementById('algo-badge');
        const algoNames = {
            dijkstra: "Dijkstra's Algorithm",
            search: "Binary Search",
            sort: "Quick Sort"
        };
        if (algoBadge) {
            if (algorithm && algoNames[algorithm]) {
                algoBadge.textContent = algoNames[algorithm];
                algoBadge.style.display = '';
            } else {
                algoBadge.style.display = 'none';
            }
        }
        
        // Reset visualization
        this.reset();
    }

    // Load Dijkstra algorithm
    async loadDijkstra() {
        try {
            const start = parseInt(document.getElementById('start-node').value);
            const end = parseInt(document.getElementById('end-node').value);
            
            if (start === end) {
                alert('Start and end nodes must be different!');
                return;
            }
            
            this.showStatus('Finding shortest path...');
            
            const data = await api.getDijkstra(start, end);
            
            this.currentAlgorithm = 'dijkstra';
            this.steps = data.steps;
            this.currentStep = 0;
            
            // Update UI
            this.updatePseudocode('dijkstra');
            this.updateComplexity(data.complexity);
            this.updateStepCounter();
            
            // Show first step
            this.displayCurrentStep();
            
            this.showStatus(`Found path! Distance: ${data.distance}m`);
            
        } catch (error) {
            this.showError('Error loading Dijkstra: ' + error.message);
        }
    }

    //Load Binary Search
    async loadSearch() {
        try {
            const query = document.getElementById('search-query').value.trim();
            
            if (!query) {
                alert('Please enter a building name to search!');
                return;
            }
            
            this.showStatus('Searching...');
            
            const data = await api.searchBuilding(query);
            
            this.currentAlgorithm = 'search';
            this.steps = data.steps;
            this.currentStep = 0;
            this.sortedNodes = data.sortedArray;
            
            // Update UI
            this.updatePseudocode('search');
            this.updateComplexity(data.complexity);
            this.updateStepCounter();
            
            // Show first step
            this.displayCurrentStep();
            
            if (data.found) {
                this.showStatus(`Found: ${data.result.name}!`);
            } else {
                this.showStatus(`"${query}" not found in campus.`);
            }
            
        } catch (error) {
            this.showError('Error searching: ' + error.message);
        }
    }

    // Load QuickSort
     
    async loadSort() {
        try {
            const reference = parseInt(document.getElementById('sort-reference').value);
            
            this.showStatus('Sorting locations...');
            
            const data = await api.sortByDistance(reference);
            
            this.currentAlgorithm = 'sort';
            this.steps = data.steps;
            this.currentStep = 0;
            
            // Update UI
            this.updatePseudocode('sort');
            this.updateComplexity(data.complexity);
            this.updateStepCounter();
            
            // Show first step
            this.displayCurrentStep();
            
            this.showStatus('Sorting complete!');
            
        } catch (error) {
            this.showError('Error sorting: ' + error.message);
        }
    }

    // Display current step
     
    displayCurrentStep() {
        if (this.steps.length === 0) return;
        
        const step = this.steps[this.currentStep];
        
        // Update step counter
        this.updateStepCounter();
        
        // Update explanation
        document.getElementById('explanation-text').textContent = step.explanation || step.action;
        
        // Update visualization based on algorithm
        switch (this.currentAlgorithm) {
            case 'dijkstra':
                visualizer.drawDijkstraStep(step);
                this.updateDijkstraStats(step);
                break;
            
            case 'search':
                visualizer.drawSearchStep(step, this.sortedNodes);
                this.updateSearchStats(step);
                break;
            
            case 'sort':
                visualizer.drawSortStep(step);
                this.updateSortStats(step);
                break;
        }
        
    }

    // Update statistics for Dijkstra
    updateDijkstraStats(step) {
        const visited = step.visited ? step.visited.filter(v => v).length : 0;
        document.getElementById('stat-nodes').textContent = visited;
        document.getElementById('stat-comparisons').textContent = step.step;
        
        const currentDist = step.distances && step.node >= 0 
            ? step.distances[step.node] 
            : 'N/A';
        document.getElementById('stat-distance').textContent = 
            currentDist !== -1 ? currentDist + 'm' : 'N/A';
    }

    // Update statistics for Binary Search
    updateSearchStats(step) {
        document.getElementById('stat-nodes').textContent = '-';
        document.getElementById('stat-comparisons').textContent = step.step;
        document.getElementById('stat-distance').textContent = '-';
    }

    //Update statistics for QuickSort
    updateSortStats(step) {
        document.getElementById('stat-nodes').textContent = '-';
        document.getElementById('stat-comparisons').textContent = step.step;
        document.getElementById('stat-distance').textContent = '-';
    }

    //Update step counter
    updateStepCounter() {
        document.getElementById('current-step').textContent = this.currentStep + 1;
        document.getElementById('total-steps').textContent = this.steps.length;
    }

    //Update pseudocode display
    updatePseudocode(algorithm) {
        const code = this.pseudocodes[algorithm] || '';
        document.getElementById('pseudocode').textContent = code;
    }

    //Update complexity information
    updateComplexity(complexity) {
        if (!complexity) return;
        
        const timeComplexity = complexity.time || complexity.time_avg || '-';
        const spaceComplexity = complexity.space || '-';
        
        document.getElementById('complexity-time').textContent = timeComplexity;
        document.getElementById('complexity-space').textContent = spaceComplexity;
    }

    // Toggle play/pause
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('play-btn');
        
        if (this.isPlaying) {
            // Show pause icon
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
            btn.setAttribute('aria-label', 'Pause');
            btn.setAttribute('title', 'Pause');
            this.play();
        } else {
            // Show play icon
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
            btn.setAttribute('aria-label', 'Play');
            btn.setAttribute('title', 'Play');
            this.pause();
        }
    }

    //Play animation
    play() {
        if (this.currentStep >= this.steps.length - 1) {
            this.currentStep = 0;
        }
        
        this.playInterval = setInterval(() => {
            if (this.currentStep < this.steps.length - 1) {
                this.stepForward();
            } else {
                this.pause();
                this.isPlaying = false;
                const btn = document.getElementById('play-btn');
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
                btn.setAttribute('aria-label', 'Play');
                btn.setAttribute('title', 'Play');
            }
        }, this.speed);
    }

    //Pause animation
    pause() {
        if (this.playInterval) {
            clearInterval(this.playInterval);
            this.playInterval = null;
        }
    }

    // Step forward
    stepForward() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.displayCurrentStep();
        }
    }

    // Step backward
    stepBackward() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.displayCurrentStep();
        }
    }

    // Reset to beginning
    reset() {
        this.pause();
        this.isPlaying = false;
        const btn = document.getElementById('play-btn');
        btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>';
        btn.setAttribute('aria-label', 'Play');
        btn.setAttribute('title', 'Play');
        
        this.currentStep = 0;
        
        if (this.steps.length > 0) {
            this.displayCurrentStep();
        } else {
            visualizer.draw();
            document.getElementById('explanation-text').textContent = 
                'Select an algorithm to begin visualization.';
        }
    }

    // Show status message
    showStatus(message) {
        document.getElementById('explanation-text').textContent = message;
    }

    // Show error message
     
    showError(message) {
        document.getElementById('explanation-text').innerHTML = 
            `<span style="color: #F44336;">❌ ${message}</span>`;
        console.error(message);
    }
}

// Create global app instance
const app = new CampusNavigatorApp();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
