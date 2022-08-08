const productModel = require('../models/productModel')
const mongoose = require("mongoose")

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
    if (value <= 0) return false
    if (value % 1 == 0) return true;
}

const isValidInstallment = function (value) {
    if (value < 0) return false;
    if (value == 1) return false;
    if (value % 1 == 0) return true;

}

let wordRegex = /^[a-zA-Z\s]*$/;
let imageUrlRegex = /(https?:\/\/.*\.)(jpg|jpeg|png)/

////////////////////////////////////// createProduct /////////////////////////////////////////////////

const createProduct = async function (req, res) {
    try {
        let data = req.body



        if (!isValidBody(data))
            return res.status(400).send({ status: false, message: "Please enter user datails!" });

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, installments } = data

        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: "Please enter title!" })
        }

        let titleInUse = await productModel.findOne({ title })
        if (titleInUse) {
            return res.status(400).send({ status: false, message: `${title} is already in use.Enter another title` })
        }

        if (!title.match(wordRegex))
            return res.status(400).send({ status: false, message: "Title must contain alphabets only!" })

                     data.title = title.replace(/\s+/, ' ').trim()

        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: "Please enter description!" })
        }

        if (!description.match(wordRegex))
            return res.status(400).send({ status: false, message: "Description must contain alphabets only!" })

        if (!isValid(price)) {
            return res.status(400).send({ status: false, message: "Please enter price!" })
        }

        if (price == 0) {
            return res.status(400).send({ status: false, message: "Price of product can't be zero" })
        }

        if (!price.match(/^\d{0,8}(\.\d{1,2})?$/)) {
            return res.status(400).send({ status: false, message: "Price  you have set is not valid" })
        }

        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "Please enter currencyId!" })
        }

        if (currencyId != "INR") {
            return res.status(400).send({ status: false, message: "Currency must be in INR only" })
        }

        if (!isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "Please enter currency format!" })
        }

        if (currencyFormat != "₹") {
            return res.status(400).send({ status: false, message: "Currency must be in ₹ only" })
        }

        if (!isValid(isFreeShipping)) {
            return res.status(400).send({ status: false, message: "Please enter isFreeShipping!" })
        }

        if ((isFreeShipping) != 'true' && isFreeShipping != 'false') {
            return res.status(400).send({ status: false, message: "isFreeShipping must be a boolean type" })
        }

        let files = req.files
        if(files.length == 0){return res.status(400).send({status:false, message: "productImage needed" })}
        if (files && files.length > 0) {
            let uploadedFileURL = await uploadFile(files[0])
            data.productImage = uploadedFileURL
        }

        if (!isValid(style)) {
            return res.status(400).send({ status: false, message: "Please enter style!" })
        }

        if (!isValid(req.body.availableSizes)) {
            return res.status(400).send({ status: false, message: "Please enter atleast 1 Size!" })
        }

        let availableSizes = req.body.availableSizes.split(",").map(x => x.trim())

        for (let i = 0; i < availableSizes.length; i++) {

            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes[i]))) {
                console.log(availableSizes[i])
                return res.status(400).send({ status: false, message: "Size should be among ['S','XS','M','X','L','XXL','XL'] only!" })
            }

            if (availableSizes.indexOf(availableSizes[i]) != i) {
                return res.status(400).send({ status: false, message: "Size not present!" })
            }
        }
        data.availableSizes = availableSizes

        if (!isValid(installments)) {
            return res.status(400).send({ status: false, message: "Please enter installment!" })
        }

        if (!isValidInstallment(installments)) {
            return res.status(400).send({ status: false, message: "Installment must be a natural number!" })
        }

        if (!validPresentInstallment(installments)) {
            return res.status(400).send({ status: false, message: "Installment must be present!" })
        }



        let saveData = await productModel.create(data)

        return res.status(201).send({ status: true, message: "Product created successfully", data: saveData })

    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

//////////////////////////////////  Get products using query params  /////////////////////////////////////////////

