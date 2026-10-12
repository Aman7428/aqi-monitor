# AQI Monitor — Air Quality Dashboard

A real-time air quality monitoring dashboard that displays the Air Quality Index (AQI), pollutant concentrations, and weather conditions. Built with React, TypeScript, Node.js, Express, and MongoDB, the application also supports historical AQI data and personalized email alerts based on user-defined thresholds and health-related preferences.

## Features

- **Live AQI Monitoring:** Displays the current Air Quality Index using air-pollution data from OpenWeatherMap.
- **Pollutant Tracking:** Presents measurements for PM2.5, PM10, ozone (O₃), carbon monoxide (CO), sulfur dioxide (SO₂), and additional environmental parameters.
- **Weather Information:** Displays temperature and humidity alongside air-quality readings.
- **Environmental Status Classification:** Categorizes readings into good, moderate, unhealthy, and hazardous levels using configurable thresholds.
- **Historical AQI Data:** Retrieves stored readings and calculates daily average AQI values for historical analysis.
- **Personalized Email Alerts:** Allows users to subscribe with a configurable AQI threshold.
- **Health-Aware Recommendations:** Supports optional health-related preferences, including asthma, allergies, respiratory conditions, other conditions, and severity, to tailor alert recommendations.
- **Automated Alert Checks:** Periodically checks current AQI data and sends eligible email notifications.
- **Interactive Dashboard UI:** Features responsive layouts, pollutant cards, color-coded indicators, icons, and a dark glassmorphism-inspired design.

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui and Radix UI components
- Lucide React icons
- Recharts

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- Axios
- Nodemailer
- dotenv

### External Services
- OpenWeatherMap API for air-pollution and weather data
- SMTP email service for subscription confirmations and AQI alerts

## Architecture

The application follows a frontend-backend architecture:

1. The React frontend requests current environmental data from the Express API.
2. The backend retrieves air-pollution and weather information from OpenWeatherMap.
3. AQI values are calculated using pollutant-specific breakpoints and linear interpolation, with a fallback comparison against the provider's AQI scale.
4. The backend stores readings in MongoDB for historical analysis.
5. The alert service checks active email subscriptions and sends notifications when their configured thresholds are met.

## Project Structure

```text
aqi-monitor/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AQIDisplay.tsx
│   │   │   ├── SensorCard.tsx
│   │   │   ├── AQIChart.tsx
│   │   │   ├── AQIPredictionChart.tsx
│   │   │   ├── AlertSubscription.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Index.tsx
│   │   │   └── NotFound.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── weatherController.js
│   │   └── emailController.js
│   ├── models/
│   │   ├── SensorData.js
│   │   └── EmailSubscription.js
│   ├── routes/
│   │   ├── weatherRoutes.js
│   │   └── emailRoutes.js
│   ├── utils/
│   │   └── aqiCalculator.js
│   ├── server.js
│   └── package.json
│
└── README.md
```

*The tree highlights the main files reviewed; adjust filenames if your actual repository differs.*

## Getting Started

### Prerequisites

Install or obtain the following:

- Node.js and npm
- MongoDB database, local or hosted
- OpenWeatherMap API key
- SMTP credentials for sending email notifications

### 1. Clone the Repository

```bash
git clone https://github.com/Aman7428/aqi-monitor.git
cd aqi-monitor
```

### 2. Configure the Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string

OPENWEATHERMAP_API_KEY=your_openweathermap_api_key

CITY_NAME=Delhi,IN
CITY_LAT=28.7041
CITY_LON=77.1025

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM=your_email@example.com
```

Replace the placeholder values with your own credentials. For Gmail, use an appropriate app password where required rather than your regular account password.

Start the backend:

```bash
npm run dev
```

The backend runs on port `5001` by default.

### 3. Configure the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will display the local URL where the frontend is available.

**Important:** The current frontend code requests the backend at `http://localhost:5001`. The backend CORS configuration also permits `http://localhost:8080`. Ensure that your Vite development server uses the permitted origin, or update the backend CORS configuration to match the frontend URL.

## API Endpoints

The backend exposes the following routes.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Checks whether the backend API is running |
| GET | `/api/weather` | Retrieves current weather and air-quality data and stores a reading |
| GET | `/api/weather/historical` | Retrieves historical AQI readings grouped by date |
| POST | `/api/alerts/subscribe` | Creates or updates an email alert subscription |
| POST | `/api/alerts/unsubscribe` | Deactivates an email alert subscription |
| GET | `/api/alerts/test-alert` | Manually triggers the alert-checking process |

### Subscribe to Alerts

Example request:

```http
POST /api/alerts/subscribe
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "threshold": 100,
  "healthConditions": {
    "hasAsthma": false,
    "hasAllergies": true,
    "hasRespiratoryConditions": false,
    "otherConditions": "",
    "conditionSeverity": "Mild"
  }
}
```

The subscription can include a preferred AQI threshold and optional health-related preferences for personalized recommendations.

### Unsubscribe from Alerts

Send a POST request to `/api/alerts/unsubscribe` with the email address in the JSON request body.

## AQI Calculation

The backend calculates pollutant-specific AQI sub-indices using breakpoint-based linear interpolation. The overall custom AQI is derived from the highest applicable sub-index among the supported pollutants.

The controller also compares this value with a value mapped from OpenWeatherMap's AQI scale and may use the mapped value when the difference exceeds a configured threshold.

AQI readings and environmental values depend on the external data provider, configured calculation logic, and available pollutant measurements. The implementation should not be treated as a certified regulatory monitoring system.

## Data Storage and Historical Analysis

MongoDB stores environmental readings with timestamps. The historical endpoint retrieves readings from the previous 30 days and groups them by date to calculate daily average AQI values.

The current dashboard polls the weather endpoint every three seconds. Consequently, database snapshots are created when those requests are processed; this is request-driven collection rather than independent continuous sampling from a physical sensor.

## Email Alert Workflow

1. A user enters an email address and selects an AQI threshold.
2. Optional health-related preferences can be provided to customize recommendations.
3. The backend creates or reactivates the subscription.
4. The alert checker reads the latest stored AQI value.
5. Eligible active subscribers receive email notifications when the AQI meets their configured threshold.
6. The backend tracks the last notification time to limit repeated alerts.

The backend checks alerts periodically and also exposes a manual testing endpoint.

## Current Scope and Future Improvements

Potential improvements include:

- Enable and integrate historical AQI visualizations into the main dashboard.
- Complete and integrate AQI prediction functionality.
- Make the backend URL configurable through environment-based frontend settings.
- Add stronger request validation, rate limiting, and protected administrative endpoints.
- Improve the collection strategy to avoid unnecessary database writes from frequent polling.
- Add automated tests for AQI calculations, API routes, and email alert logic.
- Deploy the frontend and backend with production-ready configuration.

## Security Notes

- Keep API keys, database credentials, and SMTP passwords out of source control.
- Add `.env` files to `.gitignore` and provide placeholder values in example configuration files.
- Treat health-related subscription details as sensitive information and protect access to stored data.
- Review CORS, email endpoints, input validation, and SMTP TLS settings before public deployment.
- The manual alert-testing endpoint should be protected or disabled in production.

## License

No license has been specified yet. Add a `LICENSE` file if you intend to publish the project under an open-source license.
