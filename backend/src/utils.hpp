#pragma once
#include <string>
#include <sstream>
#include <vector>
#include <algorithm>
#include <map>

using namespace std;

// Decode URL-encoded strings
string urlDecode(const string& encodeUrl) {
    string decodeUrl = "";

    for (size_t i = 0; i < encodeUrl.length(); i++){
        char currentChar = encodeUrl[i];

        // Handle percent-encoded characters (e.g., %20)
        if (currentChar == '%') {
            if (i + 2 < encodeUrl.length()){
                string hexvalue = encodeUrl.substr(i + 1, 2);
                int asciiValue;
                istringstream hexConverter(hexvalue);
                if (hexConverter >> hex >> asciiValue){
                    decodeUrl += static_cast<char>(asciiValue);
                    i += 2;
                }
            }
        }
        // Replace + with space
        else if (currentChar == '+') {
            decodeUrl += ' ';
        }
        else {
            decodeUrl += currentChar;
        }
    }

    return decodeUrl;
}

// Parse query parameters from URL and return a map of key-value pairs
map<string, string> parseQueryParams(const string& query){
    map<string, string> params;
    istringstream queryStream(query);
    string pair;
    
    // Split by '&' to get each key-value pair
    while (getline(queryStream, pair, '&')){
        size_t equalSignPosition = pair.find('=');
        if (equalSignPosition != string::npos){
            string encodedKey = pair.substr(0, equalSignPosition);
            string key = urlDecode(encodedKey);
            string encodedValue = pair.substr(equalSignPosition + 1);
            string value = urlDecode(encodedValue);
            params[key] = value;
        }
    }
    return params;
}

// Extract path from HTTP request
string extractPath(const string& request){ 
    size_t start = request.find("GET") + 4;
    size_t end = request.find("HTTP/");
    
    if (start != string::npos && end != string::npos){
        string fullPath = request.substr(start, end - start);
        size_t questionPosition = fullPath.find('?');
        
        // Return path without query parameters
        if (questionPosition != string::npos){
            return fullPath.substr(0, questionPosition);
        }
        else {
            return fullPath;
        }
    }
    return "/";
}

// Extract query string from HTTP request
string extractQueryString(const string& request){
    size_t start = request.find("GET") + 4;
    size_t end = request.find("HTTP/");
    
    if (start != string::npos && end != string::npos){
        string fullPath = request.substr(start, end - start);
        size_t questionPosition = fullPath.find('?');
        
        // Return everything after the '?'
        if (questionPosition != string::npos){
            return fullPath.substr(questionPosition + 1);
        } else {
            return "";
        }
    }
    return "";
}