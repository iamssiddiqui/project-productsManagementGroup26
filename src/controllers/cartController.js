const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const mongoose = require("mongoose")

const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidBody = function (body) {
    return Object.keys(body).length > 0;
};

const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId);
};

const isValidQuantity = function (value) {
    if (value <= 0) return false
    if (value % 1 == 0) return true;
}

/////////////////////////////Create Cart///////////////////////////

const createCart = async function (req, res) {

    try {

        let userId = req.params.userId

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId" })
        }

        let loggedInUser = req.decodeToken.userId
      
        if(loggedInUser != userId){
            return res.status(403).send({status:false, message:"Unauthorized access!"})
        }

        const validUser = await userModel.findById(userId);

        if (!validUser) {
            return res.status(404).send({ status: false, message: "User not present" })
        }


        let data = req.body

        let { productId } = data

        //validating empty req body

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: "Invalid request parameters. Please provide user details" })
        }

        if (!isValid(productId)) {
            return res.status(400).send({ status: false, message: "Please enter productId" })
        }

        //check productId is Valid ObjectId
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "product id is not valid" })
        }

        //check product is available in Product collection which is not deleted

        const validProduct = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!validProduct) {
            return res.status(404).send({ status: false, message: "Product not present" })
        }

        //find cart is available for user or not
        let findCart = await cartModel.findOne({ userId: userId })

        if (findCart) { cartId = findCart._id }



        if (!data.quantity) {
            data.quantity = 1
        }
        else {
            if (!isValid(data.quantity)) {
                return res.status(400).send({ status: false, message: "Please enter quantity" })
            }

            if (!isValidQuantity(data.quantity)) {
                return res.status(400).send({ status: false, message: "Quantity must be a postive no" })
            }
        }

        let { quantity } = data


        //if cart is not available for user creat New cart and add product detail from user

        if (!findCart) {
            cart = {
                userId: userId,
                items: [
                    {
                        productId: productId,
                        quantity: quantity
                    }],
                totalPrice: quantity * (validProduct.price),
                totalItems: 1
            }

            const newCart = await cartModel.create(cart)
            return res.status(201).send({ status: true, message: "Success", data: newCart })
        }

        //if cart is available for user add product details from user

        if (findCart) {
            if (cartId != findCart._id) {
                return res.status(400).send({ status: false, message: `This cart is not present for this user ${userId}` })
            }

            let price = findCart.totalPrice + (quantity * validProduct.price)
            let itemsArr = findCart.items

            for (let i = 0; i < itemsArr.length; i++) {
                if (itemsArr[i].productId.toString() === productId) {
                    itemsArr[i].quantity += quantity

                    let itemAddedInCart = { items: itemsArr, totalPrice: price, totalItems: itemsArr.length }

                    let newData = await cartModel.findOneAndUpdate({ _id: findCart._id }, itemAddedInCart, { new: true })

                    return res.status(201).send({ status: true, message: `Success`, data: newData })
                }
            }

            itemsArr.push({ productId: productId, quantity: quantity })


            let itemAddedInCart = { items: itemsArr, totalPrice: price, totalItems: itemsArr.length }
            let newData = await cartModel.findOneAndUpdate({ _id: findCart._id }, itemAddedInCart, { new: true })

            return res.status(201).send({ status: true, message: `Success`, data: newData })
        }

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

/////////////////////////  Update Cart  ///////////////////////////////

