import { useMemo } from "react";
import { createNostrLessonRepository } from "../adapters/nostr/lessonRepository";
import { LessonRepository } from "../ports/lessonRepository";
import { useBookingActions } from "./useBookingActions";
import { useLessonAgreementsForUser } from "./useLessonAgreementsForUser";

export function useLessonRepository(
  userId: string,
  defaults?: {
    price?: number;
    currency?: string;
  }
) {
  const { agreements, list } = useLessonAgreementsForUser(userId);
  const { publishLessonAgreement, updateLessonAgreementStatus } = useBookingActions();

  return useMemo<LessonRepository>(() => {
    return createNostrLessonRepository({
      userId,
      list,
      agreements,
      defaults,
      publishLessonAgreement,
      updateLessonAgreementStatus
    });
  }, [
    agreements,
    defaults?.currency,
    defaults?.price,
    list,
    publishLessonAgreement,
    updateLessonAgreementStatus,
    userId
  ]);
}
