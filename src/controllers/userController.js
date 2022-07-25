const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")

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

const createUser = async function (req, res) {

    try {
        let data = req.body

        if (!isValidBody(data))
      return res.status(400).send({ status: false, msg: "Please enter user datails!"});

      let {fname, lname, email, password, phone, address} = data

      let saveData = await userModel.create(data)

      return res.status(201).send({status: true, msg: "User Creation Successful!", data: saveData})

    }

     catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
}

const userModel = require('../models/userModel')

const getUserData = async function(req,res){
    const id = req.params.userId
    
    const getDetails = await userModel.findById({_id:id})

    if(!getDetails){
        return res.status(400).send({status:false,message:"No user found with given id"})
    }

    return res.status(200).send({status:true,message:"User profile details",data:getDetails})

}
module.exports.createUser = createUser
module.exports.getUserData = getUserData