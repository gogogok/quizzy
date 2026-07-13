ALTER TABLE "Participant" ADD COLUMN "reconnectToken" TEXT;

UPDATE "Participant"
SET "reconnectToken" = gen_random_uuid()::text
WHERE "reconnectToken" IS NULL;

CREATE UNIQUE INDEX "Participant_reconnectToken_key"
ON "Participant"("reconnectToken");
