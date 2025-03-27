
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
JMETER_HOME = "C:/Jmeter/apache-jmeter-5.6.3/bin"  # Relative path to JMeter installation
TEST_CASES_DIR = "C:/Z_Performance/backend/test_cases/"  # Directory containing JMeter test cases
RESULTS_DIR = "C:/Z_Performance/backend/results/"  # Directory to store test results

# Ensure directories exist
os.makedirs(TEST_CASES_DIR, exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)

def extract_keyword_from_url(url):
    """Extract a relevant keyword from the URL to match with test cases."""
    parsed_url = urlparse(url)
    domain = parsed_url.netloc
    
    # Extract domain without TLD
    domain_parts = domain.split('.')
    if len(domain_parts) > 1:
        keyword = domain_parts[-2]  # Example: from 'www.example.com' take 'example'
    else:
        keyword = domain
    
    # For API endpoints, include part of the path
    if '/api/' in url or parsed_url.path.endswith('.json'):
        is_api = True
        # Include first path segment after /api/ if it exists
        path_parts = parsed_url.path.split('/')
        if 'api' in path_parts and len(path_parts) > path_parts.index('api') + 1:
            keyword += f"_api_{path_parts[path_parts.index('api') + 1]}"
        else:
            keyword += "_api"
    else:
        is_api = False
    
    logger.info(f"Extracted keyword '{keyword}' from URL {url}, API: {is_api}")
    return keyword, is_api

