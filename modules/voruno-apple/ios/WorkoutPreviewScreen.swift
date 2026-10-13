import SwiftUI
import WorkoutKit

@MainActor
final class WorkoutPreviewModel: ObservableObject {
  @Published var presented = false
}

struct WorkoutPreviewScreen: View {
  let plan: WorkoutPlan
  @ObservedObject var model: WorkoutPreviewModel
  let onClose: () -> Void

  var body: some View {
    VStack(spacing: 24) {
      Text("VORUNO · Treino de teste").font(.headline)
      Text("Na prévia da Apple, use Adicionar ao Watch para salvar sem agendar. Depois, confira o treino no relógio. Fechar a prévia não confirma o envio.")
      Button("Abrir prévia da Apple") { model.presented = true }
      Button("Voltar à PoC", action: onClose)
    }
    .padding(24)
    .workoutPreview(plan, isPresented: $model.presented)
    .onChange(of: model.presented) { _, presented in
      if !presented { onClose() }
    }
  }
}
