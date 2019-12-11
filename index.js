const express = require('express');
const cors = require('cors');
const { router } = require('./config/router');
const morgan = require('morgan');
const { mongoose } = require('./config/db');
const path = require('path');

const app = express();
const PORT = 8080;

const corsOptions = { exposedHeaders: 'x-auth' };
app.use(cors());
app.use(cors(corsOptions));

app.use(morgan('dev'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());

app.use('/', router);

app.listen(PORT, () => console.log(`listening on port ${PORT}`));
