/**
 * Módulo chatbot — reservado. La lógica conversacional y reglas médicas
 * se implementará en una fase posterior (RF-03 en adelante).
 */
export function notImplemented(req, res) {
  res.status(501).json({
    message:
      'El módulo de chatbot aún no está implementado en el servidor.',
    code: 'CHATBOT_NOT_IMPLEMENTED',
  })
}
