const express = require("express");
const axios = require("axios");
const app = express();
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const session = require("express-session");

const base_url = "https://moviestream-backend.onrender.com";

app.set("views", path.join(__dirname, "/public/views"));
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));
app.set("trust proxy", 1);
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
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
    req.session.checkFavorite = false;
    req.session.checkUserDupe = "";
    req.session.checkLogin = "";
    req.session.favoriteStatus = "";
    console.log(req.session.movieData, "moviedata");
    const response = await axios.get(base_url + "/movies");

    if (!req.session.movieData) {
      req.session.movieData = {
        userName: "",
        roles: "",
      };
    }

    res.render("movies", {
      movies: response.data,
      moviedata: req.session.movieData,
    });
  } catch (err) {
    console.error(err);
    res.send("error");
    res.redirect("/");
  }
});

app.get("/movie/:id", async (req, res) => {
  try {
    const response = await axios.get(base_url + "/movie/" + req.params.id);
    // console.log(response.data);
    res.render("movie", {
      movie: response.data,
      moviedata: req.session.movieData,
      favoriteStatus: req.session.favoriteStatus,
    });
  } catch (err) {
    console.log(err);
    res.send("error");
    res.redirect("/");
  }
});

app.get("/create", (req, res) => {
  if (req.cookies && req.cookies.userSession == "admin") {
    res.render("create", { moviedata: req.session.movieData });
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
      res.send("error");
      res.redirect("/");
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
      res.render("movieupdate", {
        movies: response.data,
        moviedata: req.session.movieData,
      });
    } catch (err) {
      console.error(err);
      res.send("error");
      res.redirect("/");
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
      res.render("moviedelete", {
        movies: response.data,
        moviedata: req.session.movieData,
      });
    } catch (err) {
      console.error(err);
      res.send("error");
      res.redirect("/");
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
      res.render("update", {
        movies: response.data,
        moviedata: req.session.movieData,
      });
    } catch (err) {
      console.error(err);
      res.send("error");
      res.redirect("/");
    }
  } else if (req.cookies && req.cookies.userSession != "admin") {
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.post("/update/:id", upload.single("imageFile"), async (req, res) => {
  if (req.cookies && req.cookies.userSession == "admin") {
    try {
      let data = {
        title: req.body.title,
        director: req.body.director,
      };
      if (req.file) data.imageFile = req.file.filename;
      console.log(data);
      await axios.put(base_url + "/movie/" + req.params.id, data);
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.send("error");
      res.redirect("/");
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
      res.send("error");
      res.redirect("/");
    }
  } else if (req.cookies && req.cookies.userSession != "admin") {
    res.redirect("/");
  } else {
    res.redirect("/login");
  }
});

app.get("/register", (req, res) => {
  req.session.checkLogin = "";
  console.log("yes");
  res.render("register", { checkUserDupe: req.session.checkUserDupe });
});

app.post("/register", async (req, res) => {
  try {
    const data = {
      name: req.body.name,
      password: req.body.password,
    };
    const response = await axios.post(base_url + "/register", data);

    if (response.data.message == "al") {
      //app.locals.checkUserDupe = "Already have this username";
      req.session.checkUserDupe = "Already have this username";
      res.redirect("/register");
    } else {
      req.session.checkUserDupe = "";
      res.redirect("/login");
    }
  } catch (err) {
    console.error(err);
    res.send("error");
    res.redirect("/");
  }
});

app.get("/login", (req, res) => {
  req.session.checkUserDupe = "";
  res.render("login", { checkLogin: req.session.checkLogin });
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
      req.session.movieData = {
        user_id: response.data.user.user_id,
        userName: response.data.user.name,
        roles: response.data.user.roles,
      };
      req.session.checkLogin = "";
      console.log(req.session.movieData);
      res.redirect("/");
    } else if (response.data.message == "User_not_found") {
      console.log("User Not Found");
      req.session.checkLogin = "User not found";
      res.redirect("login");
    } else if (response.data.message == "Wrong_Password") {
      console.log("Wrong Password");
      req.session.checkLogin = "Wrong Password";
      res.redirect("login");
    }
  } catch (err) {
    console.error(err);
    res.send("error");
    res.redirect("/");
  }
});

app.get("/deleteuser/:id", authenticateUser, async (req, res) => {
  try {
    await axios.delete(base_url + "/user/" + req.params.id);
    req.session.movieData = "";
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("error");
    res.redirect("/");
  }
});

app.get("/user/:id", async (req, res) => {
  try {
    const response = await axios.get(base_url + "/user/" + req.params.id);
    res.render("updateuser", {
      users: response.data,
      moviedata: req.session.movieData,
    });
  } catch (err) {
    console.error(err);
    res.send("error");
    res.redirect("/");
  }
});

app.post("/user/:id", authenticateUser, async (req, res) => {
  try {
    const data = { name: req.body.name, password: req.body.password };
    await axios.put(base_url + "/user/" + req.params.id, data);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("error");
    res.redirect("/");
  }
});

app.get("/delete/:id", async (req, res) => {
  try {
    await axios.delete(base_url + "/movie/" + req.params.id);
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.send("error");
    res.redirect("/");
  }
});

app.get("/favorite/:id", authenticateUser, async (req, res) => {
  req.session.checkFavorite = "";
  if (req.session.movieData.user_id == req.params.id) {
    try {
      const response = await axios.get(
        base_url + "/favorite/" + req.session.movieData.user_id
      );
      res.render("favorite", {
        movies: response.data,
        moviedata: req.session.movieData,
        favoriteStatus: req.session.favoriteStatus,
      });
    } catch (err) {
      console.log(err);
      res.send("error");
      res.redirect("/");
    }
  } else {
    res.redirect("/favorite/" + req.session.movieData.user_id);
  }
});

app.post("/favorite", authenticateUser, async (req, res) => {
  const data = {
    movie_id: req.body.movie_id,
    user_id: req.body.user_id,
  };

  const response = await axios.post(base_url + "/favorite/", data);
  if (response.data.message == "al") {
    console.log(data);
    try {
      await axios({
        method: "delete",
        url: base_url + "/favorite/",
        data: data,
      });
      req.session.favoriteStatus = `Unfavorite this movie!`;
    } catch (err) {
      console.error(err);
      res.send("error");
      res.redirect("/");
    }
  } else req.session.favoriteStatus = `Add to your favorite!`;

  res.redirect("/movie/" + req.body.movie_id);
});

app.get("/delete/:id", async (req, res) => {
  try {
    await axios.delete(base_url + "/movie/" + req.params.id);
    res.redirect("/moviedelete");
  } catch (err) {
    console.error(err);
    res.send("error");
    res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("userSession");
  req.session.movieData = null;
  res.redirect("/");
});

const port = 5500;
app.listen(port, () => {
  console.log(`Listening on port http://localhost:${port}...`);
});
