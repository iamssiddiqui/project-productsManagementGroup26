const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt')

const aws = require('aws-sdk')

const { uploadFile } = require('./aws')

const { default: mongoose } = require("mongoose");
//const { RolesAnywhere } = require("aws-sdk");

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

/////////////////////////////////////////////////// Create User /////////////////////////////////////////////////////////////


const createUser = async function (req, res) {

    try {
        let data = req.body

        if (!isValidBody(data))
            return res.status(400).send({ status: false, message: "Please enter user datails!" });

        //Destructuring data    
        let { fname, lname, email, password, phone } = data


        //List of regex used for validations
        let nameRegex = /^[a-zA-Z ]{2,30}$/;

        let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

        let passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/;

        let imageUrlRegex = /(https?:\/\/.*\.)(jpg|jpeg|png)/

        let phoneRegex = /^[6-9][0-9]{9}$/;

        let pincodeRegex = /^[1-9][0-9]{5}$/;


        //Validating first name
        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "Please enter first name!" })
        }

        if (!fname.match(nameRegex))
            return res.status(400).send({ status: false, message: "First name must contain alphabets only!" })

        //Validating last name
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "Please enter last name!" })
        }

        if (!lname.match(nameRegex))
            return res.status(400).send({ status: false, message: "Last name must contain alphabets only!" })

        //Validating email
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Please enter email!" })
        }

        if (!email.match(emailRegex))
            return res.status(400).send({ status: false, message: "Invalid email format!" })

        const emailInUse = await userModel.findOne({ email: email })

        if (emailInUse)
            return res.status(400).send({ status: false, message: "email already in use!" })

        //Checking if profileImage is present
        let profileImage = req.files
        if (profileImage.length <= 0) {
            return res.status(400).send({ status: false, message: "Enter profile Image" })
        }

        //Generating s3 link for image
        if (profileImage && profileImage.length > 0) {
            let uploadedFileURL = await uploadFile(profileImage[0])

            if (!imageUrlRegex.test(uploadedFileURL)) {
                return res.status(400).send({ status: false, message: "Invalid document entered as profile image" })
            }

            data.profileImage = uploadedFileURL
        }

        //Validating password
        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "Please enter password!" })
        }

        if (!password.match(passwordRegex))
            return res.status(400).send({ status: false, message: "Invalid password format! Password must be between 8 and 15 characters, and must contain one uppercase, one lowercase, special characters and number!" })


        //Validating phone
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Please enter phone number!" })
        }

        if (!phone.match(phoneRegex))
            return res.status(400).send({ status: false, message: "Invalid phone number format!" })
        data.password = (await bcrypt.hash(password, 10)).toString()

        const phoneInUse = await userModel.findOne({ phone: phone })

        if (phoneInUse)
            return res.status(400).send({ status: false, message: "This phone number is already in use!" })

        //Validating address
        if (!isValid(req.body.address)) {
            return res.status(400).send({ status: false, message: "Please enter address!" })
        }

        let address = JSON.parse(req.body.address)

        if (!isValid(address.shipping)) {
            return res.status(400).send({ status: false, message: "Please enter shipping address!" })
        }

        if (!isValid(address.shipping.city)) {
            return res.status(400).send({ status: false, message: "Please enter city in shiping address!" })
        }

        if (!isValid(address.shipping.street)) {
            return res.status(400).send({ status: false, message: "Please enter street in shiping address!" })
        }

        if (!isValid(address.shipping.pincode)) {
            return res.status(400).send({ status: false, message: "Please enter pincode in shiping address!" })
        }

        if (!address.shipping.pincode.toString().match(pincodeRegex))
            return res.status(400).send({ status: false, message: "Invalid pin code!" })

        if (!isValid(address.billing)) {
            return res.status(400).send({ status: false, message: "Please enter billing address!" })
        }

        if (!isValid(address.billing.city)) {
            return res.status(400).send({ status: false, message: "Please enter city in billing address!" })
        }

        if (!isValid(address.billing.street)) {
            return res.status(400).send({ status: false, message: "Please enter street in billing address!" })
        }

        if (!isValid(address.billing.pincode)) {
            return res.status(400).send({ status: false, message: "Please enter pincode in billing address!" })
        }

        if (!address.billing.pincode.toString().match(pincodeRegex))
            return res.status(400).send({ status: false, message: "Invalid pin code!" })

        data.address = address

        //Creating User
        let saveData = await userModel.create(data)

        return res.status(201).send({ status: true, message: "User Creation Successful!", data: saveData })

    }

    catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

