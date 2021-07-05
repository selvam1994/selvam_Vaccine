const express = require('express');
const router = express.Router();
const BeneficiaryModel = require('../models/beneficiary_model')
var apphelper =require('../helper/appoinmentHelper')

router.post('/registerBeneficiary',function(req,res,next){
    // console.log(req.body);
    BeneficiaryModel.create(req.body).then(function(beneficiary){
        res.send(`User ${beneficiary.get('name')} registered successfuly Beneficiaryid-${beneficiary.get('_id')}`)
    }).catch(next);
});

router.post('/bookAppoinment',function(req,res,next){
    BeneficiaryModel.findById({_id:req.body.id}).then(function(beneficiary){
        apphelper.bookAppoinment(beneficiary,req.body).then((appoinmentResp)=>{
            res.send(appoinmentResp)
        })
        // res.send(beneficiary)
    }).catch(next)
    // res.send("need to focus")
})

router.post('/')

module.exports = router;    