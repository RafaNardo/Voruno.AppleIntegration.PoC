import Foundation
import HealthKit // Activity/location enums only. No HKHealthStore or health-data access.
import WorkoutKit

@MainActor
final class WorkoutSchedulingService {
  static let shared = WorkoutSchedulingService()
  private var busy = false
  // Synthetic fixture identity, not an activity, person or device identifier.
  private let fixtureID = UUID(uuidString: "79424A80-25A6-4EE7-8A82-748851535FA1")!
  private let scheduler = WorkoutScheduler.shared

  private var supported: Bool {
    #if targetEnvironment(simulator)
    return false
    #else
    return WorkoutScheduler.isSupported
    #endif
  }

  private func authorizationName(_ value: WorkoutScheduler.AuthorizationState) -> String {
    switch value {
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .notDetermined: return "not-determined"
    case .restricted: return "restricted"
    @unknown default: return "unknown"
    }
  }

  private func fixture() -> WorkoutPlan? {
    let warmup = WorkoutGoal.time(60, .seconds)
    let work = WorkoutGoal.time(60, .seconds)
    let recovery = WorkoutGoal.time(30, .seconds)
    let cooldown = WorkoutGoal.time(60, .seconds)
    guard CustomWorkout.supportsActivity(.running),
          [warmup, work, recovery, cooldown].allSatisfy({
            CustomWorkout.supportsGoal($0, activity: .running, location: .outdoor)
          }) else { return nil }
    let block = IntervalBlock(steps: [
      IntervalStep(.work, step: WorkoutStep(goal: work)),
      IntervalStep(.recovery, step: WorkoutStep(goal: recovery))
    ], iterations: 2)
    let workout = CustomWorkout(
      activity: .running, location: .outdoor, displayName: "VORUNO TEST ONLY 2x1m",
      warmup: WorkoutStep(goal: warmup), blocks: [block], cooldown: WorkoutStep(goal: cooldown)
    )
    return WorkoutPlan(.custom(workout), id: fixtureID)
  }

  private func matches(_ workouts: [ScheduledWorkoutPlan]) -> [ScheduledWorkoutPlan] {
    workouts.filter { $0.plan.id == fixtureID }
  }

  private func summary(_ workouts: [ScheduledWorkoutPlan]) -> [String: Any] {
    let matching = matches(workouts)
    var result: [String: Any] = ["fixtureCount": matching.count]
    if let entry = matching.first, let date = Calendar.autoupdatingCurrent.date(from: entry.date) {
      result["scheduledFor"] = ISO8601DateFormatter().string(from: date)
    }
    return result
  }

  func state() async -> [String: Any] {
    guard supported else {
      return ["capability": "unsupported", "authorization": "unknown", "code": "unsupported"]
    }
    let authorization = await scheduler.authorizationState
    let fixtureSupported = fixture() != nil
    var result: [String: Any] = [
      "capability": fixtureSupported ? "supported" : "unsupported",
      "authorization": authorizationName(authorization),
      "code": fixtureSupported ? "ready" : "invalid-fixture"
    ]
    // Do not present a zero count as a query when authorization is unavailable.
    if authorization == .authorized {
      result.merge(summary(await scheduler.scheduledWorkouts)) { _, new in new }
    }
    return result
  }

  func authorize() async -> [String: Any] {
    guard supported else { return ["code": "unsupported"] }
    guard !busy else { return ["code": "busy"] }
    busy = true
    defer { busy = false }
    let authorization = await scheduler.requestAuthorization()
    return ["code": "authorization-returned", "authorization": authorizationName(authorization)]
  }

  func schedule() async -> [String: Any] {
    guard supported else { return ["code": "unsupported"] }
    guard !busy else { return ["code": "busy"] }
    busy = true
    defer { busy = false }
    guard await scheduler.authorizationState == .authorized else { return ["code": "not-authorized"] }
    guard let plan = fixture() else { return ["code": "invalid-fixture"] }
    let existing = await scheduler.scheduledWorkouts
    guard matches(existing).isEmpty else {
      return summary(existing).merging(["code": "already-scheduled"]) { _, new in new }
    }
    guard existing.count < WorkoutScheduler.maxAllowedScheduledWorkoutCount else {
      return ["code": "capacity-reached"]
    }
    let calendar = Calendar.autoupdatingCurrent
    let proposed = Date().addingTimeInterval(5 * 60)
    var components = calendar.dateComponents(in: .autoupdatingCurrent, from: proposed)
    components.second = 0
    components.nanosecond = 0
    guard let date = calendar.date(from: components), date > Date() else { return ["code": "invalid-date"] }
    // Nonthrowing async Void API. Returning does NOT prove Watch receipt.
    await scheduler.schedule(plan, at: components)
    var result = summary(await scheduler.scheduledWorkouts)
    result["code"] = "submitted"
    result["scheduledFor"] = ISO8601DateFormatter().string(from: date)
    return result
  }

  func remove() async -> [String: Any] {
    guard supported else { return ["code": "unsupported"] }
    guard !busy else { return ["code": "busy"] }
    busy = true
    defer { busy = false }
    guard await scheduler.authorizationState == .authorized else { return ["code": "not-authorized"] }
    let existing = matches(await scheduler.scheduledWorkouts)
    guard !existing.isEmpty else { return ["code": "not-found"] }
    // Only this fixture. Never call removeAllWorkouts or markComplete.
    for item in existing { await scheduler.remove(item.plan, at: item.date) }
    return summary(await scheduler.scheduledWorkouts).merging(["code": "removal-requested"]) { _, new in new }
  }
}
