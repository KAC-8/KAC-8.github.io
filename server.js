const path = require("path");
const express = require("express");
const rateLimit = require("express-rate-limit");

const app = express();
const rootDir = __dirname;
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(rootDir, "views"));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.use(
  "/assets",
  express.static(path.join(rootDir, "assets"), { maxAge: "1d", immutable: true })
);

app.get("/", (req, res) => {
  res.sendFile(path.join(rootDir, "index.html"));
});

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(rootDir, "favicon.ico"));
});

app.get("/robots.txt", (req, res) => {
  res.sendFile(path.join(rootDir, "robots.txt"));
});

app.get("/placeholder.svg", (req, res) => {
  res.sendFile(path.join(rootDir, "placeholder.svg"));
});

app.get("/terms", (req, res) => {
  res.render("terms");
});

app.get("/privacy", (req, res) => {
  res.render("privacy");
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`KAC8 dashboard server running on port ${PORT}`);
});
