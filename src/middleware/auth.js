const jwt = require("jsonwebtoken");

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

module.exports.middleware = middleware

