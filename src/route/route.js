const express = require("express");
const router = express.Router()
const middleware = require("../middleware/auth")

const userController = require("../controllers/userController")

//user route

router.post("/register", userController.createUser)

router.get("/user/:userId/profile", middleware.middleware)


module.exports = router