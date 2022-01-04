const mongoose = require('mongoose');

const MySchema = mongoose.Schema({
    resultsArray:Array
});

const result=mongoose.model('Result',MySchema);

module.exports=result;