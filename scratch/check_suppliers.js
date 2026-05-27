const mongoose = require("mongoose");
require("dotenv").config();

const checkSuppliers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    const db = mongoose.connection.db;
    const suppliers = await db.collection("suppliers").find({}).toArray();
    console.log("Suppliers found:", JSON.stringify(suppliers, null, 2));
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
};

checkSuppliers();
