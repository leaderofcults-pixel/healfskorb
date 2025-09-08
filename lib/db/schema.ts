import { createInsertSchema, createSelectSchema } from "drizzle-zod"
import { mysqlTable, varchar, decimal, int, boolean, primaryKey, index, timestamp, text } from "drizzle-orm/mysql-core"
import { z } from "zod"

// Users table
export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }),
    password: varchar("password", { length: 255 }).notNull(),
    role: varchar("role", { length: 20, enum: ["PATIENT", "PRESCRIBER"] }).notNull().default("PATIENT"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_email").on(table.email),
  }),
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export const insertUserSchema = createInsertSchema(users)
export const selectUserSchema = createSelectSchema(users)

// US ZIP codes table for geographic searches
export const usZipcodes = mysqlTable(
  "us_zipcodes",
  {
    zipCode: varchar("zip_code", { length: 5 }).primaryKey(),
    latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
    longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
  },
  (table) => ({
    locationIdx: index("idx_location").on(table.latitude, table.longitude),
  }),
)

// Provider details from NPI registry
export const npiDetails = mysqlTable(
  "npi_details",
  {
    npi: varchar("npi", { length: 10 }).primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    specialty: varchar("specialty", { length: 255 }),
  },
  (table) => ({
    specialtyIdx: index("idx_specialty").on(table.specialty),
  }),
)

// Provider practice addresses
export const npiAddresses = mysqlTable(
  "npi_addresses",
  {
    npi: varchar("npi", { length: 10 }).notNull(),
    street: varchar("street", { length: 255 }),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 2 }),
    zipCode: varchar("zip_code", { length: 10 }),
  },
  (table) => ({
    npiIdx: index("idx_npi").on(table.npi),
    zipIdx: index("idx_zip").on(table.zipCode),
  }),
)

// Prescription volume data
export const npiPrescriptions = mysqlTable(
  "npi_prescriptions",
  {
    npi: varchar("npi", { length: 10 }).notNull(),
    drugId: int("drug_id").notNull(),
    totalClaims: int("total_claims").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.npi, table.drugId] }),
    drugNpiIdx: index("idx_drug_npi").on(table.drugId, table.npi),
  }),
)

// Drug information
export const drugs = mysqlTable(
  "drugs",
  {
    drugId: int("drug_id").primaryKey(),
    brandName: varchar("brand_name", { length: 255 }).notNull(),
    therapeuticClass: varchar("therapeutic_class", { length: 255 }),
    controlledSubstance: boolean("controlled_substance").default(false),
  },
  (table) => ({
    brandNameIdx: index("idx_brand_name").on(table.brandName),
    therapeuticIdx: index("idx_therapeutic").on(table.therapeuticClass),
  }),
)

// Medical specialties
export const specialties = mysqlTable("specialties", {
  specialtyId: int("specialty_id").primaryKey(),
  specialtyName: varchar("specialty_name", { length: 255 }).notNull(),
})

// States reference table
export const states = mysqlTable("states", {
  stateCode: varchar("state_code", { length: 2 }).primaryKey(),
  stateName: varchar("state_name", { length: 100 }).notNull(),
})

// Users table for authentication
export const authUsers = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    email: varchar("email", { length: 255 }).unique().notNull(),
    password: varchar("password", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    role: varchar("role", { length: 20, enum: ["PATIENT", "PRESCRIBER"] }).notNull().default("PATIENT"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_email").on(table.email),
    roleIdx: index("idx_role").on(table.role),
  }),
)

// Prescriber profiles to link to users table
export const prescriberProfiles = mysqlTable(
  "prescriber_profiles",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 36 }).references(() => users.id),
    npiNumber: varchar("npi_number", { length: 10 }).unique(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    practiceName: varchar("practice_name", { length: 255 }),
    specialty: text("specialty"), // JSON array of specialties
    addressStreet: varchar("address_street", { length: 255 }),
    addressCity: varchar("address_city", { length: 100 }),
    addressState: varchar("address_state", { length: 2 }),
    addressZip: varchar("address_zip", { length: 10 }),
    lat: decimal("lat", { precision: 10, scale: 8 }),
    lng: decimal("lng", { precision: 11, scale: 8 }),
    phone: varchar("phone", { length: 20 }),
    website: varchar("website", { length: 255 }),
    bio: text("bio"),
    profileImageUrl: varchar("profile_image_url", { length: 500 }),
    verified: boolean("verified").default(false),
    subscriptionStatus: varchar("subscription_status", {
      length: 20,
      enum: ["FREE", "VERIFIED", "FEATURED"],
    }).default("FREE"),
    subscriptionExpires: timestamp("subscription_expires"),
    profileCompleteness: int("profile_completeness").default(0),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_user_id").on(table.userId),
    locationIdx: index("idx_location").on(table.lat, table.lng),
    npiIdx: index("idx_npi").on(table.npiNumber),
  }),
)

// Type exports for TypeScript inference
export type UsZipcode = typeof usZipcodes.$inferSelect
export type NpiDetail = typeof npiDetails.$inferSelect
export type NpiAddress = typeof npiAddresses.$inferSelect
export type NpiPrescription = typeof npiPrescriptions.$inferSelect
export type Drug = typeof drugs.$inferSelect
export type Specialty = typeof specialties.$inferSelect
export type State = typeof states.$inferSelect
export type PrescriberProfile = typeof prescriberProfiles.$inferSelect