
import os
import subprocess
import csv
import json
import re
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import urlparse
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration - update these paths to match your JMeter installation
JMETER_HOME = "C:/Jmeter/apache-jmeter-5.6.3"  # Path to JMeter installation
TEST_CASES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_cases")  # Directory containing JMeter test cases
RESULTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results")  # Directory to store test results

# Ensure directories exist
os.makedirs(TEST_CASES_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

def find_test_case(url):
    """Find a matching JMeter test case."""
    if not os.path.exists(TEST_CASES_DIR):
        logger.error(f"Test cases directory not found: {TEST_CASES_DIR}")
        return None
    
    # First check for Apache.jmx which is the manually added file
    apache_test = os.path.join(TEST_CASES_DIR, "Apache.jmx")
    
    if os.path.exists(apache_test):
        logger.info(f"Found Apache test case: {apache_test}")
        return apache_test
    
    # Fallback to checking other .jmx files if Apache.jmx is not found
    for file in os.listdir(TEST_CASES_DIR):
        if file.endswith('.jmx'):
            test_case_path = os.path.join(TEST_CASES_DIR, file)
            logger.info(f"Using available test case: {test_case_path}")
            return test_case_path
    
    logger.error(f"No JMeter test case files found in {TEST_CASES_DIR}")
    return None

def run_jmeter_test(test_case_path, url, users, duration):
    """Run JMeter test in non-GUI mode and return the result path."""
    timestamp = int(time.time())
    result_csv = os.path.join(RESULTS_DIR, f"result_{timestamp}.csv")
    report_dir = os.path.join(RESULTS_DIR, f"report_{timestamp}")
    
    # Create a unique ID for this test run
    test_id = f"{timestamp}"
    
    # Ensure report directory exists
    os.makedirs(report_dir, exist_ok=True)
    
    # Build JMeter command
    jmeter_bin = os.path.join(JMETER_HOME, "bin", "jmeter.bat" if os.name == "nt" else "jmeter")
    
    # For command line arguments, use properly formatted URL (replace commas and spaces)
    safe_url = url.replace(',', '%2C').replace(' ', '%20')
    
    # Customizing the JMeter command to work more reliably
    cmd = [
        jmeter_bin,
        "-n",  # Non-GUI mode
        "-t", test_case_path,  # Test case file
        "-l", result_csv,  # Results file
        "-e",  # Generate report
        "-o", report_dir,  # Report output directory
        "-Jurl=" + safe_url,  # Pass URL as parameter
        "-Jusers=" + str(users),  # Pass number of users
        "-Jduration=" + str(duration)  # Pass duration
    ]
    
    logger.info(f"Executing JMeter command: {' '.join(cmd)}")
    
    try:
        # Execute JMeter with extended timeout
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            universal_newlines=True,
            cwd=os.path.dirname(jmeter_bin)  # Set working directory to JMeter bin folder
        )
        stdout, stderr = process.communicate(timeout=max(duration * 4, 120))  # Allow extra time for JMeter
        
        # Log detailed output for debugging
        logger.info(f"JMeter stdout: {stdout}")
        if stderr:
            logger.warning(f"JMeter stderr: {stderr}")
        
        if process.returncode != 0:
            logger.error(f"JMeter execution failed with return code {process.returncode}")
            return None, None, stderr
        
        # Verify result file exists and has content
        if not os.path.exists(result_csv):
            logger.error(f"Results file was not created: {result_csv}")
            return None, None, "Results file was not created"
            
        # Check if file has content
        if os.path.getsize(result_csv) == 0:
            logger.error(f"Results file is empty: {result_csv}")
            return None, None, "Results file is empty"
        
        logger.info(f"JMeter test completed successfully, results at {result_csv}")
        return result_csv, report_dir, test_id
    
    except subprocess.TimeoutExpired:
        process.kill()
        logger.error("JMeter process timed out and was killed")
        return None, None, "Process timed out"
    except Exception as e:
        logger.error(f"Error running JMeter: {str(e)}")
        return None, None, str(e)

