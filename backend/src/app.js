const express = require("express");
const connectDB = require("./config/database");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const policeRouter = require("./routes/Policeroute");
const reportRouter = require("./routes/ReportRoute");
const userRouter = require("./routes/UserRoute");
const adminRouter = require("./routes/AdminRoute");

app.use("/api/police", policeRouter);
app.use("/api/reports", reportRouter);
app.use("/api/users", userRouter);
app.use("/api/admin", adminRouter);

connectDB()
  .then(() => {
    console.log("Database connected successfully");
    app.listen(process.env.PORT, () => {
      console.log("Server listening on port 7777");
    });
  })
  .catch((err) => {
    console.error("Database not connected", err);
  });