const getProductByQuery = async function (req, res) {
      
    try {
          
        const queryData = req.query
          
        let filter = { isDeleted: false }
        let { size,name,priceGreaterThan,priceLessThan,priceSort} = queryData
    
        if(name){   
            if(!isValid(name)){
                return res.status(400).send({status: false, message: "Please enter name correctly"})
                }

            filter['title'] = {}
            filter['title']['$regex'] = name; 
            filter['title']['$options'] = 'i'
        }
 
  
        if (size) { let size1 = size.split(",").map(x => x.trim().toUpperCase()) 
        if (size1.map(x => isValid(x)).filter(x => x === false).length !== 0) 

        return res.status(400).send({ status: false, message: "Size Should be among S,XS,M,X,L,XXL,XL" }) 
        filter['availableSizes'] = { $in: size1 } } 
  
        if(priceGreaterThan){
            if(!isValid(priceGreaterThan)){
                return res.status(400).send({ status: false, message: "Please enter a price greater than" }) 
            }

            if(!(isNum(priceGreaterThan))){
                return res.status(400).send({ status: false, message: "Please enter a number in priceGreaterThan" })
            }

            if(!(filter.hasOwnProperty('price'))){
                filter['price'] = {}   
            }

            filter['price']['$gt'] = Number(priceGreaterThan)
    
        }
  
        if(priceLessThan){
            if(!isValid(priceLessThan)){
                return res.status(400).send({ status: false, message: "Please enter a valid priceLessThan" }) 
            }
            
            if(!(isNum(priceLessThan))){
                return res.status(400).send({ status: false, message: "Please enter a number in priceGreaterThan"})
            }

            if(!(filter.hasOwnProperty('price'))){
                filter['price'] = {}
            }
    
            filter['price']['$lt'] = Number(priceLessThan);
        }
  
        if(priceSort){
            if(!(priceSort == 1  || priceSort == -1)){
                return res.status(404).send({ status: false, message: "Price sort can be only 1 or -1" });
                } 
            }
    
            let Products = await productModel.find(filter).sort({price: priceSort})
            if (Products.length == 0) {
                return res.status(404).send({ status: false, message: "No products found" })
            }  
        return res.status(200).send({ status: true, message: "Success", data: Products })    
        }
        
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


//////////////////////////////////  Get products using path params  /////////////////////////////////////////////

const getProductsByPath = async function (req, res) {
    try {
        let id = req.params.productId

        if (!isValidObjectId(id)) {
            return res.status(400).send({ status: false, message: "Invalid productId" })
        }

        let getProduct = await productModel.findOne({ _id: id, isDeleted: false })

        if (!getProduct) {
            return res.status(404).send({ status: false, message: "Product not found!" })
        }

        return res.status(200).send({ status: true, message: "Success", data: getProduct })
    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

//////////////////////////////////////// Update products ////////////////////////////////////////

const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Enter valid productId" })
        }

        const getProduct = await productModel.findById({ _id: productId, isDeleted:false })
        if (!getProduct) {
            return res.status(404).send({ status: false, message: "No product found with given id" })
        }

        let data = req.body
        let obj = {}

        if (data && !req.files) {
            if (!isValidBody(data))
                return res.status(400).send({ status: false, message: "Please enter user details!" });
        }

        let { title, description, price,currencyId,currencyFormat, isFreeShipping, style, availableSizes, installments } = data

        if (title || title == '') {
            if (!isValid(title)) {
                return res.status(400).send({ status: false, message: `Enter vaid title !` })
            }

            let titleInUse = await productModel.findOne({ title })
            if (titleInUse) {
                return res.status(400).send({ status: false, message: "Title already in use! Please provide unique title." })
            }

            if (!title.match(wordRegex))
                return res.status(400).send({ status: false, message: "Title must contain alphabets only!" })

            obj['title'] = title.replace(/\s+/, ' ').trim()
        }

        if (description || description == '') {
            if (!isValid(description)) {
                return res.status(400).send({ status: false, message: "Please enter description!" })
            }

            if (!description.match(wordRegex))
                return res.status(400).send({ status: false, message: "Description must contain alphabets only!" })

            obj['description'] = description
        }

        if (price || price == '') {
            if (!isValid(price)) {
                return res.status(400).send({ status: false, message: "Please enter price!" })
            }
            if (price == 0) {
                return res.status(400).send({ status: false, message: "Price of product can't be zero" })
            }

            if (!price.match(/^\d{0,8}(\.\d{1,2})?$/)) {
                return res.status(400).send({ status: false, message: "Price  you have set is not valid" })
            }


            if (isNaN(price) || price < 0) {
                return res.status(400).send({ status: false, message: "Price should be a positive number!" })
            }
 
                  obj['price'] = price
        }

                if (currencyId || currencyId == '') 
                {
                    if (!isValid(currencyId)) {
                        return res.status(400).send({ status: false, message: "Please enter currencyId!" })
                    }
        
                    if (currencyId != "INR") {
                        return res.status(400).send({ status: false, message: "Currency must be in INR only" })
                    }
                          
                    obj['currencyId'] = 'INR'
                }
        
                if (currencyFormat || currencyFormat == '') {
                    if (!isValid(currencyFormat)) {
                        return res.status(400).send({ status: false, message: "Please enter currency format!" })
                    }
        
                    if (currencyFormat != "₹") {
                        return res.status(400).send({ status: false, message: "Currency must be in ₹ only" })
                    }

                    obj['currencyFormat'] = '₹'
                }
        


        if (isFreeShipping || isFreeShipping == '') {
            if (!isValid(isFreeShipping)) {
                return res.status(400).send({ status: false, message: "Please enter isFreeShipping!" })
            }
        }

        if (req.files) {
            let files = req.files
            if(files.length == 0){return res.status(400).send({status:false, message: "productImage needed" })}
            if (files && files.length > 0) {
                let uploadedFileURL = await uploadFile(files[0])
                data.productImage = uploadedFileURL
            }
        }


        if (style || style == '') {
            if (!isValid(style)) {
                return res.status(400).send({ status: false, message: "Please enter style!" })
            }

            obj['style'] = style
        }

        if (availableSizes || availableSizes == '') {
            if (!isValid(availableSizes)) {
                return res.status(400).send({ status: false, message: "Please enter atleast 1 Size!" })
            }

            let availableSize = req.body.availableSizes.split(",").map(x => x.trim())

            for (let i = 0; i < availableSize.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSize[i]))) {
                    console.log(availableSize[i])
                    return res.status(400).send({ status: false, message: "Size should be among ['S','XS','M','X','L','XXL','XL'] only!" })
                }

                if (availableSize.indexOf(availableSize[i]) != i) {
                    return res.status(400).send({ status: false, message: "Size not present!" })
                }
            }

            obj['availableSizes'] = availableSize
        }


        if (installments || installments == '') {
            
            if (!isValid(installments)) {
                return res.status(400).send({ status: false, message: "Please enter installments!" })
            }
            if (!isValidInstallment(installments)) {
                return res.status(400).send({ status: false, message: "Installment must be a natural number!" })
            }

            if (!validPresentInstallment(installments)) {
                return res.status(400).send({ status: false, message: "Installment must be present!" })
            }
            obj['installments'] = installments
        }

        const updatedProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, obj, { new: true })

        if(!updatedProduct){
            return res.status(404).send({status:false,message:"Product not found !"})
        }
        return res.status(200).send({ status: true, message: "success", data: updatedProduct })
    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}


/////////////////////////////////// Delete products using path params /////////////////////////////////////////

const deleteProduct = async function (req, res) {
    try {
        let id = req.params.productId

        if (!isValidObjectId(id)) {
            return res.status(400).send({ status: false, message: "Please enter valid product Id" })
        }

        const deleteData = await productModel.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true })

        if (!deleteData) {
            return res.status(404).send({ status: false, message: "Product not found !" })
        }

        return res.status(200).send({ status: true, message: "Success", data: deleteData })
    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}


module.exports.createProduct = createProduct
module.exports.getProductByQuery = getProductByQuery
module.exports.getProductsByPath = getProductsByPath
module.exports.updateProduct = updateProduct
module.exports.deleteProduct = deleteProduct



