const mongoose = require('mongoose');
const Schema= mongoose.Schema;

const BeneficiarySchema = new Schema ({
    name:{
        type: String,
        required: [true, 'Name feild is required']
    },
    dob:{
        type:  String,
        validate:{
            validator: function(value){
                // console.log(value)
                const datePattern = new RegExp('^[0-9]{2}\-[0-9]{2}\-[0-9]{4}');
                // console.log(value.match(datePattern));
                if (value.match(datePattern) !=null){
                    const today = new Date();
                    var dateParts = value.split("-");
                    const inputdob = new Date(+dateParts[2], dateParts[1] - 1, +dateParts[0]);
                    var age = today.getFullYear() - inputdob.getFullYear();
                    const month = today.getMonth() - inputdob.getMonth();
                    // console.log(age)
                    if (month < 0 || (month === 0 && today.getDate() < inputdob.getDate())) 
                    {
                        age--;
                    }
                    if (age > 45){
                        return true;
                    }else{
                        return null;
                    }
                }else{
                    return null
                }
            },
            message: props => `${props.value} registration is only for people of age 45+`
        },
        required: [true, 'DOB feild is required']
    },
    aadhar:{
        type: String,
        validate:{
            validator: function(value){
                const aadharPattern = new RegExp('^[0-9]{12}');
                return value.match(aadharPattern);
            },
            message: props => `${props.value} Aadhar number is either Invalid/Incorrect`
        },
        required: [true, 'Aadhar identification feild is required']
    },
    phoneNumber:{
        type: String,
        validate:{
            validator: function(value){
                const numberPattern = new RegExp('^[0-9]{10}');
                return value.match(numberPattern);
            },
            message: props => `${props.value} Phone number is either Invalid/Incorrect`
        },
        required: [true, 'Phone Number feild is required']
    },
    doses:{
        type:Number,
        default: 0,
        min:0,
        max:2
    },appoinmentSlot:{
        type:String,
        default: ''
    },appoinmentDate:{
        type:String,
        default: ''
    },appoinmentCentre:{
        type:String,
        default: ''
    }
})



const BeneficiaryModel = mongoose.model('user', BeneficiarySchema);

module.exports = BeneficiaryModel;