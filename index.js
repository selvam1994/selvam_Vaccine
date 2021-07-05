const express = require('express');
const routes = require('./routes/rewriteapi')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');


const app=express();
app.use(express.json())
app.use(routes);

mongoose.connect('mongodb://localhost/vaccine')
mongoose.Promise=global.Promise;

app.use(function(err,req,res,next){
    res.send({error: err.message})
})

app.listen(4000,function(){
    console.log("nodemon ")
});