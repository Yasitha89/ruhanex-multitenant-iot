import "dotenv/config";
import mongoose from "mongoose";

import { connectDatabase } from "../config/database.js";
import Tenant from "../models/Tenant.js";
import User from "../models/User.js";

async function run() {
  await connectDatabase();

  const companyCode = "ruhanex-demo";
  const adminEmail = "admin@ruhanex.com";
  const temporaryPassword = "ChangeThisPassword123!";

  let tenant = await Tenant.findOne({ slug: companyCode });

  if (!tenant) {
    tenant = await Tenant.create({
      name: "Ruhanex Demo Company",
      slug: companyCode,
      status: "active",
      plan: "professional",
      timezone: "Asia/Colombo",
      limits: {
        sites: 5,
        users: 20,
        devices: 50,
      },
      branding: {
        companyDisplayName: "Ruhanex Industrial IoT",
      },
    });
    console.log("Tenant created:", tenant.name);
  }

  const existingAdmin = await User.findOne({
    tenantId: tenant._id,
    email: adminEmail,
  });

  if (!existingAdmin) {
    await User.create({
      tenantId: tenant._id,
      name: "Company Administrator",
      email: adminEmail,
      passwordHash: await User.hashPassword(temporaryPassword),
      role: "company_admin",
      status: "active",
    });
    console.log("Administrator created");
  }

  console.log({
    companyCode,
    adminEmail,
    temporaryPassword,
  });
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