///////////////////////////////////   login   /////////////////////////////////////////////////////////////

const loginUser = async function (req, res) {
    try {
        const data = req.body;

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, msg: "Please provide login credentials!" })
        }

        let { email, password } = data


        //checking for empty email or password
        if (!isValid(email)) {
            return res.status(400).send({ status: false, msg: "Please provide email!" })
        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, msg: "Please provide password!" })
        }


        //Checking if any User is regisetered with given email
        const user = await userModel.findOne({ email: email })
        if (!user) {
            return res.status(400).send({ status: false, message: "User not found with this email " })
        }

        hashedPassword = user.password

        //Checking if the entered password matches with user's password
        const validPassword = await bcrypt.compare(password, hashedPassword)

        if (validPassword) {
            const checkCredentials = await userModel.findOne({ email: data.email, password: hashedPassword });

            //Generating Token on Successful login
            let token = jwt.sign(
                {
                    userId: checkCredentials._id,
                    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
                }, "group26Project")

            return res.status(200).send({ status: true, message: "User login success", data: { userId: checkCredentials._id, token: token }, });
        }

        else {
            return res.status(400).send({ status: false, message: "Password isn't correct" })
        }
    }

    catch (error) {
        console.log(error.message);
        return res.status(500).send({ status: false, message: "Error", error: error.message });
    }
}




/////////////////////////////////getUser/////////////////////////////

