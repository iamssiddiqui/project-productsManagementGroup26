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
      return res.status(400).send({ status: false, message: "Please enter user datails!"});

      let {fname, lname, email, password, phone, address} = data

      let nameRegex = /^[a-zA-Z ]{2,30}$/;

      let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

      let passwordRegex = /((?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[~!@#$%^&*()]).{8,15})/;

      let phoneRegex = /^[6-9][0-9]{9}$/;

      if (!isValid(fname)) {
        return res.status(400).send({status: false, message: "Please enter first name!"})
      }

      if (!fname.match(nameRegex)) 
      return res.status(400).send({status: false, message: "First name must contain alphabets only!"})

      if (!isValid(lname)) {
        return res.status(400).send({status: false, message: "Please enter last name!"})
      }

      if (!lname.match(nameRegex)) 
      return res.status(400).send({status: false, message: "Last name must contain alphabets only!"})

      if (!isValid(email)) {
        return res.status(400).send({status: false, message: "Please enter email!"})
      }

      if (!email.match(emailRegex)) 
      return res.status(400).send({status: false, message: "Invalid email format!"})

      const emailInUse = await userModel.findOne({email: email})

      if (emailInUse)
      return res.status(400).send({status: false, message: "email already in use!"})

      if (!isValid(password)) {
        return res.status(400).send({status: false, message: "Please enter password!"})
      }

      if (!password.match(passwordRegex)) 
      return res.status(400).send({status: false, message: "Invalid password format! Password must be between 8 and 15 characters, and must contain one uppercase, one lowercase, special characters and number!"})



      if (!isValid(phone)) {
        return res.status(400).send({status: false, message: "Please enter phone number!"})
      }

      if (!phone.match(phoneRegex)) 
      return res.status(400).send({status: false, message: "Invalid phone number format!"})

      const phoneInUse = await userModel.findOne({phone: phone})

      if (phoneInUse)
      return res.status(400).send({status: false, message: "This phone number is already in use!"})


      if (!isValid(address)) {
        return res.status(400).send({status: false, message: "Please enter address!"})
      }



      let saveData = await userModel.create(data)

      return res.status(201).send({status: true, msg: "User Creation Successful!", data: saveData})

    }

     catch (error) {
    res.status(500).send({ status: false, msg: error.message });
  }
}

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