def parse_results(result_csv, test_id):
    """Parse JMeter results CSV and extract key metrics."""
    if not os.path.exists(result_csv):
        logger.error(f"Results file not found: {result_csv}")
        return None
    
    try:
        # Initialize metrics containers
        metrics = {
            "summary": {
                "avgLoadTime": "0",
                "avgLatency": "0",
                "peakRps": "0",
                "totalRequests": 0,
                "errorRate": "0",
                "successRate": "100"
            },
            "loadTime": [],
            "latency": [],
            "errorRate": [],
            "requestsPerSecond": [],
            "statusCodes": [],
            "performanceScores": {
                "overall": 0,
                "ttfb": 0,
                "fcp": 0,
                "lcp": 0,
                "ttl": 0
            }
        }
        
        # Check file size before reading
        file_size = os.path.getsize(result_csv)
        logger.info(f"Result CSV file size: {file_size} bytes")
        
        if file_size == 0:
            logger.warning("Results CSV is empty")
            return metrics
        
        # Read CSV file with appropriate error handling
        rows = []
        try:
            with open(result_csv, 'r', encoding='utf-8') as file:
                csv_content = file.read()
                logger.info(f"CSV first 100 chars: {csv_content[:100]}...")
                
                # Reset file pointer and read with csv reader
                file.seek(0)
                reader = csv.DictReader(file)
                rows = list(reader)
                
                logger.info(f"Parsed {len(rows)} rows from CSV")
        except Exception as e:
            logger.error(f"Error reading CSV: {str(e)}")
            # Return fallback metrics
            return metrics
            
        if not rows:
            logger.warning("No data rows in CSV")
            return metrics
        
        # Process each row for time series data
        timestamps = []
        load_times = []
        latencies = []
        errors_by_timestamp = {}
        status_codes = {}
        total_requests = len(rows)
        success_count = 0
        
        for row in rows:
            # Basic validation - check if row has required fields
            if 'timeStamp' not in row or 'elapsed' not in row or 'Latency' not in row:
                logger.warning(f"Row missing required fields: {row}")
                continue
            
            # Extract data
            try:
                timestamp = int(row.get('timeStamp', 0)) // 1000  # Convert to seconds
                elapsed = int(row.get('elapsed', 0))  # Response time in ms
                latency = int(row.get('Latency', 0))  # Latency in ms
                status = row.get('responseCode', '')
                success = row.get('success', 'true').lower() == 'true'
                
                # Aggregate data
                timestamps.append(timestamp)
                load_times.append(elapsed)
                latencies.append(latency)
                
                # Count status codes
                status_codes[status] = status_codes.get(status, 0) + 1
                
                # Track errors by timestamp
                if not success:
                    errors_by_timestamp[timestamp] = errors_by_timestamp.get(timestamp, 0) + 1
                else:
                    success_count += 1
            except (ValueError, TypeError) as e:
                logger.warning(f"Error processing row data: {e}")
                continue
        
        # Calculate summary metrics
        avg_load_time = sum(load_times) / len(load_times) if load_times else 0
        avg_latency = sum(latencies) / len(latencies) if latencies else 0
        error_rate = ((total_requests - success_count) / total_requests) * 100 if total_requests > 0 else 0
        success_rate = 100 - error_rate
        
        # Calculate requests per second
        if timestamps:
            min_time = min(timestamps)
            max_time = max(timestamps)
            test_duration = max_time - min_time + 1  # Add 1 to avoid division by zero
            rps = total_requests / test_duration if test_duration > 0 else 0
        else:
            rps = 0
        
        # Format time series data - standardize to 20 data points for charts
        # Sort timestamps and create time buckets
        if timestamps:
            unique_timestamps = sorted(set(timestamps))
            start_time = min(unique_timestamps)
            
            # Create time series with 20 data points
            time_points = min(20, len(unique_timestamps))
            data_points_time = []
            data_points_load = []
            data_points_latency = []
            data_points_error = []
            data_points_rps = []
            
            for i in range(time_points):
                # Calculate time point
                t = start_time + (i * (max(unique_timestamps) - start_time) / (time_points - 1) if time_points > 1 else 0)
                data_points_time.append(int(t))
            
            # Find nearest values for each data point
            for t in data_points_time:
                # Find nearest timestamp
                nearest_idx = min(range(len(timestamps)), key=lambda i: abs(timestamps[i] - t))
                
                # Add corresponding values
                data_points_load.append(load_times[nearest_idx])
                data_points_latency.append(latencies[nearest_idx])
                
                # Calculate error rate for this timestamp
                errors_at_t = errors_by_timestamp.get(timestamps[nearest_idx], 0)
                requests_at_t = sum(1 for ts in timestamps if ts == timestamps[nearest_idx])
                error_rate_at_t = (errors_at_t / requests_at_t) * 100 if requests_at_t > 0 else 0
                data_points_error.append(error_rate_at_t)
                
                # Calculate RPS for this timestamp (requests in this second)
                requests_at_t = sum(1 for ts in timestamps if ts == timestamps[nearest_idx])
                data_points_rps.append(requests_at_t)
            
            # Update metrics with time series data
            metrics["loadTime"] = data_points_load
            metrics["latency"] = data_points_latency
            metrics["errorRate"] = data_points_error
            metrics["requestsPerSecond"] = data_points_rps
        
        # Format status code data for pie chart
        metrics["statusCodes"] = [
            {"name": code, "value": count}
            for code, count in status_codes.items()
        ]
        
        # Convert to percentages for the UI
        total_status_codes = sum(item["value"] for item in metrics["statusCodes"])
        if total_status_codes > 0:
            for item in metrics["statusCodes"]:
                item["value"] = (item["value"] / total_status_codes) * 100
        
        # Calculate performance scores
        # Convert raw metrics to scores (0-100 scale)
        ttfb_score = min(100, max(0, 100 - (avg_latency / 100)))
        load_time_score = min(100, max(0, 100 - (avg_load_time / 100)))
        error_score = success_rate
        
        # Overall performance score with weighted components
        overall_score = int((ttfb_score * 0.2) + (load_time_score * 0.5) + (error_score * 0.3))
        
        metrics["performanceScores"] = {
            "overall": overall_score,
            "ttfb": int(ttfb_score),
            "fcp": int(load_time_score * 0.8),  # Estimate FCP as 80% of load time score
            "lcp": int(load_time_score * 0.7),  # Estimate LCP as 70% of load time score
            "ttl": int(load_time_score * 0.9)   # Estimate TTL as 90% of load time score
        }
        
        # Update summary with calculated values
        metrics["summary"] = {
            "avgLoadTime": f"{avg_load_time:.2f}",
            "avgLatency": f"{avg_latency:.2f}",
            "peakRps": f"{rps:.2f}",
            "totalRequests": total_requests,
            "errorRate": f"{error_rate:.2f}",
            "successRate": f"{success_rate:.2f}"
        }
        
        return metrics
    
    except Exception as e:
        logger.error(f"Error parsing results: {str(e)}")
        return None