const getUserData = async function (req, res) {

    try {
        const id = req.params.userId

        if (!isValidObjectId(id)) {
            return res.status(400).send({ status: false, message: "Enter valid userid!" })
        }

        let loggedInUser = req.decodeToken.userId
      
        if(loggedInUser != id){
            return res.status(403).send({status:false, message:"Unauthorized access!"})
        }

        const getDetails = await userModel.findById({ _id: id })

        if (!getDetails) {
            return res.status(404).send({ status: false, message: "No user found with given id" })
        }

        return res.status(200).send({ status: true, message: "User profile details", data: getDetails })
    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}


///////////////////////////////////////////  Update Details  ////////////////////////////////////////////


const updateData = async function (req, res) {
    try {
      
        let id = req.params.userId

        if(!isValidObjectId(id)){
            return res.status(400).send({status:false,message:"Enter Valid userID"})
         }

        const getUser = await userModel.findById({ _id: id })

        if (!getUser) {
            return res.status(404).send({ status: false, message: "No user found with given id" })
        }

        let loggedInUser = req.decodeToken.userId

        if(loggedInUser != id){
            return res.status(403).send({status:false,message:"LoggedInUser isn't authorized to do updation here !!!"})
        }

        let data = req.body

        if(data && !req.files){
        if (!isValidBody(data))
            return res.status(400).send({ status: false, message: "Please enter user details!" });
          }
          
        let { fname, lname, email, password, phone, address } = data

        let nameRegex = /^[a-zA-Z ]{2,30}$/;

        let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

        let imageUrlRegex = /(https?:\/\/.*\.)(jpg|jpeg|png)/

        let passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/;

        let phoneRegex = /^[6-9][0-9]{9}$/;

        let pincodeRegex = /^[1-9][0-9]{5}$/;

        let obj = {}

        if (fname || fname == "") {

            if (!isValid(fname)) {
                return res.status(400).send({ status: false, message: "Please enter first name!" })
            }

            if (!fname.match(nameRegex))
                return res.status(400).send({ status: false, message: "First name must contain alphabets only!" })

                obj['fname'] = fname
        }

        if (lname || lname == "") {
            if (!isValid(lname)) {
                return res.status(400).send({ status: false, message: "Please enter last name!" })
            }

            if (!lname.match(nameRegex))
                return res.status(400).send({ status: false, message: "Last name must contain alphabets only!" })

                obj['lname'] = lname
        }

        if (email || email == "")
        
        {
            if (!isValid(email)) {
                return res.status(400).send({ status: false, message: "Please enter email!" })
            }

            if (!email.match(emailRegex))
                return res.status(400).send({ status: false, message: "Invalid email format!" })

            const emailInUse = await userModel.findOne({ email: email })

            if (emailInUse)
                return res.status(400).send({ status: false, message: "email already in use!" })

                obj['email'] = email
        }

        if (req.files.length > 0) 
        
        {
            let profileImage = req.files
            let uploadedFileURL = await uploadFile(profileImage[0])

            if (!imageUrlRegex.test(uploadedFileURL)) {
                return res.status(400).send({ status: false, message: "Invalid document entered as profile image !!" })
            }

            obj ['profileImage'] = uploadedFileURL
        }

        if (password || password == "")
        
        {
            if (!isValid(password)) {
                return res.status(400).send({ status: false, message: "Please enter password!" })
            }

            if (!password.match(passwordRegex))
                return res.status(400).send({ status: false, message: "Invalid password format! Password must be between 8 and 15 characters, and must contain one uppercase, one lowercase, special characters and number!" })
            obj['password'] = (await bcrypt.hash(password, 10)).toString()
        }

        if (phone || phone == "")
        
        {
            if (!isValid(phone)) {
                return res.status(400).send({ status: false, message: "Please enter phone number!" })
            }

            if (!phone.match(phoneRegex))
                return res.status(400).send({ status: false, message: "Invalid phone number format!" })

            const phoneInUse = await userModel.findOne({ phone: phone })

            if (phoneInUse)

                return res.status(400).send({ status: false, message: "This phone number is already in use!" })

                obj['phone'] = phone
                
        }

        if (address || address == "") 
        
        {

            if (!isValid(address)) {
                return res.status(400).send({ status: false, message: "Please enter address!" })
            }

            address = JSON.parse(req.body.address)

            if (!isValid(address.shipping)) {
                return res.status(400).send({ status: false, message: "Please enter shipping address!" })
            }

            if (!isValid(address.shipping.city)) {
                return res.status(400).send({ status: false, message: "Please enter city in shiping address!" })
            }

            if (!isValid(address.shipping.street)) {
                return res.status(400).send({ status: false, message: "Please enter street in shiping address!" })
            }

            if (!isValid(address.shipping.pincode)) {
                return res.status(400).send({ status: false, message: "Please enter pincode in shiping address!" })
            }

            if (!address.shipping.pincode.toString().match(pincodeRegex))
                return res.status(400).send({ status: false, message: "Invalid pin code!" })

            if (!isValid(address.billing)) {
                return res.status(400).send({ status: false, message: "Please enter billing address!" })
            }

            if (!isValid(address.billing.city)) {
                return res.status(400).send({ status: false, message: "Please enter city in billing address!" })
            }

            if (!isValid(address.billing.street)) {
                return res.status(400).send({ status: false, message: "Please enter street in billing address!" })
            }

            if (!isValid(address.billing.pincode)) {
                return res.status(400).send({ status: false, message: "Please enter pincode in billing address!" })
            }

            if (!address.billing.pincode.toString().match(pincodeRegex))
                return res.status(400).send({ status: false, message: "Invalid pin code!" })
                   
                obj['address'] = address
                
        }

        const updateDetails = await userModel.findOneAndUpdate({ _id: id }, obj, { new: true })

        return res.status(200).send({ status: false, message: "User profile updated!", data: updateDetails })
    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}


module.exports.createUser = createUser
module.exports.getUserData = getUserData
module.exports.updateData = updateData
module.exports.loginUser = loginUser