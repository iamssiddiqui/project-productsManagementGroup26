const productModel = require('../models/productmodel')
const ObjectId = require("mongoose").Types.ObjectId

const { uploadFile } = require("./aws")

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

const validPresentInstallment = function (value) {
if (value <=0) return false
if (value % 1 == 0) return true;
}
const isValidInstallment = function (value) {
  if (value <0) return false
  if (value % 1 == 0) return true;
  }

const isValidEntry=function(value, data){
    return Object.keys(data).includes(value)
} 


///////////////////createProduct///////////////////////////

const createProduct = async function (req, res) {
    try {
        let data = req.body
        let file = req.files

        if (!isValidBody(data))
            return res.status(400).send({ status: false, message: "Please enter user datails!" });

            let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments} = data

            if (!isValid(title)) {
            return res.status(400).send({ status: false, message: "Please enter title!" })
        }

        let titleInUse = await productModel.findOne({title})
        if (titleInUse) {
            return res.status(400).send({status: false, message: "Title already in use! Please provide unique title."})
        }

        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: "Please enter description!" })
        }

        if (!isValid(price)) {
            return res.status(400).send({ status: false, message: "Please enter price!" })
        }

        if (isNaN(price)|| price < 0) {
            return res.status(400).send({status: false, message: "Price should be a positive number!"})
        }

        data.price = Number(price).toFixed(2)

        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "Please enter currencyId!" })
        }

        if (currencyId != "INR") {
            return res.status(400).send({status: false, message: "Currency must be in INR only"})
        }

        if (!isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "Please enter currency format!" })
        }

        if (currencyFormat != "₹") {
            return res.status(400).send({status: false, message: "Currency must be in ₹ only"})
        }

        if (!isValid(isFreeShipping)) {
            return res.status(400).send({ status: false, message: "Please enter isFreeShipping!" })
        }

        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await uploadFile(files[0])
            req.body.profileImage = uploadedFileURL
        }

        if (!isValid(style)) {
        return res.status(400).send({ status: false, message: "Please enter style!" })
        }

        if (!isValid(availableSizes)) {
            return res.status(400).send({ status: false, message: "Please enter atleast 1 Size!" })
        }

        let availableSize = ['S','XS','M','X','L','XXL','XL']
        let getSize = availableSize.split(",").map(x => x.trim())
        //console.log(getSize)

        for (let i = 0; i < getSize.length; i++) {

            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(getSize[i]))) 
            {
                console.log(getSize[i])
                return res.status(400).send({ status: false, message: "Size should be among ['S','XS','M','X','L','XXL','XL'] only!" })
            }

            if (getSize.indexOf(getSize[i]) != i) {
                return res.status(400).send({ status: false, message: "Size not present!" })
            }
        }

        data['availableSize'] = [...getSize]

        if (!isValid(installments)) {
            return res.status(400).send({ status: false, message: "Please enter installments!" })
        }

        if (!validPresentInstallment){
             return res.status(400).send({ status: false, message: "Installment required!" })
         }

         if (!isValidInstallment) {
            return res.status(400).send({ status: false, message: "Installment must be a number!" })
         }

        let saveData = await productModel.create(data)

        return res.status(201).send({status: true, message: "Product created successfully", data: saveData})

    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}


module.exports.createProduct = createProduct