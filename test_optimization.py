import time
import operator
import tracemalloc
import gc
import sys

# Original implementation
def process_numbers_original(numbers):
    # Step 1: Remove negative numbers using filter() with list conversion
    positive_numbers = list(filter(lambda x: x >= 0, numbers))
    
    # Step 2: Square the remaining numbers using a generator expression
    squared_numbers = (num ** 2 for num in positive_numbers)
    
    # Step 3: Sort the squared numbers in descending order
    sorted_numbers = sorted(squared_numbers, reverse=True)
    
    return sorted_numbers

# Optimized implementation
def process_numbers_optimized(numbers):
    # Step 1: Remove negative numbers using filter() directly
    positive_numbers = filter(lambda num: num >= 0, numbers)
    
    # Step 2: Square the remaining numbers using a generator expression
    squared_numbers = (num ** 2 for num in positive_numbers)
    
    # Step 3: Sort the squared numbers in descending order
    sorted_numbers = sorted(squared_numbers, reverse=True)
    
    return sorted_numbers

# Test focused on memory usage with large datasets
def test_memory_usage():
    print("=== Memory Usage Test ===")
    # Create a list with only positive numbers to focus on the filter() step
    large_data = list(range(1, 10000000))  # 10 million positive numbers
    
    gc.collect()
    tracemalloc.start()
    
    # Test the impact of creating a list from filter
    result = list(filter(lambda x: x > 0, large_data))
    current, peak = tracemalloc.get_traced_memory()
    list_memory = peak / 1024 / 1024  # MB
    del result
    tracemalloc.stop()
    
    gc.collect()
    tracemalloc.start()
    
    # Test using filter directly without creating a list
    result = filter(lambda x: x > 0, large_data)
    # Just iterate through it to simulate usage
    count = 0
    for _ in result:
        count += 1
        if count > 10000:  # Don't need to iterate through all elements
            break
    
    current, peak = tracemalloc.get_traced_memory()
    filter_memory = peak / 1024 / 1024  # MB
    tracemalloc.stop()
    
    print(f"Memory usage with list(filter()): {list_memory:.2f} MB")
    print(f"Memory usage with filter() directly: {filter_memory:.2f} MB")
    print(f"Memory saved: {list_memory - filter_memory:.2f} MB ({(list_memory - filter_memory) / list_memory * 100:.2f}%)")

# Main performance comparison test
def main():
    test_memory_usage()  # Run memory test first
    print("\n=== Performance Comparison ===")
    
    # Create a test dataset
    test_data = list(range(-100000, 100000))
    
    # Clear any lingering objects and reset memory tracking
    gc.collect()
    
    # Test original implementation with memory tracking
    tracemalloc.start()
    start_time = time.time()
    result1 = process_numbers_original(test_data)
    # Force list conversion to materialize the generator
    result1_list = list(result1)
    original_time = time.time() - start_time
    current, peak = tracemalloc.get_traced_memory()
    original_memory = peak / 1024 / 1024  # Convert to MB
    tracemalloc.stop()
    
    # Save result for comparison
    first_elements = result1_list[:5]
    
    # Clear memory between tests
    del result1_list
    gc.collect()
    
    # Test optimized implementation with memory tracking
    tracemalloc.start()
    start_time = time.time()
    result2 = process_numbers_optimized(test_data)
    # Force list conversion to materialize the generator
    result2_list = list(result2)
    optimized_time = time.time() - start_time
    current, peak = tracemalloc.get_traced_memory()
    optimized_memory = peak / 1024 / 1024  # Convert to MB
    tracemalloc.stop()
    
    # Compare performance
    print(f"Original implementation:")
    print(f"  Time: {original_time:.6f} seconds")
    print(f"  Memory: {original_memory:.2f} MB")
    print(f"Optimized implementation:")
    print(f"  Time: {optimized_time:.6f} seconds")
    print(f"  Memory: {optimized_memory:.2f} MB")
    print(f"Improvement:")
    print(f"  Time: {(original_time - optimized_time) / original_time * 100:.2f}%")
    print(f"  Memory: {(original_memory - optimized_memory) / original_memory * 100:.2f}%")
    
    # Check if results are the same
    print(f"\nResults match for first 5 elements: {result2_list[:5] == first_elements}")
    print(f"First 5 elements: {first_elements}")

if __name__ == "__main__":
    main() 