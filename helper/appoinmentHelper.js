const { create } = require('../models/appoinment_model')
const AppoinmentModel = require('../models/appoinment_model')
const BeneficiaryModel = require('../models/beneficiary_model')

module.exports.resheduleAppoinments= async function(beneficiary, input){
    console.log("Inside Resheduling block")
    availableSlot=['9.30 am to 11.30am','2pm to 4pm','6pm to 8pm']
    console.log(beneficiary)
    var apptSearch=await AppoinmentModel.find({_id:beneficiary.appoinmentId})
    console.log(apptSearch)
    if(apptSearch.length ==1){
        if (beneficiary.doses==1){
            beneficiary.doses==0
            var result=await this.bookAppoinment(beneficiary,input)
            console.log(result)
            if (result.includes("Appoinment booked")){
                const appoinmentHash = createHash(input)
                var slotkey=  "'branchValue.appDateValue.slots."+availableSlot.indexOf(beneficiary.appoinmentSlot)+"':1";
                var updateAppt=await AppoinmentModel.findOneAndUpdate({_id:beneficiary.appoinmentId},{ $inc: {"branchValue.appDateValue.firstDose" : 1 
            }})
                return result
            }else{
                return `unable to reschedule appoinment ${result}`
            }
        }else if (beneficiary.doses==2){
            beneficiary.doses==1
            // bookAppoinment(beneficiary,input)
        }else{
            return "something not correct in beneficiary details"
        }
    }else{
        return "appoinment not found pls provide a valid appoinment date"
    }
}

