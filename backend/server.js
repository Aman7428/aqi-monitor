import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import { checkAndSendAlerts } from "./controllers/emailController.js";

dotenv.config();

const app = express();

// middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:8080", // change if your frontend runs elsewhere
  })
);

// DB connection
connectDB();

// routes
app.use("/api/weather", weatherRoutes); // / -> current AQI, /historical -> last 30 days
app.use("/api/alerts", emailRoutes);    // subscribe/unsubscribe/test-alert

app.get("/", (req, res) => {
  res.send("API is running...");
});

// periodic email alert checks (uses SensorData saved by weatherController)
const ALERT_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutes for testing; later use 15 * 60 * 1000

console.log(
  `Setting up alert check interval: ${ALERT_CHECK_INTERVAL / 60000} minutes`
);

setInterval(async () => {
  console.log("Running scheduled alert check...");
  try {
    const count = await checkAndSendAlerts();
    console.log(`Alert check complete: Sent ${count || 0} notifications`);
  } catch (error) {
    console.error("Alert Check Error:", error);
  }
}, ALERT_CHECK_INTERVAL);

// run one check on startup
(async () => {
  try {
    console.log("Running initial alert check...");
    const count = await checkAndSendAlerts();
    console.log(`Initial alert check complete: Sent ${count || 0} notifications`);
  } catch (error) {
    console.error("Initial Alert Check Error:", error);
  }
})();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
