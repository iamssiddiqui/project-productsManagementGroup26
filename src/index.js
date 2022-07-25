const express = require("express");

const bodyparser = require("body-parser");

const route = require("./route/route");

const { default: mongoose } = require("mongoose");

const app =express();

app.use(bodyparser.json());

mongoose.connect("mongodb+srv://functionupassignment:msJISmjxvX4gvZ9W@functionup.nyvlz.mongodb.net/group26Database", {
    useNewUrlparser: true
})

.then(()=> console.log("MongoDB is connected!"))

.catch ( err => console.log(err) )

app.use('/',route);

app.listen(process.env.PORT || 3000, function () 
{
    console.log('Express is running on port '+ (process.env.PORT || 3000))
});