// const { Router } = require('express');
const express = require('express');
const router = express.Router();
const BeneficiaryModel = require('../models/beneficiary_model')
const AppoinmentModel = require('../models/appoinment_model')
router.get('/temp',function(req,res){

    res.send({type:'GET'})
});



router.post('/registerBeneficiary',function(req,res,next){
    // console.log(req.body);
    BeneficiaryModel.create(req.body).then(function(beneficiary){
        res.send(`User ${beneficiary.get('name')} registered successfuly Beneficiaryid-${beneficiary.get('_id')}`)
    }).catch(next);
});


router.post('/bookAppoinment',function(req,res,next){
    // BeneficiaryModel.create(req.body).then(function(beneficiary){
    //     res.send(`User ${beneficiary.get('name')} registered successfuly Beneficiaryid-${beneficiary.get('_id')}`)
    // }).catch(next);
    BeneficiaryModel.findById({_id:req.body.id}).then(function(beneficiary){
        // console.log(`${bookAppoinment(beneficiary,req.body)} booked`)
        res.send(bookAppoinment(beneficiary,req.body))
    }).catch(next)
    // res.send(req.body)
});

function bookAppoinment(beneficiary,input){
    var centers=["Nungambakkam", "Tambaram", "Velachery", "Shozhinganallur"]
    var timeSlots=["9.30 am to 11.30am", "2pm to 4pm" , "6pm to 8pm"]
    if(beneficiary!='' && centers.indexOf(input.vaccineCenter !== -1 )&& timeSlots.indexOf(input.slot !== -1)){
        const appointment_centre = input.vaccineCenter
        const appoinment_date= input.date.replace(/ /g,'');
        const appoinmet_time=timeSlots.indexOf(input.slot);
        var doseType=0;
        var doseCount=0;

        switch(beneficiary.doses){
            case 0:
                doseType=1
                break;
            case 1:
                doseType=2
                break;
            default:
                return("Beneficiary is already vaaccinated with both the Doses ")
        }
         return AppoinmentModel.find({"vaccine_center_key":input.vaccineCenter,"vaccine_center_value.appoinment_date_key":appoinment_date,"vaccine_center_value.appoinment_date_value.appoinmet_time_key":appoinmet_time }).then(function(result){
            // console.log("result")
            console.log(result.length)
            if (result.length !=0){
                for(elements of result){
                    console.log("Making appoinment in already available slots")
                    firstdose_value=elements.get("vaccine_center_value.appoinment_date_value.appoinmet_time_value.firstdose_value");
                    seconddose_value=elements.get("vaccine_center_value.appoinment_date_value.appoinmet_time_value.seconddose_value");
                    timeslot_count=elements.get("vaccine_center_value.appoinment_date_value.appoinmet_time_count");
                    beneficiary.appoinmentSlot = appoinmet_time;
                    beneficiary.appoinmentDate = appoinment_date;
                    beneficiary.appoinmentCentre=input.vaccineCenter;

                // console.log(value.match(datePattern));
                    var totallDateDiff=dateDiff(input.date)

                    // console.log(input.date)
                    if (doseType ==1 && totallDateDiff < 90){
                        if (firstdose_value>0 && timeslot_count>0)
                        {
                            doseCount=firstdose_value -1
                            const updatedHash=updateHash(doseCount,seconddose_value,appoinmet_time,appoinment_date,input.vaccineCenter,timeslot_count -1)
                            beneficiary.doses=1;

                            // console.log(appoinmentUpdate(elements.get('_id'),beneficiary.get("_id"),updatedHash,beneficiary))
                            return appoinmentUpdate(elements.get('_id'),beneficiary.get("_id"),updatedHash,beneficiary);
                            
                        }else{
                           return "Slot is not available for dirst dose, try for a different date/time"
                        } 
                    }else{
                        var secondDoseTotalDateDiff=dateDiff(beneficiary.appoinmentDate);
                        if (seconddose_value>0 && timeslot_count>0 && secondDoseTotalDateDiff > 15 )
                        {
                            doseCount=seconddose_value-1
                            const updatedHash=updateHash(firstdose_value,doseCount,appoinmet_time,appoinment_date,input.vaccineCenter,timeslot_count -1)
                            beneficiary.doses=2;
                            // console.log( appoinmentUpdate(elements.get('_id'),beneficiary.get("_id"),updatedHash,beneficiary))
                            return appoinmentUpdate(elements.get('_id'),beneficiary.get("_id"),updatedHash,beneficiary);

                        }else{
                            return "Slot is not available for second dose, try for a different date/time"
                        } 
                    }
                }
            }else{
                // timeSlotAvailability=false;
                console.log("Creating new slots and making appoinment")
                firstdose_value=15
                seconddose_value=15
                if (doseType == 1) {
                    firstdose_value-=1 
                }else{
                     seconddose_value -=1
                }
                const appoinmentHash=updateHash(firstdose_value,seconddose_value,appoinmet_time,appoinment_date,input.vaccineCenter,9)
                // console.log(appoinmentHash)
                var appId="";
                AppoinmentModel.create(appoinmentHash).then(function(appoinment){
                    // return appoinment;
                    appId=appoinment._id
                })
                beneficiary.appoinmentSlot = appoinmet_time;
                beneficiary.appoinmentDate = appoinment_date;
                beneficiary.appoinmentCentre=input.vaccineCenter;
                beneficiary.doses=1;
                // console.log("beneficiary")
                // console.log(beneficiary)
                BeneficiaryModel.findByIdAndUpdate({_id:beneficiary.get("_id")},beneficiary).then(function(updatedBen){

                    // console.log("Create Slot")
                    // console.log(updatedBen)
                });
                return `Booked Appoinment ${appId}`

            }
        })

    }
}

function dateDiff(value){
    const datePattern = new RegExp('^[0-9]{2}\-[0-9]{2}\-[0-9]{4}');
    if (value.match(datePattern) !=null){
        var dateParts = value.split("-");
        const today = new Date();
        const inputDate = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
        var timeDiff =  inputDate.getTime()-today.getTime();
        return totallDateDiff = timeDiff / (1000 * 3600 * 24);
    }else {
        return "Date is not in proper format"
    }
     
}

function updateHash(firstdose_value,seconddose_value,time,date,vaccineCenter,timeslot_count){

    var dose ={}
    var appoinmentHash={};
    var dateSlot={};
    var timeSlot={};
    dose["firstdose_value"]=firstdose_value;
    dose["seconddose_value"]=seconddose_value;
    timeSlot["appoinmet_time_key"]=time
    timeSlot["appoinmet_time_value"]=dose
    timeSlot["appoinmet_time_count"]=timeslot_count;
    dateSlot["appoinment_date_key"]=date
    dateSlot["appoinment_date_value"]=timeSlot


    appoinmentHash["vaccine_center_key"]=vaccineCenter
    appoinmentHash["vaccine_center_value"]=dateSlot
    // console.log("appoinmentHash")
    // console.log(appoinmentHash,firstdose_value,seconddose_value)
    return appoinmentHash
}

function appoinmentUpdate(appoinment_id,beneficiary_id,updatedHash,beneficiary){
    console.log("appoinment_id")
    var appId="";
    AppoinmentModel.findByIdAndUpdate({_id:appoinment_id},updatedHash).then(function(updatedAppoinment){
        appId=updatedAppoinment._id
    });
    
    BeneficiaryModel.findByIdAndUpdate({_id:beneficiary_id},beneficiary).then(function(updatedBen){
        // console.log(updatedBen)
        // return updatedBen;
    });
    return `Booked Appoinment ${appId}`

}


module.exports = router;    