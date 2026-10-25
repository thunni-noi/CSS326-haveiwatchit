import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from 'cors';
import { adminRoute, authRoute, showsRoute } from "./routes/routes.js";
import watchlistRoute from "./routes/watchlist.js";
import collectionsRoute from "./routes/collections.js";
import path from "path";
import accountRoutes from "./middleware/account.js";

dotenv.config();

const app = express();

// Use for testing loading screen or if you want app to be slow for some reason ig?
// app.use((req, res, next) => setTimeout(next, 500));

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5000",
    credentials: true,
}))
app.use(express.json());
app.use(cookieParser());

app.use("/images", express.static(path.join(path.resolve(), "images")));

app.use('/api/auth', authRoute);
app.use('/api/admin', adminRoute);
app.use('/api/shows', showsRoute);
app.use('/api/watchlist', watchlistRoute);
app.use('/api/collections', collectionsRoute);

app.use("/uploads", express.static(path.join(path.resolve(), "uploads"), {
    setHeaders: (res) => res.set("X-Content-Type-Options", "nosniff"),
}));
app.use("/api/account", accountRoutes);

// app.get("/", (req, res) => {
//     res.send("This is home page!")
// })

app.get("/", (req, res) => {
    res.send("This is haveiwatchit home api!")
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on  http://localhost:${PORT}`)
});
