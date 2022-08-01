const express = require("express");
const router = express.Router()
const middleware = require("../middleware/auth")
const userController = require("../controllers/userController")
const productContoller = require("../controllers/productController")
const cartController = require("../controllers/cartController")


//user route

router.post("/register", userController.createUser)

router.get("/user/:userId/profile", middleware.middleware, userController.getUserData)

router.put("/user/:userId/profile", middleware.middleware,middleware.authorization, userController.updateData)

router.post("/login", userController.loginUser)

// product route

router.post("/products", productContoller.createProduct )

router.get("/products", productContoller.getProductByQuery)

router.get("/products/:productId", productContoller.getProductsByPath)

router.put("/products/:productId", productContoller.updateProduct)

router.delete("/products/:productId", productContoller.deleteProduct)

//cart route

router.post("/users/:userId/cart", cartController.createCart)

module.exports = router