@app.route('/api/run-test', methods=['POST'])
def run_test():
    """API endpoint to run a JMeter test."""
    try:
        # Get test parameters from request
        data = request.get_json()
        url = data.get('url')
        test_type = data.get('testType', 'load')
        users = int(data.get('users', 50))
        duration = int(data.get('duration', 30))
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Find JMeter test case (using Apache.jmx first)
        test_case_path = find_test_case(url)
        if not test_case_path:
            return jsonify({'error': 'No JMeter test case file found. Please ensure Apache.jmx exists in the test_cases directory.'}), 404
        
        # Run JMeter test
        result_csv, report_dir, test_id = run_jmeter_test(test_case_path, url, users, duration)
        
        if not result_csv or not test_id:
            return jsonify({'error': 'JMeter test execution failed. Check the logs for details.'}), 500
        
        # Parse results
        metrics = parse_results(result_csv, test_id)
        
        if not metrics:
            return jsonify({'error': 'Failed to parse test results'}), 500
        
        return jsonify({'metrics': metrics})
    
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    # Also verify JMeter existence
    jmeter_bin = os.path.join(JMETER_HOME, "bin", "jmeter.bat" if os.name == "nt" else "jmeter")
    jmeter_exists = os.path.exists(jmeter_bin)
    
    # Check for test case files
    test_cases = []
    if os.path.exists(TEST_CASES_DIR):
        test_cases = [f for f in os.listdir(TEST_CASES_DIR) if f.endswith('.jmx')]
    
    return jsonify({
        'status': 'ok',
        'jmeter_installed': jmeter_exists,
        'jmeter_path': jmeter_bin,
        'test_cases': test_cases,
        'test_cases_dir': TEST_CASES_DIR
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
