
# JMeter Performance Testing Backend

This backend service provides an API for running JMeter performance tests.

## Setup Instructions

1. Install Python 3.7+ if not already installed
2. Install Apache JMeter from https://jmeter.apache.org/download_jmeter.cgi
3. Place the JMeter installation in the `./jmeter` directory (or update the `JMETER_HOME` path in `jmeter_runner.py`)
4. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

## Running the Backend

```
python jmeter_runner.py
```

This will start the Flask server on port 5000.

## API Endpoints

### POST /api/run-test

Run a JMeter performance test.

#### Request Body:

```json
{
  "url": "https://example.com",
  "testType": "load",
  "users": 50,
  "duration": 30
}
```

#### Response:

```json
{
  "metrics": {
    "loadTime": [...],
    "latency": [...],
    "errorRate": [...],
    "requestsPerSecond": [...],
    "statusCodes": [...],
    "performanceScores": {...},
    "summary": {...}
  }
}
```

### GET /health

Health check endpoint.

#### Response:

```json
{
  "status": "ok"
}
```

## JMeter Test Cases

- Default test cases are created automatically in the `./test_cases` directory
- You can add custom test cases to the `./test_cases` directory with the following naming convention:
  - `{keyword}_web.jmx` for websites
  - `{keyword}_api.jmx` for API endpoints

The keyword is automatically extracted from the URL domain.