module.exports.bookAppoinment= async function (beneficiary, input){
    console.log("inside bookAppoinment")
    availableSlot=['9.30 am to 11.30am','2pm to 4pm','6pm to 8pm']

    if (availableSlot.indexOf(input.slot)>=0){
        input['slotMap']=availableSlot.indexOf(input.slot);
    }else{
        return "Pls try again with a valid time Slot"
    }
    var apptSearch=await AppoinmentModel.find({"branchKey":input.vaccineCenter,"branchValue.appDateKey":input.date.replace(/ /g,'') })
    console.log(apptSearch.length);
    
    if (apptSearch.length == 1){
        console.log("Entry exists in DB")
        apptEntry=apptSearch[0]
        beneficiaryDose=beneficiary.doses
        var firstDose=apptEntry.get('branchValue.appDateValue.firstDose')
        var secondDose =apptEntry.get('branchValue.appDateValue.secondDose')
        // input['timeslotCount']=apptEntry.get('branchValue.appDateValue.timeslotValue.')
        input['slot0']=apptEntry.get('branchValue.appDateValue.slots.0')
        input['slot1']=apptEntry.get('branchValue.appDateValue.slots.1')
        input['slot2']=apptEntry.get('branchValue.appDateValue.slots.2')

        if (apptEntry.get('branchValue.appDateValue.slots.'+input.slotMap)>0){
            input['slot'+input.slotMap]-=1;
        }else{
            return `Slot ${availableSlot[input.slotMap]} is completely booked , pls try for a different slot`
        }
        console.log(dateDiff(input.date,null))
        if (beneficiary.doses==0 ){
            if(firstDose >0){
                if (dateDiff(input.date,null) <= 90 && dateDiff(input.date,null) > 0){
                    firstDose-=1
                    beneficiary.doses=1
                }else{
                    return "pls enter a valid appoinkment date for firts dose 90 days from today "
                }
            }else{
                return `Dear ${beneficiary.name} First Dose is not available for the date:${input.date} selected slot: ${input.slot}`
            }
        }else if (beneficiary.doses==1 ){
            if(secondDose >0){
                if (dateDiff(input.date,beneficiary.appoinmentDate)  > 15){
                    secondDose-=1
                    beneficiary.doses=2
                }else{
                    return "pls enter a valid appoinkment date for second dose 15 days after first dose "
                }
            }else{
                return `Dear ${beneficiary.name} Second Dose is not available for the date:${input.date} selected slot: ${input.slot}`
            }
        }else{
            return "Beneficiary has been vaccinated with both the doses  or difference between vaccination doses is 90/15"
        }
        input['firstDose']=firstDose
        input['secondDose']=secondDose
        const appoinmentHash = createHash(input)
        var updateAppt=await AppoinmentModel.findByIdAndUpdate({_id:apptEntry._id},appoinmentHash)
        beneficiary.appoinmentSlot = input.slot
        beneficiary.appoinmentDate = input.date
        beneficiary.appoinmentCenter = input.vaccineCenter
        beneficiary.appoinmentId = updateAppt.id
        var updateBenef= await BeneficiaryModel.findByIdAndUpdate({_id:beneficiary._id},beneficiary)
        return `Appoinment booked ${updateAppt.id}`
    }else if(apptSearch.length == 0){
        console.log("Making new entry in DB")

        var secondDose,firstDose ;
        firstDose=15
        secondDose=15
        input['slot0']=10;
        input['slot1']=10;
        input['slot2']=10;
        console.log(beneficiary,dateDiff(input.date,null))
        if (beneficiary.doses==0 ){
            if (dateDiff(input.date,null) <= 90 && dateDiff(input.date,null) > 0){
                firstDose-=1
                beneficiary.doses=1
            }else{
                return "pls enter a valid appoinkment date for firts dose 90 days from today "
            }
        }else if (beneficiary.doses==1){
            if (dateDiff(input.date,beneficiary.appoinmentDate)  > 15){
                secondDose-=1
                beneficiary.doses=2
            }else{
                return "pls enter a valid appoinkment date for second dose 15 days after first dose "
            }

        }else{
            return "Beneficiary has been vaccinated with both the doses "
        }
        switch(input.slotMap){
            case 0:
                input.slot0-=1
                break;
            case 1:
                input.slot1-=1
                break;
            case 2:
                input.slot2-=1
                break;
            default:
                console.log("issue while identifying slots");
            
        }
        input['firstDose']=firstDose
        input['secondDose']=secondDose
        // input['timeslotCount']=9;


        const appoinmentHash = createHash(input)
        var appoinmet = await AppoinmentModel.create(appoinmentHash)
        beneficiary.appoinmentSlot = input.slot
        beneficiary.appoinmentDate = input.date
        beneficiary.appoinmentCenter = input.vaccineCenter
        beneficiary.appoinmentId = appoinmet.id
        var updateBenef= await BeneficiaryModel.findByIdAndUpdate({_id:beneficiary._id},beneficiary)
        return `Appoinment booked ${appoinmet.id}`
    }else{
        return "What were you thinking?  check the DB structure"
    }
    
}

 function createHash(input){
    // opFlag=(opType=="create")?true:false;
    totalDoseCount={}
    totalDoseCount[0]=input.slot0;
    totalDoseCount[1]=input.slot1;
    totalDoseCount[2]=input.slot2;
    timeSlot={}
    // const timeslotKey=input.slot;
    timeSlot["firstDose"]=input.firstDose;
    timeSlot["secondDose"]=input.secondDose;
    timeSlot["slots"]=totalDoseCount;
    // timeSlot["timeslotKey"]=timeslotKey.replace(/ /g,'');
    // timeSlot["timeslotCount"]=input.timeslotCount;
    appDate={}
    const appDateKey=input.date 
    appDate["appDateValue"]=timeSlot;
    appDate["appDateKey"]=appDateKey.replace(/ /g,'');
    branch={};
    const branchkey=input.vaccineCenter;
    branch["branchValue"]=appDate;
    branch["branchKey"]=branchkey;
    return branch
}

function dateDiff(value,key){
    const datePattern = new RegExp('^[0-9]{2}\-[0-9]{2}\-[0-9]{4}');
    var today;
    console.log(value,key)
    if (value.match(datePattern) !=null ) {
        if (key == null){
            today = new Date()
        }else{
            var dateKeyParts = key.split("-");
            today = new Date(+dateKeyParts[2], dateKeyParts[1] - 1, +dateKeyParts[0]);
        }
        var dateParts = value.split("-");
        const inputDate = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
        var timeDiff =  inputDate.getTime()-today.getTime();
        return totallDateDiff = timeDiff / (1000 * 3600 * 24);
    }else {
        return "Date is not in proper format"
    }
     
}