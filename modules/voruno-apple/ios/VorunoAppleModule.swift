import ExpoModulesCore

public class VorunoAppleModule: Module {
  public func definition() -> ModuleDefinition {
    Name("VorunoApple")

    AsyncFunction("getState") { (promise: Promise) in
      Task { @MainActor in promise.resolve(await WorkoutSchedulingService.shared.state()) }
    }
    AsyncFunction("requestAuthorization") { (promise: Promise) in
      Task { @MainActor in promise.resolve(await WorkoutSchedulingService.shared.authorize()) }
    }
    AsyncFunction("scheduleTestWorkout") { (promise: Promise) in
      Task { @MainActor in promise.resolve(await WorkoutSchedulingService.shared.schedule()) }
    }
    AsyncFunction("removeTestWorkout") { (promise: Promise) in
      Task { @MainActor in promise.resolve(await WorkoutSchedulingService.shared.remove()) }
    }
  }
}
