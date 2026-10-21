-- CreateEnum
CREATE TYPE "account_role" AS ENUM ('STUDENT', 'ADMISSION_STAFF');

-- CreateEnum
CREATE TYPE "registration_status" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "admission_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "guardian_relationship" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN');

-- CreateEnum
CREATE TYPE "payment_provider" AS ENUM ('MIDTRANS');

-- CreateEnum
CREATE TYPE "payment_purpose" AS ENUM ('ADMISSION_FEE_INITIAL');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "notification_event" AS ENUM ('REGISTRATION_CREATED', 'PAYMENT_VERIFIED');

-- CreateEnum
CREATE TYPE "notification_provider" AS ENUM ('FONNTE');

-- CreateEnum
CREATE TYPE "notification_status" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "auth_provider_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "account_role" NOT NULL DEFAULT 'STUDENT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "admission_period" TEXT NOT NULL,
    "registration_number" TEXT,
    "status" "registration_status" NOT NULL DEFAULT 'DRAFT',
    "last_completed_step" SMALLINT NOT NULL DEFAULT 0,
    "terms_accepted_at" TIMESTAMPTZ(3),
    "terms_version" TEXT,
    "submitted_at" TIMESTAMPTZ(3),
    "admission_status" "admission_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_data" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "nisn" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "birth_certificate_number" TEXT NOT NULL,
    "family_card_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "birth_place" TEXT NOT NULL,
    "birth_date" DATE NOT NULL,
    "religion" TEXT NOT NULL,
    "street_address" TEXT NOT NULL,
    "rt" TEXT NOT NULL,
    "rw" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "subdistrict" TEXT NOT NULL,
    "regency" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "citizenship" TEXT NOT NULL,
    "is_kps_recipient" BOOLEAN NOT NULL,
    "kps_number" TEXT,
    "is_kip_recipient" BOOLEAN NOT NULL,
    "kip_number" TEXT,
    "kip_holder_name" TEXT,
    "birth_order" SMALLINT NOT NULL,
    "sibling_count" SMALLINT NOT NULL,
    "height_cm" SMALLINT NOT NULL,
    "weight_kg" SMALLINT NOT NULL,
    "residence_type" TEXT NOT NULL,
    "distance_to_school_km" DECIMAL(6,2) NOT NULL,
    "transport_mode" TEXT NOT NULL,
    "mobile_phone" TEXT NOT NULL,
    "landline_phone" TEXT,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "student_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_guardians" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "relationship" "guardian_relationship" NOT NULL,
    "full_name" TEXT NOT NULL,
    "nik" TEXT,
    "birth_place" TEXT,
    "birth_date" DATE,
    "education" TEXT,
    "occupation" TEXT,
    "income_range" TEXT,
    "mobile_phone" TEXT,
    "email" TEXT,
    "street_address" TEXT,
    "rt" TEXT,
    "rw" TEXT,
    "village" TEXT,
    "subdistrict" TEXT,
    "regency" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "parent_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "previous_schools" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "school_name" TEXT NOT NULL,
    "school_level" TEXT,
    "npsn" TEXT,
    "ownership" TEXT,
    "street_address" TEXT,
    "village" TEXT,
    "subdistrict" TEXT,
    "regency" TEXT,
    "province" TEXT,
    "entry_year" SMALLINT,
    "graduation_year" SMALLINT,
    "exam_participant_number" TEXT,
    "diploma_number" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "previous_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "provider" "payment_provider" NOT NULL DEFAULT 'MIDTRANS',
    "purpose" "payment_purpose" NOT NULL DEFAULT 'ADMISSION_FEE_INITIAL',
    "amount_idr" INTEGER NOT NULL,
    "order_id" TEXT NOT NULL,
    "provider_transaction_id" TEXT,
    "snap_token" TEXT,
    "payment_method" TEXT,
    "status" "payment_status" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_events" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "event_key" TEXT NOT NULL,
    "provider_status" TEXT NOT NULL,
    "provider_status_code" TEXT,
    "fraud_status" TEXT,
    "reported_amount_idr" INTEGER,
    "verified" BOOLEAN NOT NULL,
    "rejection_reason" TEXT,
    "resulting_status" "payment_status",
    "safe_metadata" JSONB,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(3),

    CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "payment_id" UUID,
    "event" "notification_event" NOT NULL,
    "provider" "notification_provider" NOT NULL DEFAULT 'FONNTE',
    "status" "notification_status" NOT NULL DEFAULT 'PENDING',
    "dedupe_key" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_attempt_at" TIMESTAMPTZ(3),
    "next_attempt_at" TIMESTAMPTZ(3),
    "sent_at" TIMESTAMPTZ(3),
    "provider_message_id" TEXT,
    "last_error_code" TEXT,
    "last_error_message" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admission_decisions" (
    "id" UUID NOT NULL,
    "registration_id" UUID NOT NULL,
    "decided_by_id" UUID NOT NULL,
    "from_status" "admission_status" NOT NULL,
    "to_status" "admission_status" NOT NULL,
    "note" TEXT,
    "decided_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admission_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_auth_provider_id_key" ON "accounts"("auth_provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_registration_number_key" ON "registrations"("registration_number");

-- CreateIndex
CREATE INDEX "registrations_status_idx" ON "registrations"("status");

-- CreateIndex
CREATE INDEX "registrations_admission_status_idx" ON "registrations"("admission_status");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_owner_id_admission_period_key" ON "registrations"("owner_id", "admission_period");

-- CreateIndex
CREATE UNIQUE INDEX "student_data_registration_id_key" ON "student_data"("registration_id");

-- CreateIndex
CREATE INDEX "student_data_nik_idx" ON "student_data"("nik");

-- CreateIndex
CREATE INDEX "student_data_nisn_idx" ON "student_data"("nisn");

-- CreateIndex
CREATE UNIQUE INDEX "parent_guardians_registration_id_relationship_key" ON "parent_guardians"("registration_id", "relationship");

-- CreateIndex
CREATE UNIQUE INDEX "previous_schools_registration_id_key" ON "previous_schools"("registration_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_transaction_id_key" ON "payments"("provider_transaction_id");

-- CreateIndex
CREATE INDEX "payments_registration_id_status_idx" ON "payments"("registration_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payment_events_event_key_key" ON "payment_events"("event_key");

-- CreateIndex
CREATE INDEX "payment_events_payment_id_idx" ON "payment_events"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_dedupe_key_key" ON "notification_deliveries"("dedupe_key");

-- CreateIndex
CREATE INDEX "notification_deliveries_status_next_attempt_at_idx" ON "notification_deliveries"("status", "next_attempt_at");

-- CreateIndex
CREATE INDEX "notification_deliveries_registration_id_idx" ON "notification_deliveries"("registration_id");

-- CreateIndex
CREATE INDEX "admission_decisions_registration_id_idx" ON "admission_decisions"("registration_id");

-- CreateIndex
CREATE INDEX "admission_decisions_decided_by_id_idx" ON "admission_decisions"("decided_by_id");

-- AddForeignKey
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_data" ADD CONSTRAINT "student_data_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_guardians" ADD CONSTRAINT "parent_guardians_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "previous_schools" ADD CONSTRAINT "previous_schools_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_decisions" ADD CONSTRAINT "admission_decisions_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admission_decisions" ADD CONSTRAINT "admission_decisions_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
