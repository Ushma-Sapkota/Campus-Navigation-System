/**
 * Visualization Engine
 * Handles all canvas drawing and animations
 */

class Visualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.graphData = null;
        this.currentAlgorithm = null;

        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.padding = {
            top: 150,      // Extra space for legend
            right: 70,
            bottom: 30,
            left: 70
        };

        // Colors
        this.colors = {
            unvisited: '#0b0144',
            visited: '#4CAF50',
            current: '#FFC107',
            target: '#F44336',
            path: '#9C27B0',
            edge: '#BDBDBD',
            edgeHighlight: '#FF5722',
            text: '#212121',
            background: '#FFFFFF'
        };
        
        // Node radius
        this.nodeRadius = 30;
        
        // Font settings
        this.font = '14px Arial';
        this.boldFont = 'bold 14px Arial';
    }

    // Calculate optimal scale and offset to fit all nodes in canvas
    calculateViewport() {
        if (!this.graphData || this.graphData.nodes.length === 0) return;
        
        const nodes = this.graphData.nodes;
        
        // Find bounds of the graph
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        nodes.forEach(node => {
            minX = Math.min(minX, node.x);
            maxX = Math.max(maxX, node.x);
            minY = Math.min(minY, node.y);
            maxY = Math.max(maxY, node.y);
        });
        
        // Add some buffer for node radius and labels
        const buffer = this.nodeRadius + 50;
        minX -= buffer;
        maxX += buffer;
        minY -= buffer;
        maxY += buffer;
        
        // Calculate required space for graph
        const graphWidth = maxX - minX;
        const graphHeight = maxY - minY;
        
        // Calculate available space in canvas
        const availableWidth = this.canvas.width - this.padding.left - this.padding.right;
        const availableHeight = this.canvas.height - this.padding.top - this.padding.bottom;
        
        // Calculate scale to fit (use minimum to preserve aspect ratio)
        const scaleX = availableWidth / graphWidth;
        const scaleY = availableHeight / graphHeight;
        this.scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down if needed
        
        // Calculate centering offset
        const scaledWidth = graphWidth * this.scale;
        const scaledHeight = graphHeight * this.scale;
        
        this.offsetX = this.padding.left + (availableWidth - scaledWidth) / 2 - (minX * this.scale);
        this.offsetY = this.padding.top + (availableHeight - scaledHeight) / 2 - (minY * this.scale);
        
        console.log('Viewport calculated:', {
            scale: this.scale,
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            bounds: { minX, maxX, minY, maxY },
            padding: this.padding
        });
    }

    // Transform X coordinate to viewport 
    transformX(x) {
        return x * this.scale + this.offsetX;
    }

    //Transform Y coordinate to viewport
    transformY(y) {
        return y * this.scale + this.offsetY;
    }

    // Set graph data
    setGraphData(data) {
        this.graphData = data;
        this.calculateViewport(); 
        this.draw();
    }

    // Clear canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw the campus graph
    draw() {
        if (!this.graphData) return;
        this.clear();
        this.drawEdges();
        this.drawNodes();
    }

    // Draw all edges
    drawEdges(highlightEdges = []) {
        const ctx = this.ctx;
        const nodes = this.graphData.nodes;
        const edges = this.graphData.edges;
        
        edges.forEach(edge => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            
            if (!fromNode || !toNode) return;
            
            // Transform coordinates
            const x1 = this.transformX(fromNode.x);
            const y1 = this.transformY(fromNode.y);
            const x2 = this.transformX(toNode.x);
            const y2 = this.transformY(toNode.y);
            
            // Check if edge should be highlighted
            const isHighlighted = highlightEdges.some(
                e => (e.from === edge.from && e.to === edge.to) ||
                     (e.from === edge.to && e.to === edge.from)
            );
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = isHighlighted ? this.colors.edgeHighlight : this.colors.edge;
            ctx.lineWidth = isHighlighted ? 4 : 2;
            ctx.stroke();
            
            // Draw weight label
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(midX - 20, midY - 10, 40, 20);
            
            ctx.fillStyle = this.colors.text;
            ctx.font = this.font;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edge.weight + 'm', midX, midY);
        });
    }

    //Draw all nodes
    drawNodes(visitedNodes = [], currentNode = -1, targetNode = -1, distances = []) {
        const ctx = this.ctx;
        const nodes = this.graphData.nodes;
        
        nodes.forEach(node => {
            // Transform coordinates
            const x = this.transformX(node.x);
            const y = this.transformY(node.y);
            
            // Scale node radius (but not too small)
            const radius = this.nodeRadius * Math.max(this.scale, 0.7);
            
            // Determine node color
            let color = this.colors.unvisited;
            if (node.id === currentNode) {
                color = this.colors.current;
            } else if (node.id === targetNode) {
                color = this.colors.target;
            } else if (visitedNodes[node.id]) {
                color = this.colors.visited;
            }
            
            // Draw node circle
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Draw node ID
            ctx.fillStyle = '#FFFFFF';
            ctx.font = this.boldFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.id, x, y);
            
            // Draw node name
            ctx.fillStyle = this.colors.text;
            ctx.font = this.font;
            ctx.fillText(node.name, x, y - radius - 15);
            
            // Draw distance if available
            if (distances && distances[node.id] !== undefined && distances[node.id] !== -1) {
                ctx.fillStyle = this.colors.current;
                ctx.font = this.boldFont;
                ctx.fillText(
                    distances[node.id] + 'm',
                    x,
                    y + radius + 20
                );
            }
        });
    }

    //Draw Dijkstra step
    drawDijkstraStep(step) {
        this.clear();
        
        // Build highlighted edges from path
        const highlightEdges = [];
        if (step.previous) {
            step.previous.forEach((prev, nodeId) => {
                if (prev !== -1) {
                    highlightEdges.push({ from: prev, to: nodeId });
                }
            });
        }
        
        this.drawEdges(highlightEdges);
        this.drawNodes(
            step.visited,
            step.node,
            -1,
            step.distances
        );
    }

    //Draw search step (binary search)
    drawSearchStep(step, sortedNodes) {
    this.clear();
    
    const ctx = this.ctx;
    
    // Calculate responsive dimensions based on canvas size
    const totalNodes = sortedNodes.length;
    const availableWidth = this.canvas.width - (this.padding.left + this.padding.right);
    const barWidth = Math.min(90, (availableWidth - (totalNodes + 1) * 10) / totalNodes);
    const barHeight = 50; 
    const gap = 10;
    
    // Center the array horizontally
    const totalWidth = totalNodes * barWidth + (totalNodes - 1) * gap;
    const startX = (this.canvas.width - totalWidth) / 2;
    const startY = this.padding.top + 80; // More space from top
    
    // Draw array visualization
    sortedNodes.forEach((node, index) => {
        const x = startX + index * (barWidth + gap);
        const y = startY;
        
        // Determine color 
        let color = '#E0E0E0'; 
        
        if (index === step.mid) {
            color = this.colors.current; // Yellow for mid
        } else if (step.left !== -1 && step.right !== -1 && 
                   index >= step.left && index <= step.right) {
            color = this.colors.unvisited; 
        }
        
        // If found, highlight the found element
        if (step.found && index === step.compareNode) {
            color = this.colors.visited; 
        }
        
        // Draw bar
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // Draw index above bar
        ctx.fillStyle = this.colors.text;
        ctx.font = this.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(index, x + barWidth / 2, y - 5);
        
        // Draw name inside bar - improved text handling
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Truncate and wrap text to fit in bar
        const name = node.name;
        const maxChars = Math.floor(barWidth / 7); // Rough estimate
        
        if (name.length > maxChars) {
            // Split into two lines if too long
            const words = name.split(' ');
            if (words.length > 1) {
                ctx.fillText(words[0].substring(0, maxChars), x + barWidth / 2, y + barHeight / 2 - 6);
                ctx.fillText(words[1].substring(0, maxChars), x + barWidth / 2, y + barHeight / 2 + 6);
            } else {
                ctx.fillText(name.substring(0, maxChars - 2) + '...', x + barWidth / 2, y + barHeight / 2);
            }
        } else {
            ctx.fillText(name, x + barWidth / 2, y + barHeight / 2);
        }
    });
    
    // Draw range indicators
    if (step.left !== -1 && step.right !== -1) {
        const leftX = startX + step.left * (barWidth + gap);
        const rightX = startX + step.right * (barWidth + gap) + barWidth;
        const indicatorY = startY + barHeight + 40;
        
        // Draw range line
        ctx.beginPath();
        ctx.moveTo(leftX, indicatorY);
        ctx.lineTo(rightX, indicatorY);
        ctx.strokeStyle = this.colors.current;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw arrow markers
        ctx.fillStyle = this.colors.current;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('▲', leftX, indicatorY + 20);
        ctx.fillText('▲', rightX, indicatorY + 20);
        
        // Labels
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = this.colors.text;
        ctx.fillText('left', leftX, indicatorY + 40);
        ctx.fillText('right', rightX, indicatorY + 40);
    }
    
    // Draw mid indicator
    if (step.mid !== -1) {
        const midX = startX + step.mid * (barWidth + gap) + barWidth / 2;
        const midY = startY - 25;
        
        ctx.fillStyle = this.colors.current;
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('▼', midX, midY);
        
        ctx.font = 'bold 14px Arial';
        ctx.fillStyle = this.colors.text;
        ctx.fillText('mid', midX, midY - 15);
    }
    
    // Draw step explanation at the bottom
    if (step.action) {
        ctx.fillStyle = this.colors.text;
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(step.action, this.canvas.width / 2, this.canvas.height - 30);
    }
}

    // Draw sort step (quicksort)
    drawSortStep(step) {
    this.clear();
    
    const ctx = this.ctx;
    
    // Calculate responsive dimensions based on canvas size
    const totalBars = step.array.length;
    const availableWidth = this.canvas.width - (this.padding.left + this.padding.right);
    const availableHeight = this.canvas.height - (this.padding.top + this.padding.bottom) - 100; // 100 for labels
    
    const barWidth = Math.min(70, (availableWidth - (totalBars + 1) * 10) / totalBars);
    const gap = 10;
    const maxHeight = Math.min(400, availableHeight);
    
    // Center the bars horizontally
    const totalWidth = totalBars * barWidth + (totalBars - 1) * gap;
    const startX = (this.canvas.width - totalWidth) / 2;
    const startY = this.canvas.height - this.padding.bottom - 80; // 80 for bottom labels
    
    // Find max value for scaling
    const maxValue = Math.max(...step.array);
    
    // Draw bars
    step.array.forEach((value, index) => {
        const height = (value / maxValue) * maxHeight;
        const x = startX + index * (barWidth + gap);
        const y = startY - height;
        
        // Determine color
        let color = this.colors.unvisited;
        if (index === step.pivot) {
            color = this.colors.target; // Pivot
        } else if (index === step.left || index === step.right) {
            color = this.colors.current; // Pointers
        } else if (index >= step.low && index <= step.high) {
            color = this.colors.visited; // Current partition
        } else {
            color = '#E0E0E0'; // Sorted
        }
        
        // Draw bar
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, height);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, barWidth, height);
        
        // Draw value
        ctx.fillStyle = this.colors.text;
        ctx.font = this.boldFont;
        ctx.textAlign = 'center';
        ctx.fillText(value + 'm', x + barWidth / 2, y - 10);
        
        // Draw name (rotated)
        ctx.save();
        ctx.translate(x + barWidth / 2, startY + 20);
        ctx.rotate(-Math.PI / 4);
        ctx.font = '11px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = this.colors.text;
        
        // Truncate long names
        const name = step.names[index];
        const displayName = name.length > 12 ? name.substring(0, 10) + '...' : name;
        ctx.fillText(displayName, 0, 0);
        ctx.restore();
        
        // Draw index
        ctx.font = this.font;
        ctx.fillStyle = this.colors.text;
        ctx.textAlign = 'center';
        ctx.fillText(index, x + barWidth / 2, startY + 15);
    });
    
    // Draw indicators at the top
    const indicatorY = this.padding.top + 30;
    
    if (step.pivot !== -1) {
        const pivotX = startX + step.pivot * (barWidth + gap) + barWidth / 2;
        ctx.fillStyle = this.colors.target;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PIVOT', pivotX, indicatorY);
    }
    
    if (step.left !== -1) {
        const leftX = startX + step.left * (barWidth + gap) + barWidth / 2;
        ctx.fillStyle = this.colors.current;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('L', leftX, indicatorY + 25);
    }
    
    if (step.right !== -1) {
        const rightX = startX + step.right * (barWidth + gap) + barWidth / 2;
        ctx.fillStyle = this.colors.current;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('R', rightX, indicatorY + 25);
    }
    }

    // Highlight final path
    highlightPath(path) {
        if (!path || path.length === 0) return;
        
        const ctx = this.ctx;
        
        // Draw path as thick line
        ctx.beginPath();
        const firstNode = this.graphData.nodes[path[0]];
        ctx.moveTo(
            this.transformX(firstNode.x),
            this.transformY(firstNode.y)
        );
        
        for (let i = 1; i < path.length; i++) {
            const node = this.graphData.nodes[path[i]];
            ctx.lineTo(
                this.transformX(node.x),
                this.transformY(node.y)
            );
        }
        
        ctx.strokeStyle = this.colors.path;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        // Redraw nodes on top
        this.drawNodes([], -1, -1, []);
        
        // Highlight path nodes
        path.forEach((nodeId, index) => {
            const node = this.graphData.nodes[nodeId];
            const x = this.transformX(node.x);
            const y = this.transformY(node.y);
            const radius = this.nodeRadius * Math.max(this.scale, 0.7);
            
            ctx.beginPath();
            ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = this.colors.path;
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Draw step number
            ctx.fillStyle = this.colors.path;
            ctx.font = this.boldFont;
            ctx.textAlign = 'center';
            ctx.fillText(
                '→' + (index + 1),
                x + radius + 15,
                y - radius - 15
            );
        });
    }
}

// Create global visualizer instance
const visualizer = new Visualizer('main-canvas');