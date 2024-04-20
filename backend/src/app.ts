import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import cors from "cors"
import * as redis from "redis"

import authRoute from "./routes/auth";
import examRoute from "./routes/exam";
import quizRoute from "./routes/quiz";
import reportRoute from "./routes/report";
import userRoute from "./routes/user";
import favQuestionRoute from "./routes/favQuestion";
import ProjectError from "./helper/error";
import { ReturnResponse } from "./utils/interfaces";
import clearBlacklistedTokenScheduler from "./utils/clearBlacklistedTokenScheduler";

const app = express();

app.use(cors({origin:`http://${process.env.CORS_ORIGIN_URL}`,credentials:true}))

const connectionString = process.env.CONNECTION_STRING || "";


const port = process.env.PORT;

const REDIS_PORT: number = 6379;
let redisClient;

app.use(express.json());
declare global {
  namespace Express {
    interface Request {
      userId: String;
    }
  }
}

//Redirect /auth
app.use("/auth", authRoute);

//Redirect /exam
app.use("/exam", examRoute);

//Redirect /quiz
app.use("/quiz", quizRoute);

//Redirect /report
app.use("/report", reportRoute);

//Redirect /user to userRoute
app.use("/user", userRoute);

//Redirect /favQuestion to favQuestionRoute
app.use("/favquestion",favQuestionRoute);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).send("Server is working!");
});

app.use(
  (err: ProjectError, req: Request, res: Response, next: NextFunction) => {
    // email to corresponding email
    // logger for err
    let message: String;
    let statusCode: number;

    if (!!err.statusCode && err.statusCode < 500) {
      message = err.message;
      statusCode = err.statusCode;
    } else {
      message = "Something went wrong please try after sometime!";
      statusCode = 500;
    }

    let resp: ReturnResponse = { status: "error", message, data: {} };
    if (!!err.data) {
      resp.data = err.data;
    }

    console.log(err.statusCode, err.message);
    res.status(statusCode).send(resp);
  }
);

clearBlacklistedTokenScheduler;

(async () => {
  try {
    await mongoose.connect(connectionString);
    app.listen(port, () => {
      console.log("Server Connected");
    });
  } catch (error) {
    console.log(error);
  }
})();

// Redis connection
(async () => {
  try {
    redisClient = redis.createClient();

    redisClient.on("error", (error) => console.error(`Redis Error : ${error}`));

    console.log("Connected to Redis server.");
} catch (error) {
    console.error("Error occurred while trying to connect to Redis:", error);
}
})();