const productModel = require('../models/productmodel')
const ObjectId = require("mongoose").Types.ObjectId

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


///////////////////createProduct///////////////////////////

const createProduct = async function (req, res) {
    try {
        let data = req.body

        let saveData = await productModel.create(data)

        return res.status(201).send({status: true, message: "Product created successfully", data: saveData})

    }

    catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}
