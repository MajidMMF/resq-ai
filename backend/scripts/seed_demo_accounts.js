import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const AUTH_MONGO_URI = "mongodb+srv://shaikmajid249_db_user:2V5XADCEQpSc5Ey6@resq-ai.amfb21x.mongodb.net/auth";
const HOSPITALS_MONGO_URI = "mongodb+srv://shaikmajid249_db_user:2V5XADCEQpSc5Ey6@resq-ai.amfb21x.mongodb.net/resq_hospitals?retryWrites=true&w=majority";
const AMBULANCES_MONGO_URI = "mongodb+srv://shaikmajid249_db_user:2V5XADCEQpSc5Ey6@resq-ai.amfb21x.mongodb.net/resq_ambulances?retryWrites=true&w=majority";

async function seed() {
  console.log("🚀 Starting ResQ AI demo accounts & entities seeding...");

  // 1. Connect to Hospitals DB
  console.log("\n🏥 Connecting to Hospitals Database...");
  const hospConn = await mongoose.createConnection(HOSPITALS_MONGO_URI).asPromise();
  console.log("✅ Connected to Hospitals DB");

  const hospitalCollection = hospConn.collection("hospitals");
  const staffCollection = hospConn.collection("hospitalstaffs");
  const capabilityCollection = hospConn.collection("hospitalcapabilities");

  // Ensure 2dsphere index on location
  await hospitalCollection.createIndex({ location: "2dsphere" }).catch(() => {});

  // Hospital 1: Apollo Hospital Trauma Center
  let apollo = await hospitalCollection.findOne({ name: /Apollo/i });
  if (!apollo) {
    const apolloDoc = {
      name: "Apollo Hospital Trauma Center",
      address: "Road No 72, Film Nagar, Jubilee Hills, Hyderabad, Telangana 500033",
      location: {
        type: "Point",
        coordinates: [78.4111, 17.4239], // [lng, lat]
      },
      phone: "+914023607777",
      email: "hospital@apollo.com",
      isApproved: true,
      isActive: true,
      emergencyDepartmentOpen: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await hospitalCollection.insertOne(apolloDoc);
    apollo = { _id: res.insertedId, ...apolloDoc };
    console.log("✅ Created Hospital: Apollo Hospital Trauma Center");
  } else {
    await hospitalCollection.updateOne(
      { _id: apollo._id },
      { $set: { isApproved: true, isActive: true, emergencyDepartmentOpen: true } }
    );
    console.log("ℹ️ Apollo Hospital already exists, updated active & approved status.");
  }

  // Capability for Apollo
  await capabilityCollection.updateOne(
    { hospitalId: apollo._id },
    {
      $set: {
        hospitalId: apollo._id,
        beds: 120,
        icu: 25,
        trauma: true,
        traumaLevel: "LEVEL_1",
        ventilators: 15,
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log("✅ Configured Apollo Capabilities (Trauma, 120 Beds, 25 ICU)");

  // Hospital 2: Care Hospital Emergency Unit
  let care = await hospitalCollection.findOne({ name: /Care Hospital/i });
  if (!care) {
    const careDoc = {
      name: "Care Hospital Emergency Unit",
      address: "Road No 1, Banjara Hills, Hyderabad, Telangana 500034",
      location: {
        type: "Point",
        coordinates: [78.4482, 17.4156],
      },
      phone: "+914061656565",
      email: "emergency@carehospitals.com",
      isApproved: true,
      isActive: true,
      emergencyDepartmentOpen: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await hospitalCollection.insertOne(careDoc);
    care = { _id: res.insertedId, ...careDoc };
    console.log("✅ Created Hospital: Care Hospital Emergency Unit");
  } else {
    await hospitalCollection.updateOne(
      { _id: care._id },
      { $set: { isApproved: true, isActive: true, emergencyDepartmentOpen: true } }
    );
    console.log("ℹ️ Care Hospital already exists, updated active & approved status.");
  }

  // Capability for Care
  await capabilityCollection.updateOne(
    { hospitalId: care._id },
    {
      $set: {
        hospitalId: care._id,
        beds: 85,
        icu: 18,
        trauma: true,
        traumaLevel: "LEVEL_2",
        ventilators: 10,
        lastVerifiedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log("✅ Configured Care Hospital Capabilities (85 Beds, 18 ICU)");

  // 2. Connect to Ambulances DB
  console.log("\n🚑 Connecting to Ambulances Database...");
  const ambConn = await mongoose.createConnection(AMBULANCES_MONGO_URI).asPromise();
  console.log("✅ Connected to Ambulances DB");

  const ambCollection = ambConn.collection("ambulances");
  const driverCollection = ambConn.collection("ambulancedrivers");

  await ambCollection.createIndex({ location: "2dsphere" }).catch(() => {});

  // Ambulance 1: TS-09-EM-108
  let amb1 = await ambCollection.findOne({ plateNumber: "TS-09-EM-108" });
  if (!amb1) {
    const ambDoc = {
      plateNumber: "TS-09-EM-108",
      type: "advanced",
      hospitalId: apollo._id,
      location: {
        type: "Point",
        coordinates: [78.4450, 17.4100], // Banjara Hills, near citizen
      },
      status: "online",
      isApproved: true,
      isActive: true,
      lastLocationAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await ambCollection.insertOne(ambDoc);
    amb1 = { _id: res.insertedId, ...ambDoc };
    console.log("✅ Created Ambulance: TS-09-EM-108 (Advanced, Online)");
  } else {
    await ambCollection.updateOne(
      { _id: amb1._id },
      { $set: { status: "online", isApproved: true, isActive: true, location: { type: "Point", coordinates: [78.4450, 17.4100] } } }
    );
    console.log("ℹ️ Ambulance TS-09-EM-108 updated to Online.");
  }

  // Ambulance 2: TS-09-EM-102
  let amb2 = await ambCollection.findOne({ plateNumber: "TS-09-EM-102" });
  if (!amb2) {
    const ambDoc2 = {
      plateNumber: "TS-09-EM-102",
      type: "icu",
      hospitalId: care._id,
      location: {
        type: "Point",
        coordinates: [78.4200, 17.4200],
      },
      status: "online",
      isApproved: true,
      isActive: true,
      lastLocationAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await ambCollection.insertOne(ambDoc2);
    amb2 = { _id: res.insertedId, ...ambDoc2 };
    console.log("✅ Created Ambulance: TS-09-EM-102 (ICU, Online)");
  } else {
    await ambCollection.updateOne(
      { _id: amb2._id },
      { $set: { status: "online", isApproved: true, isActive: true } }
    );
  }

  // 3. Connect to Auth DB
  console.log("\n🔐 Connecting to Auth Database...");
  const authConn = await mongoose.createConnection(AUTH_MONGO_URI).asPromise();
  console.log("✅ Connected to Auth DB");

  const userCollection = authConn.collection("users");
  const hashedPassword = await bcrypt.hash("Password123", 10);

  // User 1: Admin
  const adminEmail = "admin@resqai.com";
  let adminUser = await userCollection.findOne({ email: adminEmail });
  if (!adminUser) {
    const adminDoc = {
      name: "ResQ Super Admin",
      email: adminEmail,
      passwordHash: hashedPassword,
      mobile: "+919876543210",
      roles: ["ADMIN"],
      isActive: true,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await userCollection.insertOne(adminDoc);
    adminUser = { _id: res.insertedId, ...adminDoc };
    console.log("✅ Created Admin User: admin@resqai.com");
  } else {
    await userCollection.updateOne(
      { _id: adminUser._id },
      { $set: { passwordHash: hashedPassword, roles: ["ADMIN"], isActive: true } }
    );
    console.log("ℹ️ Updated Admin User: admin@resqai.com (Password123)");
  }

  // User 2: Hospital Staff (Apollo)
  const hospitalEmail = "hospital@apollo.com";
  let hospitalUser = await userCollection.findOne({ email: hospitalEmail });
  if (!hospitalUser) {
    const hospUserDoc = {
      name: "Dr. Majid (Apollo ER)",
      email: hospitalEmail,
      passwordHash: hashedPassword,
      mobile: "+919876543211",
      roles: ["HOSPITAL_STAFF"],
      hospitalId: apollo._id,
      isActive: true,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await userCollection.insertOne(hospUserDoc);
    hospitalUser = { _id: res.insertedId, ...hospUserDoc };
    console.log("✅ Created Hospital Staff User: hospital@apollo.com");
  } else {
    await userCollection.updateOne(
      { _id: hospitalUser._id },
      { $set: { passwordHash: hashedPassword, roles: ["HOSPITAL_STAFF"], hospitalId: apollo._id, isActive: true } }
    );
    console.log("ℹ️ Updated Hospital Staff User: hospital@apollo.com");
  }

  // Link HospitalStaff in Hospitals DB
  await staffCollection.updateOne(
    { hospitalId: apollo._id, email: hospitalEmail },
    {
      $set: {
        hospitalId: apollo._id,
        email: hospitalEmail,
        userId: hospitalUser._id,
        name: "Dr. Majid (Apollo ER)",
        phone: "+919876543211",
        role: "doctor",
        status: "ACTIVE",
        isActive: true,
        activatedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log("✅ Linked Staff Record in Hospitals DB to Apollo");

  // User 3: Ambulance Driver
  const driverEmail = "driver@resqai.com";
  let driverUser = await userCollection.findOne({ email: driverEmail });
  if (!driverUser) {
    const driverUserDoc = {
      name: "Ramesh Driver",
      email: driverEmail,
      passwordHash: hashedPassword,
      mobile: "+919876543212",
      roles: ["AMBULANCE_DRIVER"],
      ambulanceId: amb1._id,
      isActive: true,
      profileCompleted: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const res = await userCollection.insertOne(driverUserDoc);
    driverUser = { _id: res.insertedId, ...driverUserDoc };
    console.log("✅ Created Ambulance Driver User: driver@resqai.com");
  } else {
    await userCollection.updateOne(
      { _id: driverUser._id },
      { $set: { passwordHash: hashedPassword, roles: ["AMBULANCE_DRIVER"], ambulanceId: amb1._id, isActive: true } }
    );
    console.log("ℹ️ Updated Ambulance Driver User: driver@resqai.com");
  }

  // Link AmbulanceDriver in Ambulances DB
  await driverCollection.updateOne(
    { ambulanceId: amb1._id, email: driverEmail },
    {
      $set: {
        ambulanceId: amb1._id,
        email: driverEmail,
        userId: driverUser._id,
        name: "Ramesh Driver",
        phone: "+919876543212",
        status: "ACTIVE",
        activatedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log("✅ Linked Driver Record in Ambulances DB to TS-09-EM-108");

  await hospConn.close();
  await ambConn.close();
  await authConn.close();

  console.log("\n=======================================================");
  console.log("🎉 SUCCESS! Demo accounts created & linked successfully:");
  console.log("-------------------------------------------------------");
  console.log("1. ADMIN PANEL:");
  console.log("   URL: http://localhost:5173/login -> /admin");
  console.log("   Email:    admin@resqai.com");
  console.log("   Password: Password123");
  console.log("-------------------------------------------------------");
  console.log("2. HOSPITAL STAFF PANEL:");
  console.log("   URL: http://localhost:5173/login -> /hospital");
  console.log("   Email:    hospital@apollo.com");
  console.log("   Password: Password123");
  console.log("   Hospital: Apollo Hospital Trauma Center");
  console.log("-------------------------------------------------------");
  console.log("3. AMBULANCE DRIVER PANEL:");
  console.log("   URL: http://localhost:5173/login -> /ambulance");
  console.log("   Email:    driver@resqai.com");
  console.log("   Password: Password123");
  console.log("   Vehicle:  TS-09-EM-108 (Advanced Life Support)");
  console.log("=======================================================\n");
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

