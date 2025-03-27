
# Performance Testing Application

A web application for running performance tests on websites and API endpoints using Apache JMeter.

## Features

- Test websites and API endpoints
- Configure test parameters (users, duration, test type)
- Visualize test results with graphs and charts
- View detailed performance metrics

## Setup Instructions

### Frontend (React)

1. Install Node.js dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

### Backend (Python & JMeter)

The application uses a Python backend with Apache JMeter for real performance testing.

1. Install Python 3.7+ if not already installed
2. Download and install Apache JMeter from https://jmeter.apache.org/download_jmeter.cgi
3. Navigate to the backend directory:
   ```
   cd backend
   ```
4. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```
5. Place the JMeter installation in the `./jmeter` directory (or update the `JMETER_HOME` path in `jmeter_runner.py`)
6. Start the backend server:
   ```
   python jmeter_runner.py
   ```

## Usage

1. Enter a website URL or API endpoint
2. Configure test parameters (users, duration, test type)
3. Click "Start Test" to begin the performance test
4. View the results in the graphs and charts below

## Notes

- If the JMeter backend is not available, the application will fall back to a simulation mode
- For best results, run JMeter on a dedicated machine with sufficient resources
- The frontend application communicates with the backend via HTTP API
