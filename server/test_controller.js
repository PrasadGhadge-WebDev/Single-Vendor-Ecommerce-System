
const mongoose = require('mongoose');
const { getProductById } = require('./controllers/productController');
require('dotenv').config();

async function testController() {
    try {
        await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/singlevendor');
        console.log('Connected to MongoDB');

        const req = {
            params: { id: '69b7b1be08e675f88b15419e' }
        };
        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.body = data;
                console.log('Response Status:', this.statusCode);
                console.log('Response Body:', JSON.stringify(this.body, null, 2));
            }
        };

        await getProductById(req, res);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Test failed:', error);
    }
}

testController();
