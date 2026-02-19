/*
  API Communication Layer
  Handles all backend communication
*/

class CampusAPI {
    constructor(baseURL = 'http://localhost:8080') {
        this.baseURL = baseURL;
        this.graphData = null;
    }

    /* Fetch campus graph data */
    async getGraph() {
        try {
            const response = await fetch(`${this.baseURL}/api/graph`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.graphData = await response.json();
            return this.graphData;
        } catch (error) {
            console.error('Error fetching graph:', error);
            throw error;
        }
    }

    /**
     * Get Dijkstra's shortest path
     * @param {number} start - Start node ID
     * @param {number} end - End node ID
     */
    async getDijkstra(start, end) {
        try {
            const response = await fetch(
                `${this.baseURL}/api/dijkstra?start=${start}&end=${end}`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching Dijkstra:', error);
            throw error;
        }
    }

    /**
     * Search for a building
     * @param {string} query - Building name to search for
     */
    async searchBuilding(query) {
        try {
            const response = await fetch(
                `${this.baseURL}/api/search?query=${encodeURIComponent(query)}`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error searching building:', error);
            throw error;
        }
    }

    /**
     * Sort locations by distance
     * @param {number} reference - Reference node ID
     */
    async sortByDistance(reference) {
        try {
            const response = await fetch(
                `${this.baseURL}/api/sort?reference=${reference}`
            );
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error sorting:', error);
            throw error;
        }
    }

    /**
     * Check if server is running
     */
    async ping() {
        try {
            const response = await fetch(`${this.baseURL}/api/graph`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Create global API instance
const api = new CampusAPI();