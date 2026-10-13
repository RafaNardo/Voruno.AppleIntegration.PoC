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
      Text("Na prévia da Apple, use Adicionar ao Watch para salvar sem agendar. Depois, confira VORUNO TEST ONLY 2x1m nas opções de Corrida ao Ar Livre no relógio. Ao terminar, toque em Voltar à PoC. Fechar a prévia não confirma o envio.")
      Button("Abrir prévia da Apple") { model.presented = true }
      Button("Voltar à PoC", action: onClose)
    }
    .padding(24)
    .workoutPreview(plan, isPresented: $model.presented)
    // Keep the host alive when Apple's preview closes; return only on explicit user action.
  }
}
