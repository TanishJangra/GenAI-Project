require('dotenv').config();
// const {invoke} = require('./src/services/ai.service.js');
const app = require('./src/app');
const connectDB = require('./src/config/database');
connectDB();
// invoke();
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

