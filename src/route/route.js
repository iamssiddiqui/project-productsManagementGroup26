const express = require("express");
const router = express.Router()
const middleware = require("../middleware/auth")
const userController = require("../controllers/userController")
const productContoller = require("../controllers/productController")
const cartController = require("../controllers/cartController")
const orderController = require("../controllers/orderController")

//user route

router.post("/register", userController.createUser)

router.get("/user/:userId/profile", middleware.middleware, userController.getUserData)

router.put("/user/:userId/profile", middleware.middleware, userController.updateData)

router.post("/login", userController.loginUser)

// product route

router.post("/products", productContoller.createProduct )

router.get("/products", productContoller.getProductByQuery)

router.get("/products/:productId", productContoller.getProductsByPath)

router.put("/products/:productId", productContoller.updateProduct)

router.delete("/products/:productId", productContoller.deleteProduct)

//cart route

router.post("/users/:userId/cart", middleware.middleware, cartController.createCart)

router.put("/users/:userId/cart", middleware.middleware, cartController.updateCart)

router.get("/users/:userId/cart", middleware.middleware, cartController.getCart)

router.delete("/users/:userId/cart", middleware.middleware, cartController.deleteCart)

//Order route

router.post("/users/:userId/orders",middleware.middleware, orderController.createOrder)

router.put("/users/:userId/orders",middleware.middleware, orderController.updateOrder)

//In case of any other request
router.all('/*', async function(req, res){
    res.status(404).send({status: false, msg: "Page Not Found!!!"})
})

module.exports = router