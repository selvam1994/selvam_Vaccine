const mongoose = require('mongoose');
const Schema= mongoose.Schema;

const AppoinmentSchema = new Schema({}, { strict: false })

const AppoinmentModel = mongoose.model('appoinment', AppoinmentSchema);

module.exports = AppoinmentModel;