def find_test_case(keyword, is_api):
    """Find a matching JMeter test case based on the keyword."""
    if not os.path.exists(TEST_CASES_DIR):
        logger.error(f"Test cases directory not found: {TEST_CASES_DIR}")
        return None
    
    # First look for exact keyword match
    test_type_suffix = "_api" if is_api else "_web"
    exact_match = f"{keyword}{test_type_suffix}.jmx"
    exact_path = os.path.join(TEST_CASES_DIR, exact_match)
    
    if os.path.exists(exact_path):
        logger.info(f"Found exact test case match: {exact_path}")
        return exact_path
    
    # Use default test cases as fallback
    default_test = "apache.jmx" if is_api else "apache.jmx"
    default_path = os.path.join(TEST_CASES_DIR, default_test)
    
    if os.path.exists(default_path):
        logger.info(f"Using default test case: {default_path}")
        return default_path
    
    logger.error(f"No suitable test case found for keyword {keyword}")
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
    
    cmd = [
        jmeter_bin,
        "-n",  # Non-GUI mode
        "-t", test_case_path,  # Test case file
        "-l", result_csv,  # Results file
        "-e",  # Generate report
        "-o", report_dir,  # Report output directory
        "-Jurl=" + url,  # Pass URL as parameter
        "-Jusers=" + str(users),  # Pass number of users
        "-Jduration=" + str(duration)  # Pass duration
    ]
    
    logger.info(f"Executing JMeter command: {' '.join(cmd)}")
    
    try:
        # Execute JMeter
        process = subprocess.Popen(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            universal_newlines=True
        )
        stdout, stderr = process.communicate(timeout=max(duration * 2, 60))  # Allow double the test duration or minimum 60 seconds
        
        if process.returncode != 0:
            logger.error(f"JMeter execution failed: {stderr}")
            return None, None, stderr
        
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
        
        # Read CSV file
        with open(result_csv, 'r') as file:
            reader = csv.DictReader(file)
            rows = list(reader)
            
            if not rows:
                logger.warning("Results CSV is empty")
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
                    continue
                
                # Extract data
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
                rps = total_requests / test_duration
            else:
                rps = 0
            
            # Format time series data - standardize to 20 data points for charts
            # Sort timestamps and create time buckets
            if timestamps:
                unique_timestamps = sorted(set(timestamps))
                start_time = min(unique_timestamps)
                
                # Create time series with 20 data points
                time_points = 20
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
                {"name": code, "value": (count / total_requests) * 100}
                for code, count in status_codes.items()
            ]
            
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
        
        # Extract keyword from URL and determine if it's an API
        keyword, is_api = extract_keyword_from_url(url)
        
        # Find matching test case
        test_case_path = find_test_case(keyword, is_api)
        if not test_case_path:
            # Create default test cases if they don't exist
            create_default_test_cases()
            test_case_path = find_test_case(keyword, is_api)
            
            if not test_case_path:
                return jsonify({'error': 'No suitable JMeter test case found'}), 404
        
        # Run JMeter test
        result_csv, report_dir, test_id = run_jmeter_test(test_case_path, url, users, duration)
        
        if not result_csv or not test_id:
            return jsonify({'error': 'JMeter test execution failed'}), 500
        
        # Parse results
        metrics = parse_results(result_csv, test_id)
        
        if not metrics:
            return jsonify({'error': 'Failed to parse test results'}), 500
        
        return jsonify({'metrics': metrics})
    
    except Exception as e:
        logger.error(f"API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def create_default_test_cases():
    """Create default JMeter test cases if they don't exist."""
    default_web_path = os.path.join(TEST_CASES_DIR, "default_web.jmx")
    default_api_path = os.path.join(TEST_CASES_DIR, "default_api.jmx")
    
    # Create default web test case
    if not os.path.exists(default_web_path):
        with open(default_web_path, 'w') as f:
            f.write(DEFAULT_WEB_JMX)
        logger.info(f"Created default web test case: {default_web_path}")
    
    # Create default API test case
    if not os.path.exists(default_api_path):
        with open(default_api_path, 'w') as f:
            f.write(DEFAULT_API_JMX)
        logger.info(f"Created default API test case: {default_api_path}")

# Default JMeter test templates
DEFAULT_WEB_JMX = """<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.4.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="Web Test Plan" enabled="true">
      <stringProp name="TestPlan.comments"></stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments">
          <elementProp name="url" elementType="Argument">
            <stringProp name="Argument.name">url</stringProp>
            <stringProp name="Argument.value">${__P(url,https://example.com)}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="users" elementType="Argument">
            <stringProp name="Argument.name">users</stringProp>
            <stringProp name="Argument.value">${__P(users,10)}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="duration" elementType="Argument">
            <stringProp name="Argument.name">duration</stringProp>
            <stringProp name="Argument.value">${__P(duration,30)}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="Web Thread Group" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <intProp name="LoopController.loops">-1</intProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">${users}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">5</stringProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.duration">${duration}</stringProp>
        <stringProp name="ThreadGroup.delay"></stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="HTTP Request" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain"></stringProp>
          <stringProp name="HTTPSampler.port"></stringProp>
          <stringProp name="HTTPSampler.protocol"></stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path">${url}</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
          <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
          <stringProp name="HTTPSampler.connect_timeout">5000</stringProp>
          <stringProp name="HTTPSampler.response_timeout">30000</stringProp>
        </HTTPSamplerProxy>
        <hashTree>
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager" enabled="true">
            <collectionProp name="HeaderManager.headers">
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">User-Agent</stringProp>
                <stringProp name="Header.value">Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36</stringProp>
              </elementProp>
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Accept</stringProp>
                <stringProp name="Header.value">text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8</stringProp>
              </elementProp>
            </collectionProp>
          </HeaderManager>
          <hashTree/>
        </hashTree>
        <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="View Results Tree" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <message>true</message>
              <threadName>true</threadName>
              <dataType>true</dataType>
              <encoding>false</encoding>
              <assertions>true</assertions>
              <subresults>true</subresults>
              <responseData>false</responseData>
              <samplerData>false</samplerData>
              <xml>false</xml>
              <fieldNames>true</fieldNames>
              <responseHeaders>false</responseHeaders>
              <requestHeaders>false</requestHeaders>
              <responseDataOnError>false</responseDataOnError>
              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
              <assertionsResultsToSave>0</assertionsResultsToSave>
              <bytes>true</bytes>
              <sentBytes>true</sentBytes>
              <url>true</url>
              <threadCounts>true</threadCounts>
              <idleTime>true</idleTime>
              <connectTime>true</connectTime>
            </value>
          </objProp>
          <stringProp name="filename"></stringProp>
        </ResultCollector>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
"""

DEFAULT_API_JMX = """<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.4.3">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="API Test Plan" enabled="true">
      <stringProp name="TestPlan.comments"></stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments">
          <elementProp name="url" elementType="Argument">
            <stringProp name="Argument.name">url</stringProp>
            <stringProp name="Argument.value">${__P(url,https://jsonplaceholder.typicode.com/posts)}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="users" elementType="Argument">
            <stringProp name="Argument.name">users</stringProp>
            <stringProp name="Argument.value">${__P(users,10)}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
          <elementProp name="duration" elementType="Argument">
            <stringProp name="Argument.name">duration</stringProp>
            <stringProp name="Argument.value">${__P(duration,30)}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="API Thread Group" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControlPanel" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <intProp name="LoopController.loops">-1</intProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">${users}</stringProp>
        <stringProp name="ThreadGroup.ramp_time">5</stringProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.duration">${duration}</stringProp>
        <stringProp name="ThreadGroup.delay"></stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="API Request" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="HTTPArgumentsPanel" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain"></stringProp>
          <stringProp name="HTTPSampler.port"></stringProp>
          <stringProp name="HTTPSampler.protocol"></stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path">${url}</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
          <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
          <stringProp name="HTTPSampler.connect_timeout">5000</stringProp>
          <stringProp name="HTTPSampler.response_timeout">30000</stringProp>
        </HTTPSamplerProxy>
        <hashTree>
          <HeaderManager guiclass="HeaderPanel" testclass="HeaderManager" testname="HTTP Header Manager" enabled="true">
            <collectionProp name="HeaderManager.headers">
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Content-Type</stringProp>
                <stringProp name="Header.value">application/json</stringProp>
              </elementProp>
              <elementProp name="" elementType="Header">
                <stringProp name="Header.name">Accept</stringProp>
                <stringProp name="Header.value">application/json</stringProp>
              </elementProp>
            </collectionProp>
          </HeaderManager>
          <hashTree/>
        </hashTree>
        <ResultCollector guiclass="ViewResultsFullVisualizer" testclass="ResultCollector" testname="View Results Tree" enabled="true">
          <boolProp name="ResultCollector.error_logging">false</boolProp>
          <objProp>
            <name>saveConfig</name>
            <value class="SampleSaveConfiguration">
              <time>true</time>
              <latency>true</latency>
              <timestamp>true</timestamp>
              <success>true</success>
              <label>true</label>
              <code>true</code>
              <message>true</message>
              <threadName>true</threadName>
              <dataType>true</dataType>
              <encoding>false</encoding>
              <assertions>true</assertions>
              <subresults>true</subresults>
              <responseData>false</responseData>
              <samplerData>false</samplerData>
              <xml>false</xml>
              <fieldNames>true</fieldNames>
              <responseHeaders>false</responseHeaders>
              <requestHeaders>false</requestHeaders>
              <responseDataOnError>false</responseDataOnError>
              <saveAssertionResultsFailureMessage>true</saveAssertionResultsFailureMessage>
              <assertionsResultsToSave>0</assertionsResultsToSave>
              <bytes>true</bytes>
              <sentBytes>true</sentBytes>
              <url>true</url>
              <threadCounts>true</threadCounts>
              <idleTime>true</idleTime>
              <connectTime>true</connectTime>
            </value>
          </objProp>
          <stringProp name="filename"></stringProp>
        </ResultCollector>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
"""

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
