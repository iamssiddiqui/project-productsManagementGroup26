const productModel = require('../models/productmodel')
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
    if (value < 0) return false
    if (value % 1 == 0) return true;
}

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
            return res.status(400).send({ status: false, message: "Title already in use! Please provide unique title." })
        }

        // if(!isNaN(title)){
        //     return res.status(400).send({status:false,message:"Title can't be number"})
        // }

        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: "Please enter description!" })
        }

        if (!isValid(price)) {
            return res.status(400).send({ status: false, message: "Please enter price!" })
        }

        if (isNaN(price) || price < 0) {
            return res.status(400).send({ status: false, message: "Price should be a positive number!" })
        }

        data.price = Number(price).toFixed(2)

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


        let files = req.files
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

        //   console.log(availableSizes)
        let availableSizes = req.body.availableSizes.split(",").map(x => x.trim())
        //console.log(getSize)
        //console.log(availableSizes, data.availableSizes)

        for (let i = 0; i < availableSizes.length; i++) {

            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes[i]))) {
                console.log(availableSizes[i])
                return res.status(400).send({ status: false, message: "Size should be among ['S','XS','M','X','L','XXL','XL'] only!" })
            }

            // if (availableSizes.indexOf(availableSizes[i]) != i) {
            //     return res.status(400).send({ status: false, message: "Size not present!" })
            // }
        }
        data.availableSizes = availableSizes

        if (!isValid(installments)) {
            return res.status(400).send({ status: false, message: "Please enter installments!" })
        }

        // if (!validPresentInstallment) {
        //     return res.status(400).send({ status: false, message: "Installment required!" })
        // }

        if (!isValidInstallment) {
            return res.status(400).send({ status: false, message: "Installment must be a number!" })
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
        let filter = {}
        if (req.query) {

            let data = req.query

            // if (!isValidBody(data))
            // return res.status(400).send({ status: false, message: "Please enter query for filteration!" });
            let { name, size, priceSort, priceGreaterThan, priceLessThan } = data

            if (name) {
                if (!isValid(name)) {
                    return res.status(400).send({ status: false, message: "Enter product name" })
                }

                filter['title'] = name
                //  console.log(filter)
            }

            if (size) {
                if (!isValid(size)) {
                    return res.status(400).send({ status: false, message: "Enter size" })
                }

                filter['availableSizes'] = size.toUpperCase()
            }

            if (priceGreaterThan) {
                if (!isValid(priceGreaterThan)) {
                    return res.status(400).send({ status: false, messsage: "Enter value for priceGreaterThan field" })
                }

                filter['price'] = {
                    '$gt': priceGreaterThan
                }
            }

            if (priceLessThan) {
                if (!isValid(priceLessThan)) {
                    return res.status(400).send({ status: false, messsage: "Enter value for priceLessThan" })
                }

                filter['price'] = {
                    '$lt': priceLessThan
                }
            }

            if (priceLessThan && priceGreaterThan) {
                filter['price'] = { '$lt': priceLessThan, '$gt': priceGreaterThan }
            }

            if (priceSort) {
                if ((priceSort == 1 || priceSort == -1)) {
                    let filterProduct = await productModel.find({ filter, isDeleted: false }).sort({ price: priceSort })
                    // console.log(filterProduct)



                    if (!filterProduct) {
                        return res.status(404).send({ status: false, message: "No products found with this query" })
                    }

                    return res.status(200).send({ status: false, message: "Success", data: filterProduct })
                }

                return res.status(400).send({ status: false, message: "priceSort must have 1 or -1 as input" })
            }
        }

        console.log(filter)

        if (Object.keys(filter).length > 0) {
            let filterProduct = await productModel.find({ $and: [filter, { isDeleted: false }] })

            // console.log(filterProduct.length)
            if (filterProduct.length <= 0) {
                return res.status(404).send({ status: false, message: "No products found with given query" })
            }

            return res.status(200).send({ status: false, message: "Success", data: filterProduct })
        }


        let findProduct = await productModel.find({ isDeleted: false })
        console.log(findProduct)

        if (findProduct) {
            console.log(findProduct)
            return res.status(200).send({ status: false, message: "Success", data: findProduct })
        }
        else {
            return res.status(404).send({ status: false, message: "No products found with this query" })
        }


    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//////////////////////////////////  Get products using path params  /////////////////////////////////////////////

const getProductsByPath = async function (req, res) {
    try {
        let id = req.params.productId

        if (!isValidObjectId(id)) {
            return res.status(400).send({ status: false, message: "Invalid productId" })
        }

        let getProduct = await productModel.findById({ _id: id, isDeleted: false })

        if (!getProduct) {
            return res.status(404).send({ status: false, message: "Product not found !" })
        }

        return res.status(200).send({ status: true, message: "Success", data: getProduct })
    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

//////////////////////////////////////// Update products //////////////////////////////////////////////////////

const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!mongoose.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Enter valid userId" })
        }

        const getProduct = await productModel.findById({ _id: productId })
        if (!getProduct) {
            return res.status(404).send({ status: false, message: "No product found with given id" })
        }

        let data = req.body

        //  if (!isValidBody(data))
        //      return res.status(400).send({ status: false, message: "Please enter user datails!" });

        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments } = data

        if (title) {
            if (!isValid(title)) {
                return res.status(400).send({ status: false, message: "Please enter title!" })
            }

            let titleInUse = await productModel.findOne({ title })
            if (titleInUse) {
                return res.status(400).send({ status: false, message: "Title already in use! Please provide unique title." })
            }
        }
        if (description) {
            if (!isValid(description)) {
                return res.status(400).send({ status: false, message: "Please enter description!" })
            }
        }

        if (price) {
            if (!isValid(price)) {
                return res.status(400).send({ status: false, message: "Please enter price!" })
            }

            if (isNaN(price) || price < 0) {
                return res.status(400).send({ status: false, message: "Price should be a positive number!" })
            }
            data.price = Number(price).toFixed(2)
        }

        if (currencyId) {
            if (!isValid(currencyId)) {
                return res.status(400).send({ status: false, message: "Please enter currencyId!" })
            }

            if (currencyId != "INR") {
                return res.status(400).send({ status: false, message: "Currency must be in INR only" })
            }
        }

        if (currencyFormat) {
            if (!isValid(currencyFormat)) {
                return res.status(400).send({ status: false, message: "Please enter currency format!" })
            }

            if (currencyFormat != "₹") {
                return res.status(400).send({ status: false, message: "Currency must be in ₹ only" })
            }
        }

        if (isFreeShipping) {
            if (!isValid(isFreeShipping)) {
                return res.status(400).send({ status: false, message: "Please enter isFreeShipping!" })
            }
        }

        if (req.files) {
            let files = req.files
            if (files && files.length > 0) {
                let uploadedFileURL = await uploadFile(files[0])
                data.productImage = uploadedFileURL
            }
        }

        
        if (style) {
            if (!isValid(style)) {
                return res.status(400).send({ status: false, message: "Please enter style!" })
            }
        }

        if (availableSizes) {
            if (!isValid(availableSizes)) {
                return res.status(400).send({ status: false, message: "Please enter atleast 1 Size!" })
            }

            let availableSize = req.body.availableSizes.split(",").map(x => x.trim())

            for (let i = 0; i < availableSize.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSize[i]))) {
                  //  console.log(availableSize[i])
                    return res.status(400).send({ status: false, message: "Size should be among ['S','XS','M','X','L','XXL','XL'] only!" })
                }

                if (availableSize.indexOf(availableSize[i]) != i) {
                    return res.status(400).send({ status: false, message: "Size not present!" })
                }
            }
            data.availableSizes = availableSize
        }

        if (installments) {
            if (!isValid(installments)) {
                return res.status(400).send({ status: false, message: "Please enter installments!" })
            }

            if (!validPresentInstallment) {
                return res.status(400).send({ status: false, message: "Installment required!" })
            }

            if (!isValidInstallment) {
                return res.status(400).send({ status: false, message: "Installment must be a number!" })
            }
        }

        const updatedProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, data, { new: true })
        res.send({ data: updatedProduct })
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
            return res.status(400).send({ status: false, message: "Invalid productId" })
        }

        const deleteData = await productModel.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true })

        if (!deleteData) {
            return res.status(404).send({ status: false, message: "No product found with given id !!" })
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



