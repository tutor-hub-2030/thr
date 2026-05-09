import { Booking } from "./booking";
import {
  buildRequestsByAllocationKey,
  selectActiveBidBySlotAndStudent,
  selectWinningOccupancyByAllocationKey
} from "./bookingSelectors";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}. Expected ${String(expected)}, received ${String(actual)}`);
  }
}

function assertDeepEqual(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(`${message}. Expected ${expectedJson}, received ${actualJson}`);
  }
}

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-1",
    tutorId: "tutor-1",
    studentId: "student-1",
    scheduledAt: "2026-05-09T10:00:00.000Z",
    scheduledEnd: "2026-05-09T11:00:00.000Z",
    status: "pending",
    slotAllocationKey: "slot-1",
    ...overrides
  };
}

function runBookingSelectorTests() {
  const oldest = makeBooking({ id: "oldest" });
  const newest = makeBooking({ id: "newest" });
  const requestsByAllocationKey = buildRequestsByAllocationKey(
    [oldest, newest],
    { newest: { created_at: 20 }, oldest: { created_at: 10 } },
    {}
  );
  assertDeepEqual(
    requestsByAllocationKey["slot-1"].map((booking) => booking.id),
    ["newest", "oldest"],
    "buildRequestsByAllocationKey should sort bookings by newest timestamp first"
  );

  const firstAccepted = makeBooking({
    id: "accepted-1",
    studentId: "student-1",
    status: "accepted"
  });
  const laterAccepted = makeBooking({
    id: "accepted-2",
    studentId: "student-2",
    status: "accepted"
  });
  const winnerByAllocationKey = selectWinningOccupancyByAllocationKey(
    [firstAccepted, laterAccepted],
    { "accepted-1": { created_at: 10 }, "accepted-2": { created_at: 20 } },
    {}
  );
  assertDeepEqual(
    winnerByAllocationKey,
    {
      "slot-1": {
        studentId: "student-2",
        source: "booking"
      }
    },
    "selectWinningOccupancyByAllocationKey should keep the latest accepted booking per slot"
  );

  const firstPending = makeBooking({ id: "pending-1", status: "pending" });
  const laterActive = makeBooking({ id: "accepted-1", status: "accepted" });
  const rejected = makeBooking({ id: "rejected-1", status: "rejected" });
  const activeBidBySlotAndStudent = selectActiveBidBySlotAndStudent(
    [firstPending, laterActive, rejected],
    {
      "pending-1": { created_at: 10 },
      "accepted-1": { created_at: 20 },
      "rejected-1": { created_at: 30 }
    },
    {}
  );
  assertEqual(
    Object.keys(activeBidBySlotAndStudent).length,
    1,
    "selectActiveBidBySlotAndStudent should ignore inactive bookings"
  );
  assert(
    activeBidBySlotAndStudent["tutor-1|2026-05-09T10:00:00.000Z|2026-05-09T11:00:00.000Z|student-1"]?.id ===
      "accepted-1",
    "selectActiveBidBySlotAndStudent should keep the latest active booking per slot and student"
  );
}

runBookingSelectorTests();
console.log("bookingSelectors tests passed");
