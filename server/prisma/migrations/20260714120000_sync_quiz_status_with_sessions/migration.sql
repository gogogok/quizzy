-- Restore quiz statuses for sessions completed before quiz status synchronization was introduced.
UPDATE "Quiz" AS quiz
SET "status" = 'FINISHED'
WHERE EXISTS (
  SELECT 1
  FROM "QuizSession" AS session
  WHERE session."quizId" = quiz."id"
    AND session."status" = 'FINISHED'
)
AND NOT EXISTS (
  SELECT 1
  FROM "QuizSession" AS session
  WHERE session."quizId" = quiz."id"
    AND session."status" IN ('LOBBY', 'ACTIVE')
);

UPDATE "Quiz" AS quiz
SET "status" = 'ACTIVE'
WHERE EXISTS (
  SELECT 1
  FROM "QuizSession" AS session
  WHERE session."quizId" = quiz."id"
    AND session."status" = 'ACTIVE'
);
