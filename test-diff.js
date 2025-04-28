// Original code
const originalCode = `from operator import itemgetter

# Function to filter and process numbers
def process_numbers(numbers):
    # Step 1: Remove negative numbers using filter()
    positive_numbers = list(filter(lambda x: x >= 0, numbers))
    
    # Step 2: Square the remaining numbers using a generator expression
    squared_numbers = (num ** 2 for num in positive_numbers)
    
    # Step 3: Sort the squared numbers in descending order using sorted() and itemgetter
    sorted_numbers = sorted(squared_numbers, key=itemgetter(0), reverse=True)
    
    # Step 4: Print the result
    print("Processed Numbers:", sorted_numbers)
    
    return sorted_numbers

# Sample list of numbers
numbers = [5, -3, 8, -1, 2]
process_numbers(numbers)`;

// Modified code from API response
const modifiedCode = `# Function to filter and process numbers
def process_numbers(numbers):
    # Step 1: Remove negative numbers using filter()
    positive_numbers = filter(lambda num: num >= 0, numbers)
    
    # Step 2: Square the remaining numbers using a generator expression
    squared_numbers = (num ** 2 for num in positive_numbers)
    
    # Step 3: Sort the squared numbers in descending order
    sorted_numbers = sorted(squared_numbers, reverse=True)
    
    # Step 4: Print the result
    print("Processed Numbers:", sorted_numbers)
    
    return sorted_numbers
# Sample list of numbers
numbers = [5, -3, 8, -1, 2]
process_numbers(numbers)`;

// Compare line by line
const compareLines = () => {
  const origLines = originalCode.split('\n');
  const modLines = modifiedCode.split('\n');
  
  console.log("Line-by-line comparison:");
  for (let i = 0; i < Math.min(origLines.length, modLines.length); i++) {
    if (origLines[i] !== modLines[i]) {
      console.log(`Difference at line ${i+1}:`);
      console.log(`Original: ${origLines[i]}`);
      console.log(`Modified: ${modLines[i]}`);
      console.log('-----------------');
    }
  }
};

// Run comparison
compareLines(); 