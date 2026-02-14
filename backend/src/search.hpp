#pragma once
#include "graph.hpp"
#include "../lib/json.hpp"
#include <algorithm>
#include <vector>

using json = nlohmann::json;
using namespace std;

// Structure to store information about each step of the binary search
struct SearchStep {
    int stepNum;
    string action;
    string explanation;
    int left, right, mid;
    int compareNode;
    bool found;
    
    // Convert this step to JSON format for the response
    json toJSON(const Graph& g) const {
        json stepJson;
        stepJson["step"] = stepNum;
        stepJson["action"] = action;
        stepJson["explanation"] = explanation;
        stepJson["left"] = left;
        stepJson["right"] = right;
        stepJson["mid"] = mid;
        stepJson["compareNode"] = compareNode;
        stepJson["found"] = found;
        return stepJson;
    }
};

class BinarySearchVisualizer {
private:
    vector<SearchStep> steps;  // Store all search steps for visualization
    int stepNum;  // Track current step number
    
    void recordStep(const string& action, const string& explanation, 
                   int left, int right, int mid, int compareNode, bool found) { // Record each step of the binary search process
        SearchStep currentStep;
        currentStep.stepNum = stepNum++;
        currentStep.action = action;
        currentStep.explanation = explanation;
        currentStep.left = left;
        currentStep.right = right;
        currentStep.mid = mid;
        currentStep.compareNode = compareNode;
        currentStep.found = found;
        steps.push_back(currentStep);
    }
    
public:
    BinarySearchVisualizer() : stepNum(0) {}
    
    json search(const Graph& graph, const string& searchQuery) {         // Get all nodes from the graph and sort them alphabetically
        vector<Node> sortedNodes = graph.getNodes();
        sort(sortedNodes.begin(), sortedNodes.end(), 
             [](const Node& a, const Node& b) { return a.name < b.name; });
        
        int left = 0;         // Initialize search range: left is start, right is end
        int right = sortedNodes.size() - 1;
        int foundIndex = -1;  // Will store the index if found, -1 means not found
        
        recordStep("Starting binary search",          // Record the initial state
                  "Array is sorted alphabetically. Searching for: " + searchQuery,
                  left, right, -1, -1, false);
        
        while (left <= right) {  // Binary search main loop - continues while search range is valid

            int mid = left + (right - left) / 2;             // Calculate middle index (avoids overflow compared to (left + right) / 2)

            
            recordStep("Checking middle element",
                      "Range: [" + to_string(left) + ", " + to_string(right) + 
                      "]. Midpoint: " + to_string(mid) + " (" + sortedNodes[mid].name + ")",
                      left, right, mid, mid, false);
            
            int comparison = searchQuery.compare(sortedNodes[mid].name);             // Compare search query with middle element
            
            if (comparison == 0) {              // Returns: 0 if equal, <0 if query comes before, >0 if query comes after

                foundIndex = mid;
                recordStep("Found!",
                          "'" + searchQuery + "' matches '" + sortedNodes[mid].name + "' at index " + to_string(mid),
                          left, right, mid, mid, true);
                break;
            } 
            else if (comparison < 0) {                 // Search query comes before middle element alphabetically

                recordStep("Search left half",          // Discard right half, search in left half
                          "'" + searchQuery + "' < '" + sortedNodes[mid].name + "'. "
                          "Discard right half and search left.",
                          left, mid - 1, mid, mid, false);
                right = mid - 1;
            } 
            else {

                recordStep("Search right half",           // Discard left half, search in right half
                          "'" + searchQuery + "' > '" + sortedNodes[mid].name + "'. "
                          "Discard left half and search right.",
                          mid + 1, right, mid, mid, false);
                left = mid + 1;
            }
        }
        

        if (foundIndex == -1) {           // If we exit the loop without finding, record that
            recordStep("Not found",
                      "Search completed. '" + searchQuery + "' not found in the campus.",
                      left, right, -1, -1, false);
        }
        
        json result;          // Build JSON response with all search information
        result["algorithm"] = "binary_search";
        result["query"] = searchQuery;
        result["found"] = (foundIndex != -1);
        
        if (foundIndex != -1) {
            result["result"] = {
                {"id", sortedNodes[foundIndex].id},
                {"name", sortedNodes[foundIndex].name},
                {"type", sortedNodes[foundIndex].type},
                {"x", sortedNodes[foundIndex].x},
                {"y", sortedNodes[foundIndex].y}
            };
        }
        
        result["sortedArray"] = json::array();          // Include the sorted array used for searching
        for (const auto& node : sortedNodes) {
            result["sortedArray"].push_back({
                {"id", node.id},
                {"name", node.name}
            });
        }
        
        result["steps"] = json::array();          // Include all recorded steps for visualization
        for (const auto& step : steps) {
            result["steps"].push_back(step.toJSON(graph));
        }
        
        result["complexity"] = {          // Include algorithm complexity information
            {"time", "O(log n)"},
            {"space", "O(1)"},
            {"description", "Iterative binary search on sorted array"}
        };
        
        return result;
    }
};

json searchBuilding(const Graph& graph, const string& searchQuery) {   // Main function to search for a building in the graph
    BinarySearchVisualizer visualizer;
    return visualizer.search(graph, searchQuery);
}