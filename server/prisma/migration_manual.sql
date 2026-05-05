-- ============================================================
-- HomEV — Full PostgreSQL Migration
-- Paste this entire script into Neon's SQL Editor and click Run
-- ============================================================

-- 1. ENUMS
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF', 'OWNER', 'PROPERTY_MANAGER', 'SUPER_ADMIN');
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED');
CREATE TYPE "BlockStatus" AS ENUM ('AVAILABLE', 'BLOCKED', 'BOOKED');
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "TaskType" AS ENUM ('CLEANING', 'MAINTENANCE');
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'VOID');

-- 2. TABLES (in dependency order)

CREATE TABLE "CancellationPolicy" (
  "id"                              TEXT        NOT NULL,
  "name"                            TEXT        NOT NULL,
  "type"                            TEXT        NOT NULL DEFAULT 'SHORT_TERM',
  "fullRefundDaysPrior"             INTEGER     NOT NULL,
  "partialRefundDaysPrior"          INTEGER     NOT NULL,
  "partialRefundPercentage"         INTEGER     NOT NULL,
  "bookingGracePeriodHours"         INTEGER     NOT NULL DEFAULT 24,
  "offerNonRefundableDiscount"      BOOLEAN     NOT NULL DEFAULT false,
  "nonRefundableDiscountPercentage" INTEGER     NOT NULL DEFAULT 10,
  "createdAt"                       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("name")
);

CREATE TABLE "User" (
  "id"          TEXT        NOT NULL,
  "email"       TEXT        NOT NULL,
  "phone"       TEXT,
  "password"    TEXT,
  "otpCode"     TEXT,
  "otpExpiresAt" TIMESTAMP(3),
  "role"        "Role"      NOT NULL DEFAULT 'STAFF',
  "displayName" TEXT,
  "bio"         TEXT,
  "avatarUrl"   TEXT,
  "isHost"      BOOLEAN     NOT NULL DEFAULT false,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("email"),
  UNIQUE ("phone")
);

CREATE TABLE "Property" (
  "id"                   TEXT             NOT NULL,
  "externalId"           TEXT,
  "title"                TEXT             NOT NULL,
  "description"          TEXT,
  "address"              TEXT             NOT NULL,
  "location"             TEXT,
  "neighborhood"         TEXT,
  "thumbnailUrl"         TEXT,
  "images"               TEXT,
  "pricePerNight"        DOUBLE PRECISION NOT NULL,
  "capacity"             INTEGER          NOT NULL,
  "bedrooms"             INTEGER          NOT NULL,
  "createdAt"            TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastWebhookTimestamp" TIMESTAMP(3),
  "managerId"            TEXT,
  "shortTermPolicyId"    TEXT,
  "longTermPolicyId"     TEXT,
  PRIMARY KEY ("id"),
  UNIQUE ("externalId")
);

CREATE TABLE "GuestProfile" (
  "id"           TEXT         NOT NULL,
  "firstName"    TEXT         NOT NULL,
  "lastName"     TEXT         NOT NULL,
  "email"        TEXT         NOT NULL,
  "phone"        TEXT,
  "otpCode"      TEXT,
  "otpExpiresAt" TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("email")
);

CREATE TABLE "Reservation" (
  "id"                    TEXT                NOT NULL,
  "startDate"             TIMESTAMP(3)        NOT NULL,
  "endDate"               TIMESTAMP(3)        NOT NULL,
  "status"                "ReservationStatus" NOT NULL DEFAULT 'PENDING',
  "totalPrice"            DOUBLE PRECISION    NOT NULL,
  "selectedNonRefundable" BOOLEAN             NOT NULL DEFAULT false,
  "createdAt"             TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3)        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "externalId"            TEXT,
  "lastWebhookTimestamp"  TIMESTAMP(3),
  "propertyId"            TEXT                NOT NULL,
  "guestId"               TEXT                NOT NULL,
  PRIMARY KEY ("id"),
  UNIQUE ("externalId")
);

