const jwt = require("jsonwebtoken");
const { isValidObjectId } = require("mongoose");

const middleware = async function (req, res, next) {
    try {
        let token = req.headers.authorization
        if (!token) return res.status(401).send({status: false, message: "JWT must be present!"});

        let splitToken = token.split(" ")

        jwt.verify(splitToken[1], "group26Project", (error, decode) => {
      if (error) {
        return res.status(401).send({status: false, message: error.message})
      } 
      
      else {
        req.decodeToken = decode
        
        next()
      }
    })
  }

  catch (err) {
    return res.status(500).send({ msg: "Error", error: err.message })
  }
}

const authorization = async function (req,res,next){
  let userLoggedIn = req.decodeToken
  let user = req.params.userId

  if(!isValidObjectId(user)){
    return res.status(400).send({status:false,message:"Enter valid userId"})
  }
 
  if(userLoggedIn.userId != user){
    return res.status(400).send({status:false,message:"Currently logged in user is unauthorized to perform this action"})
  }
  next()
}

module.exports.middleware = middleware
module.exports.authorization = authorization
