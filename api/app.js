import createError from 'http-errors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import expressSession from "express-session";
import flash from "connect-flash";

import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import passport from 'passport';
const MongoStore = require("connect-mongo");

import dotenv from "dotenv";
dotenv.config()


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var app = express();
app.use(express.static(path.join(__dirname, 'public')));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(flash());

app.use(expressSession({
  resave : false,
  saveUninitialized : false,
  secret : process.env.SECRET_KEY,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL, // Your MongoDB Atlas connection URI
    ttl: 24 * 60 * 60, // = 1 day (optional)
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: "lax", // important for some browsers
    secure: process.env.NODE_ENV === "production", // true in production (only HTTPS)
  },
}))

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('trust proxy', 1); // Enable proxy support

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