CREATE TABLE "CalendarNode" (
  "id"         TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "TimeBlock" (
  "id"             TEXT          NOT NULL,
  "calendarNodeId" TEXT          NOT NULL,
  "startDate"      TIMESTAMP(3)  NOT NULL,
  "endDate"        TIMESTAMP(3)  NOT NULL,
  "status"         "BlockStatus" NOT NULL DEFAULT 'AVAILABLE',
  "reservationId"  TEXT,
  PRIMARY KEY ("id")
);

CREATE TABLE "MessageThread" (
  "id"              TEXT         NOT NULL,
  "propertyId"      TEXT         NOT NULL,
  "guestId"         TEXT         NOT NULL,
  "reservationId"   TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "telegramTopicId" INTEGER,
  PRIMARY KEY ("id"),
  UNIQUE ("reservationId"),
  UNIQUE ("telegramTopicId")
);

CREATE TABLE "Message" (
  "id"           TEXT         NOT NULL,
  "threadId"     TEXT         NOT NULL,
  "senderRole"   TEXT         NOT NULL,
  "content"      TEXT         NOT NULL,
  "isReadByAdmin" BOOLEAN     NOT NULL DEFAULT false,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "OperationalTask" (
  "id"            TEXT          NOT NULL,
  "propertyId"    TEXT          NOT NULL,
  "type"          "TaskType"    NOT NULL,
  "status"        "TaskStatus"  NOT NULL DEFAULT 'PENDING',
  "assigneeId"    TEXT,
  "reservationId" TEXT,
  "createdAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "SmartLockCode" (
  "id"            TEXT         NOT NULL,
  "code"          TEXT         NOT NULL,
  "expiresAt"     TIMESTAMP(3) NOT NULL,
  "propertyId"    TEXT         NOT NULL,
  "reservationId" TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "Invoice" (
  "id"            TEXT            NOT NULL,
  "amount"        DOUBLE PRECISION NOT NULL,
  "status"        "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
  "pdfUrl"        TEXT,
  "reservationId" TEXT            NOT NULL,
  "createdAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "Transaction" (
  "id"              TEXT                  NOT NULL,
  "amount"          DOUBLE PRECISION      NOT NULL,
  "currency"        TEXT                  NOT NULL DEFAULT 'CAD',
  "status"          "TransactionStatus"   NOT NULL DEFAULT 'PENDING',
  "paymentMethodId" TEXT,
  "reservationId"   TEXT                  NOT NULL,
  "invoiceId"       TEXT,
  "createdAt"       TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "RatePlan" (
  "id"          TEXT             NOT NULL,
  "propertyId"  TEXT             NOT NULL,
  "name"        TEXT             NOT NULL,
  "basePrice"   DOUBLE PRECISION NOT NULL,
  "rules"       TEXT             NOT NULL,
  "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "JournalEntry" (
  "id"            TEXT             NOT NULL,
  "creditAccount" TEXT             NOT NULL,
  "debitAccount"  TEXT             NOT NULL,
  "amount"        DOUBLE PRECISION NOT NULL,
  "propertyId"    TEXT,
  "createdAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "OwnerStatement" (
  "id"            TEXT             NOT NULL,
  "ownerId"       TEXT             NOT NULL,
  "periodStart"   TIMESTAMP(3)     NOT NULL,
  "periodEnd"     TIMESTAMP(3)     NOT NULL,
  "totalRevenue"  DOUBLE PRECISION NOT NULL,
  "managementFee" DOUBLE PRECISION NOT NULL,
  "netPayout"     DOUBLE PRECISION NOT NULL,
  "createdAt"     TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

-- 3. FOREIGN KEYS

ALTER TABLE "Property"
  ADD CONSTRAINT "Property_managerId_fkey"         FOREIGN KEY ("managerId")         REFERENCES "User"("id")                 ON DELETE SET NULL  ON UPDATE CASCADE,
  ADD CONSTRAINT "Property_shortTermPolicyId_fkey"  FOREIGN KEY ("shortTermPolicyId")  REFERENCES "CancellationPolicy"("id")   ON DELETE SET NULL  ON UPDATE CASCADE,
  ADD CONSTRAINT "Property_longTermPolicyId_fkey"   FOREIGN KEY ("longTermPolicyId")   REFERENCES "CancellationPolicy"("id")   ON DELETE SET NULL  ON UPDATE CASCADE;

ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id")     ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Reservation_guestId_fkey"    FOREIGN KEY ("guestId")    REFERENCES "GuestProfile"("id") ON DELETE CASCADE  ON UPDATE CASCADE;

ALTER TABLE "CalendarNode"
  ADD CONSTRAINT "CalendarNode_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TimeBlock"
  ADD CONSTRAINT "TimeBlock_calendarNodeId_fkey" FOREIGN KEY ("calendarNodeId") REFERENCES "CalendarNode"("id")  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "TimeBlock_reservationId_fkey"  FOREIGN KEY ("reservationId")  REFERENCES "Reservation"("id")   ON DELETE CASCADE  ON UPDATE CASCADE;

ALTER TABLE "MessageThread"
  ADD CONSTRAINT "MessageThread_propertyId_fkey"    FOREIGN KEY ("propertyId")    REFERENCES "Property"("id")     ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "MessageThread_guestId_fkey"       FOREIGN KEY ("guestId")       REFERENCES "GuestProfile"("id") ON DELETE CASCADE  ON UPDATE CASCADE,
  ADD CONSTRAINT "MessageThread_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id")  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Message"
  ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MessageThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OperationalTask"
  ADD CONSTRAINT "OperationalTask_propertyId_fkey"    FOREIGN KEY ("propertyId")    REFERENCES "Property"("id")    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "OperationalTask_assigneeId_fkey"    FOREIGN KEY ("assigneeId")    REFERENCES "User"("id")        ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "OperationalTask_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE  ON UPDATE CASCADE;

ALTER TABLE "SmartLockCode"
  ADD CONSTRAINT "SmartLockCode_propertyId_fkey"    FOREIGN KEY ("propertyId")    REFERENCES "Property"("id")    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "SmartLockCode_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE  ON UPDATE CASCADE;

ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE  ON UPDATE CASCADE,
  ADD CONSTRAINT "Transaction_invoiceId_fkey"      FOREIGN KEY ("invoiceId")      REFERENCES "Invoice"("id")      ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RatePlan"
  ADD CONSTRAINT "RatePlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "JournalEntry"
  ADD CONSTRAINT "JournalEntry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OwnerStatement"
  ADD CONSTRAINT "OwnerStatement_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. PRISMA MIGRATION TRACKING TABLE
-- This lets Prisma know the DB is already migrated so future prisma db push works cleanly.
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                  VARCHAR(36)  NOT NULL,
  "checksum"            VARCHAR(64)  NOT NULL,
  "finished_at"         TIMESTAMPTZ,
  "migration_name"      VARCHAR(255) NOT NULL,
  "logs"                TEXT,
  "rolled_back_at"      TIMESTAMPTZ,
  "started_at"          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  "applied_steps_count" INTEGER      NOT NULL DEFAULT 0,
  PRIMARY KEY ("id")
);

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "applied_steps_count")
VALUES (
  gen_random_uuid()::text,
  'manual',
  NOW(),
  'switch-to-postgres',
  1
);
