# Code Iterator AI Demo Guide

This guide provides examples of how to use the Code Iterator AI Tool to improve and modify your code.

## Example 1: Optimizing a Slow Function

### Original Code
```javascript
function findDuplicates(array) {
  let duplicates = [];
  for (let i = 0; i < array.length; i++) {
    for (let j = i + 1; j < array.length; j++) {
      if (array[i] === array[j] && !duplicates.includes(array[i])) {
        duplicates.push(array[i]);
      }
    }
  }
  return duplicates;
}
```

### Instruction
```
Optimize this function to be more efficient. The current implementation has O(n²) time complexity.
```

### AI Response

#### Explanation
The original function uses a nested loop approach with O(n²) time complexity. I've optimized it to use a Map to track occurrences of each value, reducing the time complexity to O(n).

#### Modified Code
```javascript
function findDuplicates(array) {
  const seen = new Map();
  const duplicates = [];
  
  for (const item of array) {
    if (seen.has(item)) {
      if (seen.get(item) === 1) {
        duplicates.push(item);
      }
      seen.set(item, seen.get(item) + 1);
    } else {
      seen.set(item, 1);
    }
  }
  
  return duplicates;
}
```

## Example 2: Adding Error Handling

### Original Code
```python
def read_config_file(filename):
    with open(filename, 'r') as file:
        content = file.read()
    return json.loads(content)
```

### Instruction
```
Add proper error handling to this function. It should handle file not found and JSON parsing errors gracefully.
```

### AI Response

#### Explanation
I've added comprehensive error handling to catch file not found errors, permission issues, and JSON parsing errors. The function now provides informative error messages and returns None instead of crashing.

#### Modified Code
```python
import json
import os

def read_config_file(filename):
    try:
        if not os.path.exists(filename):
            print(f"Error: File '{filename}' not found.")
            return None
            
        with open(filename, 'r') as file:
            content = file.read()
            
        try:
            return json.loads(content)
        except json.JSONDecodeError as e:
            print(f"Error: Invalid JSON format in '{filename}': {e}")
            return None
            
    except PermissionError:
        print(f"Error: Permission denied when accessing '{filename}'")
        return None
    except Exception as e:
        print(f"Error: Unexpected error reading '{filename}': {e}")
        return None
```

## Example 3: Refactoring for Readability

### Original Code
```javascript
const fn = (a, b, c, d, e) => {
  let r = 0;
  if (a > b) {
    if (c > d) {
      r = a + c;
    } else {
      r = a + d;
    }
  } else {
    if (c > d) {
      r = b + c;
    } else {
      r = b + d;
    }
  }
  return r * e;
};
```

### Instruction
```
Refactor this function to be more readable. Give it a meaningful name and improve variable names.
```

### AI Response

#### Explanation
I've renamed the function and variables to clearly communicate their purpose. I've also simplified the nested if statements using Math.max() for better readability.

#### Modified Code
```javascript
/**
 * Calculates the product of the maximum value from each group and the multiplier
 * @param {number} firstGroupValueA - First value from group 1
 * @param {number} firstGroupValueB - Second value from group 1
 * @param {number} secondGroupValueA - First value from group 2
 * @param {number} secondGroupValueB - Second value from group 2
 * @param {number} multiplier - Value to multiply the sum by
 * @returns {number} The result of the calculation
 */
const calculateMaximumProduct = (firstGroupValueA, firstGroupValueB, secondGroupValueA, secondGroupValueB, multiplier) => {
  // Find maximum value from each group
  const maxFromFirstGroup = Math.max(firstGroupValueA, firstGroupValueB);
  const maxFromSecondGroup = Math.max(secondGroupValueA, secondGroupValueB);
  
  // Calculate the sum of maximums and multiply by the multiplier
  return (maxFromFirstGroup + maxFromSecondGroup) * multiplier;
};
```

## Using the Tool Effectively

### Tips for Writing Good Instructions

1. **Be specific**: Clearly state what you want to change or improve
2. **Provide context**: Explain the purpose of the code when relevant
3. **Set constraints**: Mention any limitations or requirements that must be followed
4. **Ask for explanations**: The AI will explain its changes, which helps you understand the improvements

### Types of Tasks the Tool Excels At

- Optimization for performance
- Adding error handling
- Converting between coding styles
- Implementing design patterns
- Refactoring for readability
- Documentation generation
- Test case creation 