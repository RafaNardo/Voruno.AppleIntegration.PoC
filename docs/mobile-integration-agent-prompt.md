# Prompt para o agente do aplicativo oficial

Copie o texto abaixo para a conversa do agente no repositório do app oficial. Dê acesso à PoC ou copie também `mobile-integration-handoff.md` e os arquivos de referência necessários. Este prompt não autoriza alterações no projeto de destino durante a documentação da PoC.

---

Integre o fluxo Apple validado na PoC VORUNO ao app mobile oficial, respeitando a arquitetura e os contratos deste repositório.

Primeiro leia as instruções locais, `docs/architecture/mobile-code-design.md`, os contratos atuais de plano/ciclo/atividades/importação/privacidade e o guia `docs/mobile-integration-handoff.md` da PoC `RafaNardo/Voruno.AppleIntegration.PoC`. A implementação de referência é o commit `74539a4`; os documentos de transferência estão na branch `docs/mobile-integration-handoff`.

Implemente por fatias verticais pequenas e testáveis. Reaproveite os adapters e as decisões técnicas, adaptando-os ao SDK, à organização por feature e ao design system do app oficial. Não copie a aplicação PoC inteira nem suas fixtures. Não invente endpoints ou contratos de backend; encontre os existentes e identifique explicitamente as lacunas necessárias para a fatia funcionar.

Requisitos centrais:

1. Enviar sessões reais via WorkoutKit e agendamento. O atraso de dois segundos funcionou como experimento de disponibilização próxima; não é garantia de entrega nem início automático. Preview sem agendamento não foi o caminho bem-sucedido.
2. Persistir um UUID Apple por sessão prescrita ou mapeamento equivalente. Passá-lo como `WorkoutPlan.id`. Conservar em retries; outra sessão recebe outra identidade. Preservar revisão e histórico de alterações/reagendamentos.
3. Na leitura HealthKit, tratar `HKWorkout.uuid` como identidade da execução e `getWorkoutPlan()?.id` como evidência do plano associado. Eles não são o mesmo ID. Duas execuções do mesmo plano devem coexistir. Validar associação em hardware antes de automatizá-la; ausência/falha/ambiguidade não podem virar vínculo inventado.
4. Importar idempotentemente, com escopo de atleta, conforme contrato real. Prever sync tardio e enriquecimento da mesma atividade. Não transportar a janela/tolerância fixa da fixture como regra do produto.
5. Separar as portas de agendamento e leitura. Expor capability, autorização, submissão, confirmação no scheduler, execução, importação e vínculo como estados distintos.
6. Ler resumo, dados associados, eventos, GPS/altitude, ritmo/cadência, FC opcional, potência e dinâmica disponíveis. Manter unidades, proveniência, lacunas, estimativas e limites explícitos. Não avaliar etapas planejadas sem segmentação confiável nem usar o traçado reduzido da UI para análise exata.
7. Configurar development build, módulo Expo Swift, HealthKit, plugin e provisionamento com a identidade do app oficial. Verificar compatibilidade e licenças; não copiar versões cegamente. Expo Go não valida essa integração.
8. Manter saúde/GPS fora de logs, analytics, cache não criptografado e envio automático a LLM. Qualquer persistência/upload segue consentimento e política do produto. Tratar troca de conta e respostas tardias.

Entregue implementação, testes relevantes, documentação dos contratos e limitações, PRs focados e checklist físico. Indique precisamente o que passou localmente, no EAS e no iPhone/Watch, e o que exige ação do proprietário. Não declare associação exata, entrega ao Watch ou disponibilidade universal de métricas sem evidência.
