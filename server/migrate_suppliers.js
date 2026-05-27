const mongoose = require("mongoose");
require("dotenv").config();

async function migrateSuppliers() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const suppliersCollection = db.collection("suppliers");

    // 1. Rename supplierName to name
    const res1 = await suppliersCollection.updateMany(
      { supplierName: { $exists: true } },
      { $rename: { "supplierName": "name" } }
    );
    console.log("Renamed supplierName to name:", res1.modifiedCount);

    // 2. Rename companyName to company
    const res2 = await suppliersCollection.updateMany(
      { companyName: { $exists: true } },
      { $rename: { "companyName": "company" } }
    );
    console.log("Renamed companyName to company:", res2.modifiedCount);

    // 3. Rename activeSupplier to isActive
    const res3 = await suppliersCollection.updateMany(
      { activeSupplier: { $exists: true } },
      { $rename: { "activeSupplier": "isActive" } }
    );
    console.log("Renamed activeSupplier to isActive:", res3.modifiedCount);

    console.log("Migration completed successfully.");
    await mongoose.disconnect();
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

migrateSuppliers();
