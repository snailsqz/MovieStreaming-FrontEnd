const express = require("express");
const axios = require("axios");
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

const app = express();
// const base_url =
//   "http://node57177-pawee-noderest.proen.app.ruk-com.cloud:11397";

const base_url = "https://moviestream-backend.onrender.com/";
app.set("views", path.join(__dirname, "/public/views"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));
app.locals.moviedata = "";
app.locals.checkLogin = "";
app.locals.checkFavorite = "";
app.locals.favoriteStatus = "";
app.locals.checkUserDupe = "";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + file.originalname);
  },
});
const upload = multer({ storage: storage });

const authenticateUser = (req, res, next) => {
  if (req.cookies && req.cookies.userSession) {
    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", async (req, res) => {
  try {
    app.locals.checkFavorite = false;
    app.locals.checkUserDupe = "";
    app.locals.checkLogin = "";
    app.locals.favoriteStatus = "";
    const response = await axios.get(base_url + "/movies");
    res.render("movies", { movies: response.data });
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.get("/movie/:id", async (req, res) => {
  try {
    const response = await axios.get(base_url + "/movie/" + req.params.id);
    // console.log(response.data);
    res.render("movie", { movie: response.data });
  } catch (err) {
    console.log(err);
    res.status(500).send("error");
  }
});

app.get("/create", (req, res) => {
  if (req.cookies && req.cookies.userSession == "admin") {
    res.render("create");
  } else if (req.cookies && req.cookies.userSession != "admin") {
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.post("/create", upload.single("imageFile"), async (req, res, next) => {
  if (req.cookies && req.cookies.userSession == "admin") {
    try {
      const data = {
        title: req.body.title,
        director: req.body.director,
        imageFile: req.file.filename,
      };
      await axios.post(base_url + "/movies", data);
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("error");
    }
  } else if (req.cookies && req.cookies.userSession != "admin") {
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.get("/movieupdate", async (req, res) => {
  if (req.cookies && req.cookies.userSession == "admin") {
    try {
      const response = await axios.get(base_url + "/movieupdate");
      res.render("movieupdate", { movies: response.data });
    } catch (err) {
      console.error(err);
      res.status(500).send("error");
    }
  } else if (req.cookies && req.cookies.userSession != "admin") {
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.get("/moviedelete", async (req, res) => {
  if (req.cookies && req.cookies.userSession == "admin") {
    try {
      const response = await axios.get(base_url + "/moviedelete");
      res.render("moviedelete", { movies: response.data });
    } catch (err) {
      console.error(err);
      res.status(500).send("error");
    }
  } else if (req.cookies && req.cookies.userSession != "admin") {
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.get("/update/:id", async (req, res) => {
  if (req.cookies && req.cookies.userSession == "admin") {
    try {
      const response = await axios.get(base_url + "/movie/" + req.params.id);
      res.render("update", { movies: response.data });
    } catch (err) {
      console.error(err);
      res.status(500).send("error");
    }
  } else if (req.cookies && req.cookies.userSession != "admin") {
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.post("/update/:id", async (req, res) => {
  if (req.cookies && req.cookies.userSession == "admin") {
    try {
      const data = { title: req.body.title, director: req.body.director };
      await axios.put(base_url + "/movie/" + req.params.id, data);
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("error");
    }
  } else if (req.cookies && req.cookies.userSession != "admin") {
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.get("/delete/:id", async (req, res) => {
  if (req.cookies && req.cookies.userSession == "admin") {
    try {
      await axios.delete(base_url + "/movie/" + req.params.id);
      res.redirect("/moviedelete");
    } catch (err) {
      console.error(err);
      res.status(500).send("error");
    }
  } else if (req.cookies && req.cookies.userSession != "admin") {
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      password: req.body.password,
    };
    const response = await axios.post(base_url + "/register", data);

    if (response.data.message == "al") {
      app.locals.checkUserDupe = "Already have this username";
      res.redirect("/register");
    } else res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.status(500).send("error");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      password: req.body.password,
    };
    const response = await axios.post(base_url + "/login/", data);
    if (response.data.message == true) {
      res.cookie("userSession", response.data.user.name, { httpOnly: true });
      console.log(response.data.user.name, "Login Successful");
      app.locals.moviedata = {
        user_id: response.data.user.user_id,
        userName: response.data.user.name,
        roles: response.data.user.roles,
      };
      app.locals.checkLogin = "";
      res.redirect("/");
    } else if (response.data.message == "User_not_found") {
      console.log("User Not Found");
      app.locals.checkLogin = "User not found";
      res.redirect("login");
    } else if (response.data.message == "Wrong_Password") {
      console.log("Wrong Password");
      app.locals.checkLogin = "Wrong Password";
      res.redirect("login");
    }
  } catch (err) {
    console.error(err);
    console.log("500");
  }
});

app.get("/favorite/:id", authenticateUser, async (req, res) => {
  app.locals.checkFavorite = "";
  app.locals.favoriteStatus = "";
  if (app.locals.moviedata.user_id == req.params.id) {
    try {
      const response = await axios.get(base_url + "/favorite/" + req.params.id);
      res.render("favorite", { movies: response.data });
    } catch (err) {
      console.log(err);
      res.status(500).send("error");
    }
  } else {
    res.redirect("/favorite/" + app.locals.moviedata.user_id);
  }
});

app.post("/favorite", authenticateUser, async (req, res) => {
  const data = {
    movie_id: req.body.movie_id,
    user_id: req.body.user_id,
  };

  const response = await axios.post(base_url + "/favorite/", data);

  if (response.data.message == "al") app.locals.checkFavorite = true;
  else app.locals.favoriteStatus = `Add to your favorite!`;

  res.redirect("/movie/" + req.body.movie_id);
});

app.get("/logout", (req, res) => {
  res.clearCookie("userSession");
  app.locals.moviedata = "";
  res.redirect("/");
});

app.listen(5500, () => {
  console.log("Server started on port 5500");
});
