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
    AsyncFunction("presentTestWorkout") { (promise: Promise) in
      Task { @MainActor in
        let presenter = self.appContext?.utilities?.currentViewController()
        promise.resolve(await WorkoutSchedulingService.shared.preview(from: presenter))
      }
    }
    AsyncFunction("removeTestWorkout") { (promise: Promise) in
      Task { @MainActor in promise.resolve(await WorkoutSchedulingService.shared.remove()) }
    }
  }
}
