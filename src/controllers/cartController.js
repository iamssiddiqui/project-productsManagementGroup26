const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const productModel = require("../models/productModel")
const mongoose = require("mongoose")
const ObjectId=require("mongoose").Types.ObjectId

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

const createCart = async function (req, res) {

    try {

        let data = req.body
        let userId=req.params.userId 

        let {productId}=data 
        let userToken=req.userId

        if (!isValidObjectId(userId)){
            return res.status(400).send({ status: false, message: "Invalid userId" })
        }

    //     const validUser = await cartModel.findById(userId);

    //     if(!validUser){
    //         return res.status(404).send({status:false,message:"User not present"})
    //     }


    //  //validating empty req body.
    //     if (!isValidBody(data)) {
    //         return res.status(400).send({ status: false, message: "invalid request parameters. Please provide user details" })
    //     }

    //find cart is available for user or not
        let findCart = await cartModel.findOne({userId: userId})
        if(findCart){
               cartId = findCart._id
            if(!isValid(cartId)){
                return res.status(400).send({status:false,message:"Please enter cartId"})
            }

    //check cartId is Valid ObjectId
            if (!isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, message: "cart id is not valid" })
                }
        }
    
        if(!isValid(productId)){
            return res.status(400).send({status:false,message:"Please enter productId"})
            }
    
  //check productId is Valid ObjectId
        if (!isValidObjectId(productId)) {
         return res.status(400).send({ status: false, message: "product id is not valid" })
            }      

    //cheak product is available in Product collection which is not deleted

        const validProduct = await productModel.findOne({_id: productId, isDeleted: false})

        if(!validProduct){
            return res.status(404).send({status:false,message:"Product not present"})
        }

        if(!data.quantity){
            data.quantity=1
        }
        else{  
            if(!isValid(data.quantity)){
            return res.status(400).send({status:false,message:"Please enter quantity"})
            }

            if(!isValidQuantity(data.quantity)){
            return res.status(400).send({status:false,message:"Quantity must be a postive no"})
            }
        }

        let {quantity}=data
    

//if cart is not available for user creat New cart and add product detail from user

    if(!findCart){
        cart={userId: userId,
            items:[
                {productId: productId,
                quantity: quantity
            }],
            totalPrice:quantity*(validProduct.price) ,
            totalItems:1
        }
        
        const newCart = await cartModel.create(cart)
        return res.status(201).send({status:true,message:"Success",data:newCart})
    }
    
    //if cart is available for user add product details from user

    if(findCart){
        if(cartId!=findCart._id){
            return res.status(400).send({status:false,message:`This cart is not present for this user ${userId}`})
            }

        let price = findCart.totalPrice + (quantity * validProduct.price)
        let itemsArr = findCart.items
           
        for (let i=0;i<itemsArr.length;i++) {
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
        catch(err){
        return res.status(500).send({status:false,message:err.message})
    }
}

////////////////////////////////////////////////////  Update Cart  //////////////////////////////////////////////////////////////////

const updateCart = async function (req,res){
    let id = req.params.userId
 
    if(!isValidObjectId(id)){
        return res.status(400).send({status:false, message:"Invalid UserID !"})
    }
   
    let data = req.body
 
    if(!isValidBody(data))
    {
        return res.status(400).send({ status: false, message: "Please enter user details!" });
 
    }
 
    let {cartId,productId,removeProduct} = data
 
    if(!isValid(cartId)){
        return res.status(400).send({status:false,message:"Enter CartId"})
    }
 
    if((!isValidObjectId(cartId))){
        return res.status(400).send({status:false,message:"Invalid CartId"})
    }
 
    const getCart = await cartModel.findById({_id:cartId})
    if(!getCart){
        return res.status(400).send({status:false,message:"No cart exist with this id !!"})
    }
 
    if(!isValid(productId)){
        return res.status(400).send({status:false,message:"Enter productId"})
    }
 
    if((!isValidObjectId(productId))){
        return res.status(400).send({status:false,message:"Invalid productId"})
    }
 
    const getProduct = await productModel.findById({_id:productId,isDeleted:false})
    if(!getProduct){
        return res.status(400).send({status:false,message:"No product exist with this id !!"})
    }
 
    if(!isValid(removeProduct)){
        return res.status(400).send({status:false,message:"Enter removeProduct"})
    }
 
    //filtering products that we want to remove or decrease their quantity
    let products = getCart.items.filter(x => x.productId.toString() == productId)
 
    //finding their index in cart's item array
    let indexOfProduct = getCart.items.indexOf(products[0])
   
    if(removeProduct==0){
 
        getCart.totalPrice = getCart.totalPrice - (getProduct.price * getCart.items[indexOfProduct].quantity)
 
        //removing the product
        getCart.items.splice(indexOfProduct,1)
 
        getCart.totalItems = getCart.items.length
 
        return res.status.send({status:false,message:"Success",data:getCart})
    }
 
    if(removeProduct==1){
 
        getCart.items.quantity = getCart.items[indexOfProduct].quantity - 1
 
        getCart.totalPrice = getCart.totalPrice - getProduct.price
 
        getCart.totalItems = getCart.items.length
       
        return res.status.send({status:false,message:"Success",data:getCart})
 
    }
 
    if(removeProduct != 0 || removeProduct != 1){
        return res.status(400).send({status:false,message:"Remove products can't have any value other than 0 or -1"})
    }
 
}
 
module.exports.createCart = createCart
module.exports.updateCart = updateCart