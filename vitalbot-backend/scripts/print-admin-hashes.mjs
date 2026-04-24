import bcrypt from 'bcrypt'

/** Contraseñas solo para desarrollo: cámbialas al entrar por primera vez. */
const pairs = [
  ['vitalbot.admin1', 'admin1'],
  ['vitalbot.admin2', 'admin2'],
]

for (const [pwd, label] of pairs) {
  const h = await bcrypt.hash(pwd, 10)
  const ok = await bcrypt.compare(pwd, h)
  console.log(label, ok ? 'OK' : 'FAIL', h)
}
