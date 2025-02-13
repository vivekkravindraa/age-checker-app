const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/age-checker-made-simple', { useNewUrlParser: true, useUnifiedTopology: true })
    .then((response) => { if (response) { console.log('SUCCESSFULLY CONNECTED TO MONGODB') } })
    .catch((error) => { if (error) { console.log('UNABLE TO CONNECT TO MONGODB') } })

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

module.exports = { mongoose }
