const cartModel = require("../models/cartModel")
const userModel = require("../models/userModel")
const mongoose = require("mongoose")
const orderModel = require("../models/orderModel")


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


//////////////////////////////////////////  Create Order  ////////////////////////////////////////////////////////////////////////////////////////

const createOrder = async function (req,res){
    try{
          
         let id = req.params.userId

         if(!isValidObjectId(id)){
            return res.status(400).send({status:false,message:"Enter Valid userID"})
         }

        let findUser = await userModel.findById({_id:id})

        if(!findUser){
            return res.status(400).send({status:false,message:"User doesn't exist with this id"})
        }

        let loggedInUser = req.decodeToken.userId

        if(loggedInUser != id){
            return res.status(400).send({status:false,message:"LoggedInUser isn't authorized to perform this action !!"})
        }

           let data = req.body

           if(!isValidBody(data)){
              return res.status(400).send({status:false,message:"Invalid request body"})
           }

           let {cartId,cancellable,status} = data

           if(!isValid(cartId))
           {
            return res.status(400).send({status:false,message:"Enter Cart id"})
           }

           if(!isValidObjectId(cartId)){
            return res.status(400).send({status:false,message:"Enter valid cart id"})
           }

           let getCart = await cartModel.findById({_id:cartId})

           if(!getCart){
            return res.status(400).send({status:false,message:"No cart exist with entered cartId"})
           }

           if(getCart.userId != id){
               return res.status(400).send({status:false,message:"LoggedInUser doesn't own this cart"})
           }

        //Status isn't mandatory
         if(status || status =="")
         {
           if(!isValid(status)){
            return res.status(400).send({status:false,message:"Status can't be an empty string"})
           }

           if(!(["pending", "completed", "cancelled"].includes(status))){

            return res.status(400).send({status:false,message:"Status should be among any of these values -> [pending, completed, cancelled]"})
           }
        }

        //Cancellable isn't mandatory
        if(cancellable || cancellable =="")
        {
           if(!isValid(cancellable)){
            return res.status(400).send({status:false,message:"Value for cancellable can't be an empty String !!"})
           }

           if(typeof cancellable != 'boolean'){
            return res.status(400).send({status:false,message:"Value of cancellable should be a boolean value !!"})
           }
        }


           let createData = 
           {
            userId: id,
            items:getCart.items,
            totalPrice: getCart.totalPrice,
            totalItems:getCart.totalItems,
            totalQuantity:getCart.items.length,
            status:status,
            cancellable:cancellable
           }

           const createOrder = await orderModel.create(createData)
           return res.status(400).send({status:false,message:"Succesful",data:createOrder})
    }

    

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}


///////////////////////////////////////////////////  Update Order  //////////////////////////////////////////////////////////////////////////////


const updateOrder = async function (req, res)
{
    try{
        let id = req.params.userId
        let loggedInUser = req.decodeToken.userId
 
        if(!isValidObjectId(id)){
            return res.status(400).send({status : false, message : "Enter Valid userId"})
        }
 
        let findUser = await userModel.findById({_id : id})

       if(!findUser){
        return res.status(404).send({status:false,message:"No user exist with this id"})
       }

       if(loggedInUser != id){
        return res.status(403).send({status:false,message:"LoggedIn user isn't authorized to perform this action !!"})
       }
 
        let data = req.body
 
        if(!isValidBody(data)){
            return res.status(400).send({status : false, message : "Invalid request body"})
        }
 
        let {orderId, status} = data
        
        if(!isValid(orderId)){
            return res.status(400).send({status: false, message : "Enter order Id"})
        }
 
        if(!isValidObjectId(orderId)){
            return res.status(400).send({status : false, message : "Invalid orderId"})
        }
 
        if(status || status =="")

        {
          if(!isValid(status)){
           return res.status(400).send({status:false,message:"Status can't be an empty string"})
          }

          if(!(["pending", "completed", "cancelled"].includes(status))){

           return res.status(400).send({status:false,message:"Status should be among any of these values -> [pending, completed, cancelled]"})
          }
       }
 
        let findorder = await orderModel.findById({_id : orderId,isDeleted:false})
 
        if(!findorder){
            return res.status(404).send({status : false, message : " No Order exists with given orderId"})
        }
 
        if(findorder.userId != id){
            return res.status(401).send({status : false, message : "LoggedInUser doesn't own this order !!"})
        }

        if(findorder.cancellable == false && status=='cancelled'){
            return res.status(400).send({status:false,message:"This order can not be cancelled !!"})
        }

        let updateOrder = await orderModel.findOneAndUpdate({userId : id,isDeleted:false}, {status:status}, {new : true})
        
        return res.status(200).send({status : true, message : "Success", data : updateOrder})
 
    } 
    catch (error) {
         return res.status(500).send({ status: "error", message: error.message });
    }
 }

module.exports.createOrder = createOrder
module.exports.updateOrder = updateOrder
