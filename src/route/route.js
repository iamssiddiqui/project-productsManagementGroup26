const express = require("express");
const router = express.Router()
const middleware = require("../middleware/auth")
const userController = require("../controllers/userController")
const productContoller = require("../controllers/productController")

//user route

router.post("/register", userController.createUser)

router.get("/user/:userId/profile", middleware.middleware, userController.getUserData)

router.put("/user/:userId/profile", middleware.middleware, userController.updateData)

router.post("/login", userController.loginUser)

// product route

router.post("/products", productContoller.createProduct )

module.exports = router