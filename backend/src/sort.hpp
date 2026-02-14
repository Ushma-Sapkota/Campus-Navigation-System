#pragma once
#include "graph.hpp"
#include "../lib/json.hpp"
#include <vector>
#include <cmath>

using json = nlohmann::json;
using namespace std;

// Structure to store information about each step of the quicksort
struct SortStep {
    int stepNum;
    string action;
    string explanation;
    vector<int> array;
    vector<string> names;
    int pivotIndex;
    int leftPointer;
    int rightPointer;
    int low, high;
    
    // Convert this step to JSON format
    json toJSON() const {
        json stepJson;
        stepJson["step"] = stepNum;
        stepJson["action"] = action;
        stepJson["explanation"] = explanation;
        stepJson["array"] = array;
        stepJson["names"] = names;
        stepJson["pivot"] = pivotIndex;
        stepJson["left"] = leftPointer;
        stepJson["right"] = rightPointer;
        stepJson["low"] = low;
        stepJson["high"] = high;
        return stepJson;
    }
};

class QuickSortVisualizer {
private:
    vector<SortStep> steps;
    int stepNum;
    vector<int> distances;
    vector<string> names;
    
    // Record each step of the quicksort process
    void recordStep(const string& action, const string& explanation,
                   int pivot, int left, int right, int low, int high) {
        SortStep currentStep;
        currentStep.stepNum = stepNum++;
        currentStep.action = action;
        currentStep.explanation = explanation;
        currentStep.array = distances;
        currentStep.names = names;
        currentStep.pivotIndex = pivot;
        currentStep.leftPointer = left;
        currentStep.rightPointer = right;
        currentStep.low = low;
        currentStep.high = high;
        steps.push_back(currentStep);
    }
    
    // Partition the array around a pivot element

    int partition(int low, int high) {                      // All elements smaller than pivot go to left, larger go to right
        int pivot = distances[high];                    // Choose the last element as pivot
        string pivotName = names[high];
        
        recordStep("Choose pivot",
                  "Selected pivot: " + to_string(pivot) + "m (" + pivotName + ") at index " + to_string(high),
                  high, -1, -1, low, high);
        
        int i = low - 1;                   // Index of smaller element (partition point)
        
        for (int j = low; j < high; j++) {              // Compare each element with pivot
            recordStep("Comparing",
                      "Compare " + to_string(distances[j]) + "m (" + names[j] + ") with pivot " + 
                      to_string(pivot) + "m",
                      high, i, j, low, high);
            
            if (distances[j] < pivot) {                // If current element is smaller than pivot
                i++;
                
                swap(distances[i], distances[j]);                 // Swap distances and names
                swap(names[i], names[j]);
                
                recordStep("Swap",
                          "Swapped " + names[i] + " and " + names[j] + 
                          " (both smaller than pivot)",
                          high, i, j, low, high);
            }
        }
        
        swap(distances[i + 1], distances[high]);          // Place pivot in its correct sorted position
        swap(names[i + 1], names[high]);
        
        recordStep("Place pivot",
                  "Placed pivot " + names[i + 1] + " at its final position (index " + 
                  to_string(i + 1) + ")",
                  i + 1, -1, -1, low, high);
        
        return i + 1;
    }
    
    void quicksort(int low, int high) {       // Recursive quicksort function

        if (low < high) {           // Base case: if low >= high, subarray has 0 or 1 element (already sorted)
            recordStep("Partition",
                      "Sorting subarray from index " + to_string(low) + " to " + to_string(high),
                      -1, -1, -1, low, high);
            
            int pivotIndex = partition(low, high);               // Partition the array and get pivot position
            
            quicksort(low, pivotIndex - 1);               // Recursively sort elements before and after pivot
            quicksort(pivotIndex + 1, high);
        }
    }
    
public:
    QuickSortVisualizer() : stepNum(0) {}
    
    json sort(const Graph& graph, int referenceNodeId) {
        int totalNodes = graph.size();            // Calculate distances from reference node to all other nodes
        distances.clear();
        names.clear();
        
        const Node& referenceNode = graph.getNode(referenceNodeId);
        
        for (int i = 0; i < totalNodes; i++) {            // Loop through all nodes and calculate their distance from reference
            if (i != referenceNodeId) {
                const Node& currentNode = graph.getNode(i);
                
                double dx = currentNode.x - referenceNode.x;                   // Calculate Euclidean distance using Pythagorean theorem
                double dy = currentNode.y - referenceNode.y;
                int distance = static_cast<int>(sqrt(dx * dx + dy * dy));
                
                distances.push_back(distance);
                names.push_back(currentNode.name);
            }
        }
        recordStep("Initial array",    
                  "Sorting " + to_string(distances.size()) + 
                  " buildings by distance from " + referenceNode.name,
                  -1, -1, -1, 0, distances.size() - 1);            // Record initial unsorted state

        
        if (!distances.empty()) {            // Perform quicksort
            quicksort(0, distances.size() - 1);
        }
        
        recordStep("Sorted!",            // Record final sorted state
                  "Array is now sorted by distance from " + referenceNode.name,
                  -1, -1, -1, 0, distances.size() - 1);
        
        json result;           // Build JSON response with all sorting information
        result["algorithm"] = "quicksort";
        result["referenceNode"] = referenceNodeId;
        result["referenceName"] = referenceNode.name;
        
        result["sortedLocations"] = json::array();           // Add sorted locations to result
        for (size_t i = 0; i < distances.size(); i++) {
            result["sortedLocations"].push_back({
                {"name", names[i]},
                {"distance", distances[i]}
            });
        }
        
        result["steps"] = json::array();          // Add all recorded steps for visualization
        for (const auto& step : steps) {
            result["steps"].push_back(step.toJSON());
        }
        
        result["complexity"] = {          // Include algorithm complexity information
            {"time_avg", "O(n log n)"},
            {"time_worst", "O(n²)"},
            {"space", "O(log n)"},
            {"description", "In-place sorting with random pivot"}
        };
        
        return result;
    }
};

json sortLocationsByDistance(const Graph& graph, int referenceNodeId) {   // Main function to sort locations by distance from a reference node
    QuickSortVisualizer visualizer;
    return visualizer.sort(graph, referenceNodeId);
}