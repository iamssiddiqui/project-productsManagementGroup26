const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt')
const aws = require('aws-sdk')

const { default: mongoose } = require("mongoose");

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

aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        // this function will upload file to aws and return the link
        let s3 = new aws.S3({ apiVersion: '2006-03-01' }); // we will be using the s3 service of aws

        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",  //HERE
            Key: "abc/" + file.originalname, //HERE 
            Body: file.buffer
        }


        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }

            return resolve(data.Location)
        })

        // let data= await s3.upload( uploadParams)
        // if( data) return data.Location
        // else return "there is an error"

    })
}


const createUser = async function (req, res) {

    try {
        let data = req.body

        if (!isValidBody(data))
            return res.status(400).send({ status: false, message: "Please enter user datails!" });

        let { fname, lname, email, password, phone } = data

        let nameRegex = /^[a-zA-Z ]{2,30}$/;

        let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

        let passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/;

        let phoneRegex = /^[6-9][0-9]{9}$/;

        let pincodeRegex = /^[1-9][0-9]{5}$/;

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

        let files = req.files
        if (files && files.length > 0) {
            //upload to s3 and get the uploaded link
            // res.send the link back to frontend/postman
            let uploadedFileURL = await uploadFile(files[0])
            req.body.profileImage = uploadedFileURL
        }

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

        //   console.log(typeof data.address)
        let address = JSON.parse(req.body.address)
        //  console.log(typeof address,address.shipping.pincode)

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

      //  console.log(data, typeof address)
        const obj = {
            fname: fname,
            lname: lname,
            email: email,
            profileImage: req.body.profileImage,
            password: (await bcrypt.hash(password, 10)).toString(),
            address: address,
            phone: phone
        }

        let saveData = await userModel.create(obj)

        return res.status(201).send({ status: true, msg: "User Creation Successful!", data: saveData })

    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

/////////////////////////login//////////////////////////

const loginUser = async function (req, res) {
    try {
        const data = req.body;

        if (!isValidBody(data)) {
            return res.status(400).send({ status: false, msg: "Please provide login credentials!" })
        }

        let { email, password } = data

        if (!isValid(email)) {
            return res.status(400).send({ status: false, msg: "Please provide email!" })
        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, msg: "Please provide password!" })
        }

        const checkCredentials = await userModel.findOne({ email: data.email, password: data.password });

        if (!checkCredentials) {
            return res.status(400).send({ status: false, msg: "Invalid login data!" })
        }

        let token = jwt.sign(
            {
                userId: checkCredentials._id,
                exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
            }, "group26Project")

        return res.status(200).send({ status: true, message: "Success", data: { userId: checkCredentials._id, token: token }, });
    }

    catch (error) {
        console.log(err.message);
        return res.status(500).send({ status: false, message: "Error", error: error.message });
    }
}


///////////////////////getUser//////////////////////////




const getUserData = async function (req, res) {

    try {
        const id = req.params.userId

        if (!isValidObjectId(id)) {
            return res.status(400).send({ status: false, message: "Enter valid userid!" })
        }

        let userToken = req.params.userId

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

        let { fname, lname, email, profileImage, password, phone, address } = data

        let nameRegex = /^[a-zA-Z ]{2,30}$/;

        let emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

        let passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,15}$/;

        let phoneRegex = /^[6-9][0-9]{9}$/;

        let pincodeRegex = /^[1-9][0-9]{5}$/;

        if (fname) {
            if (!isValid(fname)) {
                return res.status(400).send({ status: false, message: "Please enter first name!" })
            }

            if (!fname.match(nameRegex))
                return res.status(400).send({ status: false, message: "First name must contain alphabets only!" })
        }
        
        if (lname) {
            if (!isValid(lname)) {
                return res.status(400).send({ status: false, message: "Please enter last name!" })
            }

            if (!lname.match(nameRegex))
                return res.status(400).send({ status: false, message: "Last name must contain alphabets only!" })
        }

        if (email) {
            if (!isValid(email)) {
                return res.status(400).send({ status: false, message: "Please enter email!" })
            }

            if (!email.match(emailRegex))
                return res.status(400).send({ status: false, message: "Invalid email format!" })

            const emailInUse = await userModel.findOne({ email: email })

            if (emailInUse)
                return res.status(400).send({ status: false, message: "email already in use!" })
        }

        if(profileImage){
            let files = req.files
            if (files && files.length > 0) {
                //upload to s3 and get the uploaded link
                // res.send the link back to frontend/postman
                let uploadedFileURL = await uploadFile(files[0])
                req.body.profileImage = uploadedFileURL
            }

        }

        if (password) 
        {
            if (!isValid(password)) {
                return res.status(400).send({ status: false, message: "Please enter password!" })
            }

            if (!password.match(passwordRegex))
                return res.status(400).send({ status: false, message: "Invalid password format! Password must be between 8 and 15 characters, and must contain one uppercase, one lowercase, special characters and number!" })
                password = (await bcrypt.hash(password, 10)).toString()
        }

        if (phone) {
            if (!isValid(phone)) {
                return res.status(400).send({ status: false, message: "Please enter phone number!" })
            }

            if (!phone.match(phoneRegex))
                return res.status(400).send({ status: false, message: "Invalid phone number format!" })

            const phoneInUse = await userModel.findOne({ phone: phone })

            if (phoneInUse)
                return res.status(400).send({ status: false, message: "This phone number is already in use!" })
        }

        if (address) {
            
               address = JSON.parse(req.body.address)

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

              if (!address.shipping.pincode.toString().match(pincodeRegex)) 
             return res.status(400).send({status: false, message: "Invalid pin code!"})

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
         return res.status(400).send({status: false, message: "Invalid pin code!"})

        }

        const obj = {
            fname: fname,
            lname: lname,
            email: email,
         // profileImage: req.body.profileImage,
         password:password,
            address: address,
            phone: phone
        }

        const updateDetails = await userModel.findOneAndUpdate({ _id: id }, obj, { new: true })

        return res.status(200).send({ status: false, message: "User details updated!", data: updateDetails })
    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}


module.exports.createUser = createUser
module.exports.getUserData = getUserData
module.exports.updateData = updateData
module.exports.loginUser = loginUser