const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken");
const { default: mongoose } = require("mongoose");
//const bcrypt = require("bcryptjs")

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

////////////////////////////createUser///////////////////////////////////

const createUser = async function (req, res) {

    try {
        let data = req.body

        if (!isValidBody(data))
            return res.status(400).send({ status: false, message: "Please enter user datails!" });

        let { fname, lname, email, password, phone, address } = data

        let nameRegex = /^[a-zA-Z ]{2,30}$/;

        let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

        let passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/
            ;

        let phoneRegex = /^[6-9][0-9]{9}$/;

        let pincodeRegex = /^\d{6}$/;

        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "Please enter first name!" })
        }

        if (!fname.match(nameRegex))
            return res.status(400).send({ status: false, message: "First name must contain alphabets only!" })

        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "Please enter last name!" })
        }

        if (!lname.match(nameRegex))
            return res.status(400).send({ status: false, message: "Last name must contain alphabets only!" })

        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Please enter email!" })
        }

        if (!email.match(emailRegex))
            return res.status(400).send({ status: false, message: "Invalid email format!" })

        const emailInUse = await userModel.findOne({ email: email })

        if (emailInUse)
            return res.status(400).send({ status: false, message: "email already in use!" })

        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "Please enter password!" })
        }

        if (!password.match(passwordRegex))
            return res.status(400).send({ status: false, message: "Invalid password format! Password must be between 8 and 15 characters, and must contain one uppercase, one lowercase, special characters and number!" })



        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Please enter phone number!" })
        }

        if (!phone.match(phoneRegex))
            return res.status(400).send({ status: false, message: "Invalid phone number format!" })

        const phoneInUse = await userModel.findOne({ phone: phone })

        if (phoneInUse)
            return res.status(400).send({ status: false, message: "This phone number is already in use!" })


        if (!isValid(address)) {
            return res.status(400).send({ status: false, message: "Please enter address!" })
        }


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

        //  if (!address.shipping.pincode.match(pincodeRegex)) 
        // return res.status(400).send({status: false, message: "Invalid pin code!"})

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

        // if (!address.billing.pincode.match(pincodeRegex)) 
        // return res.status(400).send({status: false, message: "Invalid pin code!"})


        let saveData = await userModel.create(data)

        return res.status(201).send({ status: true, msg: "User Creation Successful!", data: saveData })

    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}


///////////////////////getUser//////////////////////////




const getUserData = async function (req, res) {

    try {
        const id = req.params.userId

        if (!isValidObjectId(id)) {
            return res.status(400).send({ status: false, message: "Enter valid userid!" })
        }

        let userToken = req.userId

        if (userToken !== id) {
            return res.status(404).send({ status: false, message: "No user found!" })
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




/////////////////////Update Details ////////////////////////


const updateData = async function (req, res) {
    try {
        const id = req.params.userId
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send({ status: false, message: "Enter valid userId" })
        }

        const getUser = await userModel.findById({ _id: id })
        if (!getUser) {
            return res.status(404).send({ status: false, message: "No user found with given id" })
        }
        let data = req.body

        if (!isValidBody(data))
            return res.status(400).send({ status: false, message: "Please enter user datails!" });

        let { fname, lname, email, password, phone, address } = data

        let nameRegex = /^[a-zA-Z ]{2,30}$/;

        let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

        let passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/
            ;

        let phoneRegex = /^[6-9][0-9]{9}$/;

        let pincodeRegex = /^\d{6}$/;

        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "Please enter first name!" })
        }

        if (!fname.match(nameRegex))
            return res.status(400).send({ status: false, message: "First name must contain alphabets only!" })

        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "Please enter last name!" })
        }

        if (!lname.match(nameRegex))
            return res.status(400).send({ status: false, message: "Last name must contain alphabets only!" })

        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Please enter email!" })
        }

        if (!email.match(emailRegex))
            return res.status(400).send({ status: false, message: "Invalid email format!" })

        const emailInUse = await userModel.findOne({ email: email })

        if (emailInUse)
            return res.status(400).send({ status: false, message: "email already in use!" })

        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "Please enter password!" })
        }

        if (!password.match(passwordRegex))
            return res.status(400).send({ status: false, message: "Invalid password format! Password must be between 8 and 15 characters, and must contain one uppercase, one lowercase, special characters and number!" })



        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Please enter phone number!" })
        }

        if (!phone.match(phoneRegex))
            return res.status(400).send({ status: false, message: "Invalid phone number format!" })

        const phoneInUse = await userModel.findOne({ phone: phone })

        if (phoneInUse)
            return res.status(400).send({ status: false, message: "This phone number is already in use!" })


        if (!isValid(address)) {
            return res.status(400).send({ status: false, message: "Please enter address!" })
        }


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

        //  if (!address.shipping.pincode.match(pincodeRegex)) 
        // return res.status(400).send({status: false, message: "Invalid pin code!"})

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

        // if (!address.billing.pincode.match(pincodeRegex)) 
        // return res.status(400).send({status: false, message: "Invalid pin code!"})

        const updateDetails = await userModel.findOneAndUpdate({ _id: id }, req.body, { new: true })

        return res.status(200).send({ status: false, message: "Success", data: updateDetails })

    }


    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}


module.exports.createUser = createUser
module.exports.getUserData = getUserData
module.exports.updateData = updateData