const updateCart = async function (req, res) {

    try {

        let id = req.params.userId

        if (!isValidObjectId(id)) {
            return res.status(400).send({ status: false, message: "Invalid UserID !" })

        }
        
        let loggedInUser = req.decodeToken.userId
      
        if(loggedInUser != id){
            return res.status(403).send({status:false, message:"Unauthorized access!"})
        }



        let data = req.body

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, message: "Please enter user details!" });

        }

        let { cartId, productId, removeProduct } = data

        if (!isValid(cartId)) {
            return res.status(400).send({ status: false, message: "Enter CartId" })
        }

        if ((!isValidObjectId(cartId))) {
            return res.status(400).send({ status: false, message: "Invalid CartId" })
        }

        const getCart = await cartModel.findById({ _id: cartId })

        if (!getCart) {
            return res.status(400).send({ status: false, message: "No cart exist with this id !!" })
        }

        if (!isValid(productId)) {
            return res.status(400).send({ status: false, message: "Enter productId" })
        }

        if ((!isValidObjectId(productId))) {
            return res.status(400).send({ status: false, message: "Invalid productId" })
        }

        const getProduct = await productModel.findById({ _id: productId, isDeleted: false })

        if (!getProduct) {
            return res.status(400).send({ status: false, message: "No product exist with this id !!" })
        }

        if (!removeProduct) {
            if (removeProduct != 0) {
                return res.status(400).send({ status: false, message: "Enter remove Product" })
            }
        }

        if (!isValid(removeProduct.toString())) {
            return res.status(400).send({ status: false, message: "Enter value for remove product" })
        }

        if (getCart.items.length <= 0) {
            return res.status(400).send({ status: false, message: "No products available in cart!!" })
        }


        //filtering products that we want to remove or decrease their quantity by storing it into an array
        let products = getCart.items.filter(x => x.productId.toString() == productId)


        //sending an error message when we get an empty array
        if (products.length <= 0) {
            return res.status(400).send({ status: false, message: "No product available in this cart with this id" })
        }

        //finding index of product in cart's item array
        let indexOfProduct = getCart.items.indexOf(products[0])

        if (removeProduct == 0) {

            let update = {}

            update['totalPrice'] = getCart.totalPrice - (getProduct.price * getCart.items[indexOfProduct].quantity)

            getCart.items.splice(indexOfProduct, 1)

            update['items'] = getCart.items

            update['totalItems'] = getCart.items.length

            let updateCartData = await cartModel.findOneAndUpdate({ _id: cartId }, update, { new: true })
            return res.status(200).send({ status: true, message: "Success", data: updateCartData })
        }

        if (removeProduct == 1) {

            let update = {}

            if (getCart.items[indexOfProduct].quantity != 0) {
                getCart.items[indexOfProduct].quantity = getCart.items[indexOfProduct].quantity - 1

            }

            if (getCart.items[indexOfProduct].quantity == 0) {
                getCart.items.splice(indexOfProduct, 1)

                update['items'] = getCart.items
            }

            else {

                update['items'] = getCart.items

            }

            update['totalPrice'] = getCart.totalPrice - getProduct.price

            update['totalItems'] = getCart.items.length

            let updateCartData = await cartModel.findOneAndUpdate({ _id: cartId }, update, { new: true })

            return res.status(200).send({ status: true, message: "Success", data: updateCartData })

        }

        if (removeProduct != 0 || removeProduct != 1) {
            return res.status(400).send({ status: false, message: "Remove products can't have any value other than 0 or 1" })
        }

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }
}


//////////////////////////////// Get Cart  ///////////////////////////////////

const getCart = async function (req, res) {

    try {
        let userId = req.params.userId

        //check productId is Valid ObjectId
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId" })
        }

        let loggedInUser = req.decodeToken.userId
      
        if(loggedInUser != userId){
            return res.status(403).send({status:false, message:"Unauthorized access!"})
        }

        //search userID in User Collection
        const validUser = await userModel.findById(userId);

        if (!validUser) {
            return res.status(404).send({ status: false, message: "User not present" })
        }

        //search userID in cart Collection
        let findCart = await cartModel.findOne({ userId: userId }).populate("items.productId")

        if (!findCart) {
            return res.status(404).send({ status: false, message: "Cart not present with this user id" })
        }


        return res.status(200).send({ status: true, message: "Success", data: findCart })
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }
}

//////////////////Delete Cart//////////////////////////

const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId;

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId!" });
        }

        

        const checkUser = await userModel.findById(userId)

        if (!checkUser) {
            return res.status(404).send({ status: false, message: "User with this userId doesn't exist" })
        }

        const checkCart = await cartModel.findOne({ userId: userId })
        
        if (!checkCart) {
            return res.status(404).send({ status: false, message: "Cart with this userId doesn't exist" })
        }

        let loggedInUser = req.decodeToken.userId
      
        if(loggedInUser != userId){
            return res.status(403).send({status:false, message:"Unauthorized access!"})
        }

        await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0 }, { new: true });
        return res.status(400).send({ status: false, message: "Cart is deleted!" })

    }

    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
}


module.exports.createCart = createCart
module.exports.updateCart = updateCart
module.exports.getCart = getCart
module.exports.deleteCart = deleteCart