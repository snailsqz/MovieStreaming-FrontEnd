const express = require("express");
const axios = require("axios");
const app = express();
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const session = require("express-session");

const base_url = "http://localhost:3000";

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

const onlyAdmin = (req, res, next) => {
  if (req.session.movieData.roles == "Admin") {
    next();
  } else {
    res.redirect("/");
  }
};

app.get("/", async (req, res) => {
  try {
    req.session.checkUserDupe = "";
    req.session.checkLogin = "";
    req.session.favoriteStatus2 = "";
    console.log(req.session.movieData, "moviedata");
    const response = await axios.get(base_url + "/movies");

    if (!req.session.movieData) {
      req.session.movieData = {
        userName: "",
        roles: "",
        profilePicture: "noimage.jpg",
      };
    }

    res.render("index", {
      movies: response.data,
      moviedata: req.session.movieData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /");
    res.redirect("/");
  }
});

app.get("/movie/:id", async (req, res) => {
  try {
    if (req.session.movieData.userName != "") {
      const data = {
        user_id: req.session.movieData.user_id,
      };
      const response = await axios.post(
        base_url + "/movie/" + req.params.id,
        data
      );
      req.session.favoriteStatus = response.data.message;
      console.log(req.session.favoriteStatus, "favoriteStatus");
    }
    const response2 = await axios.get(base_url + "/movie/" + req.params.id);
    req.session.movieid = response2.data[1].movie_id;
    console.log(response2.data[0]);
    res.render("movie", {
      movie: response2.data[1],
      moviedata: req.session.movieData,
      favoriteStatus: req.session.favoriteStatus,
      reviewData: response2.data[0],
      userData: response2.data[2],
      mycommentID: req.session.movieData.user_id,
      favoriteStatus2: req.session.favoriteStatus2,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("error in /movie/:id");
    res.redirect("/");
  }
});

app.post("/movie/:id", async (req, res) => {
  try {
    const data = {
      movie_id: req.params.id,
      user_id: req.session.movieData.user_id,
      score: req.body.score,
      comment: req.body.comment,
    };
    console.log(req.body.score, "score");
    await axios.post(base_url + "/review/" + req.params.id, data);
    res.redirect("/movie/" + req.params.id);
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /comment");
    res.redirect("/");
  }
});

app.get("/create", onlyAdmin, (req, res) => {
  try {
    res.render("create", { moviedata: req.session.movieData });
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /create");
    res.redirect("/");
  }
});

app.post(
  "/create",
  onlyAdmin,
  upload.single("imageFile"),
  async (req, res, next) => {
    try {
      const data = {
        title: req.body.title,
        director: req.body.director,
        type: req.body.type,
        desc: req.body.desc,
        release_date: req.body.release_date,
        rating: req.body.rating,
        genre: req.body.genre,
        running_time: req.body.running_time,
      };
      if (req.file) data.imageFile = req.file.filename;
      if (req.body.teaser_url) data.teaser_url = req.body.teaser_url;
      await axios.post(base_url + "/movies", data);
      res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("error in /create");
      res.redirect("/");
    }
  }
);

app.get("/update/:id", onlyAdmin, async (req, res) => {
  try {
    const response = await axios.get(base_url + "/movie/" + req.params.id);
    res.render("update", {
      movies: response.data[1],
      moviedata: req.session.movieData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /update/:id");
    res.redirect("/");
  }
});

app.post(
  "/update/:id",
  onlyAdmin,
  upload.single("imageFile"),
  async (req, res) => {
    try {
      let data = {
        title: req.body.title,
        director: req.body.director,
        type: req.body.type,
        teaser_url: req.body.teaser_url,
        release_date: req.body.release_date,
        rating: req.body.rating,
        genre: req.body.genre,
        running_time: req.body.running_time,
      };
      if (req.desc) data.desc = req.body.desc;
      if (req.file) data.imageFile = req.file.filename;
      console.log(data);
      await axios.put(base_url + "/movie/" + req.params.id, data);
      res.redirect("/movies");
    } catch (err) {
      console.error(err);
      res.status(500).send("error in /update/:id");
      res.redirect("/");
    }
  }
);

app.get("/delete/:id", onlyAdmin, async (req, res) => {
  try {
    await axios.delete(base_url + "/movie/" + req.params.id);
    res.redirect("/movies");
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /delete/:id");
    res.redirect("/");
  }
});

app.get("/register", (req, res) => {
  try {
    req.session.checkLogin = "";
    console.log("yes");
    res.render("register", { checkUserDupe: req.session.checkUserDupe });
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /register");
    res.redirect("/");
  }
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
    res.status(500).send("error in /register");
    res.redirect("/");
  }
});

app.get("/login", (req, res) => {
  try {
    req.session.checkUserDupe = "";
    res.render("login", { checkLogin: req.session.checkLogin });
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /login");
    res.redirect("/");
  }
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
        profilePicture: response.data.user.profilePicture,
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
    res.status(500).send("error in /login");
    res.redirect("/");
  }
});

app.get("/deleteuser/:id", authenticateUser, async (req, res) => {
  try {
    await axios.delete(base_url + "/user/" + req.params.id);
    if (req.session.movieData.roles == "Admin") res.redirect("/users");
    else {
      req.session.movieData = "";
      res.redirect("/");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /deleteuser/:id");
    res.redirect("/");
  }
});

app.get("/user/:id", authenticateUser, async (req, res) => {
  try {
    const response = await axios.get(base_url + "/user/" + req.params.id);
    res.render("updateuser", {
      users: response.data,
      moviedata: req.session.movieData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /user/:id");
    res.redirect("/");
  }
});

app.post(
  "/user/:id",
  authenticateUser,
  upload.single("imageFile"),
  async (req, res) => {
    try {
      const data = { name: req.body.name, password: req.body.password };
      if (req.file) data.profilePicture = req.file.filename;
      await axios.put(base_url + "/user/" + req.params.id, data);
      if (req.file) req.session.movieData.profilePicture = req.file.filename;
      if (req.session.movieData.roles == "Admin") res.redirect("/users");
      else res.redirect("/");
    } catch (err) {
      console.error(err);
      res.status(500).send("error in /user/:id");
      res.redirect("/");
    }
  }
);

app.get("/admin/:id", onlyAdmin, async (req, res) => {
  try {
    await axios.put(base_url + "/admin/" + req.params.id);
    res.redirect("/users");
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /admin/:id");
    res.redirect("/");
  }
});

app.get("/favorite/:id", authenticateUser, async (req, res) => {
  req.session.favoriteStatus2 = "";
  if (req.session.movieData.user_id == req.params.id) {
    try {
      const response = await axios.get(
        base_url + "/favorite/" + req.session.movieData.user_id
      );
      res.render("favorite", {
        movies: response.data,
        moviedata: req.session.movieData,
      });
    } catch (err) {
      console.log(err);
      res.status(500).send("error in /favorite/:id");
      res.redirect("/");
    }
  } else {
    res.redirect("/favorite/" + req.session.movieData.user_id);
  }
});

app.post("/favorite", authenticateUser, async (req, res) => {
  try {
    const data = {
      movie_id: req.body.movie_id,
      user_id: req.body.user_id,
    };
    const response = await axios.post(base_url + "/favorite/", data);
    if (response.data.message == "al") {
      try {
        await axios({
          method: "delete",
          url: base_url + "/favorite/",
          data: data,
        });
        req.session.favoriteStatus2 = `Unfavorite this movie!`;
      } catch (err) {
        console.error(err);
        res.send("error");
        res.redirect("/");
      }
    } else {
      req.session.favoriteStatus2 = `Add to your favorite!`;
    }

    res.redirect("/movie/" + req.body.movie_id);
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /favorite");
    res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
  try {
    res.clearCookie("userSession");
    req.session.movieData = null;
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /logout");
    res.redirect("/");
  }
});

app.get("/users", onlyAdmin, async (req, res) => {
  try {
    const response = await axios.get(base_url + "/users");
    res.render("users", {
      users: response.data,
      moviedata: req.session.movieData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /users");
    res.redirect("/");
  }
});

app.get("/movies", onlyAdmin, async (req, res) => {
  try {
    const response = await axios.get(base_url + "/movies");
    res.render("movies", {
      movies: response.data,
      moviedata: req.session.movieData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /movies");
    res.redirect("/");
  }
});

app.get("/typemovie", async (req, res) => {
  try {
    const response = await axios.get(base_url + "/typemovie");
    res.render("typemovie", {
      movies: response.data,
      moviedata: req.session.movieData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /typemovie");
    res.redirect("/");
  }
});

app.get("/typeseries", async (req, res) => {
  try {
    const response = await axios.get(base_url + "/typeseries");
    res.render("typeseries", {
      movies: response.data,
      moviedata: req.session.movieData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("error in /typeseries");
    res.redirect("/");
  }
});

app.get("/deletereview/:id", async (req, res) => {
  try {
    console.log(req.params.id);
    await axios.delete(base_url + "/review/" + req.params.id);
    res.redirect("/movie/" + req.session.movieid);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error delete");
  }
});

const port = 5500;
app.listen(port, () => {
  console.log(`Listening on port http://localhost:${port}...`);
});
