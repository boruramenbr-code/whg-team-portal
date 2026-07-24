/**
 * Daily Mindset — the fallback voice of the house.
 *
 * When managers leave a pre-shift gap (no FOH message, no BOH message,
 * no focus), staff still see something worth reading: one rotating line
 * per section, the same line for everyone all day (deterministic by
 * date). Rendered with a small "daily mindset" chip so it's clearly the
 * house voice, never fake manager content.
 *
 * All lines are ORIGINAL writing in the spirit of Randy's teachers —
 * Preston Lee's 30% Rule (service vs hospitality) and Mike Bausch's
 * Unsliced (consistency, standards, systems) — credited as "inspired
 * by", never quoted. Randy can hand over real quotes with permission
 * and we swap them in verbatim.
 */

export interface MindsetLine {
  en: string;
  es: string;
  credit?: string;
}

const FOH: MindsetLine[] = [
  { en: 'Service is getting it right. Hospitality is making them feel it. Tonight, do both.',
    es: 'El servicio es hacerlo bien. La hospitalidad es hacerlo sentir. Hoy, haz las dos cosas.',
    credit: "Inspired by Preston Lee's 30% Rule" },
  { en: 'Guests won’t remember every dish — they’ll remember how you made them feel. That’s the 30% that counts.',
    es: 'Los invitados no recordarán cada platillo — recordarán cómo los hiciste sentir. Ese es el 30% que cuenta.',
    credit: "Inspired by Preston Lee's 30% Rule" },
  { en: 'Every table is someone’s night out. Be the reason they tell the story tomorrow.',
    es: 'Cada mesa es la salida especial de alguien. Sé la razón por la que cuenten la historia mañana.' },
  { en: 'Greet in 30 seconds. Eyes first, menu second.',
    es: 'Saluda en 30 segundos. Primero los ojos, después el menú.' },
  { en: 'Full hands in, full hands out — groom every table, every pass.',
    es: 'Manos llenas al entrar, manos llenas al salir — cuida cada mesa en cada pasada.' },
  { en: 'The best upsell is enthusiasm you actually mean.',
    es: 'La mejor venta es el entusiasmo genuino.' },
  { en: 'Slow night? Perfect night to be unforgettable.',
    es: '¿Noche tranquila? Noche perfecta para ser inolvidable.' },
  { en: 'Refill before they ask. Anticipation is hospitality.',
    es: 'Rellena antes de que pidan. Anticiparse es hospitalidad.' },
  { en: 'You’re on stage from the parking lot. The curtain is always up.',
    es: 'Estás en escena desde el estacionamiento. El telón siempre está arriba.' },
  { en: 'A first-timer today is a regular in a month — if we earn it.',
    es: 'El primerizo de hoy es el cliente de siempre en un mes — si nos lo ganamos.' },
  { en: 'Smile before you speak — they can hear it in your voice.',
    es: 'Sonríe antes de hablar — se escucha en tu voz.' },
  { en: 'Treat every table like it’s your grandmother visiting.',
    es: 'Trata cada mesa como si fuera la visita de tu abuela.' },
];

const BOH: MindsetLine[] = [
  { en: 'Consistency is the brand. Bowl #400 matters exactly as much as bowl #1.',
    es: 'La consistencia es la marca. El tazón #400 importa exactamente igual que el #1.',
    credit: "Inspired by Mike Bausch's Unsliced" },
  { en: 'Clean as you go isn’t a chore — it’s how professionals think.',
    es: 'Limpiar mientras trabajas no es un castigo — es como piensan los profesionales.' },
  { en: 'The guest never sees the line. They taste it.',
    es: 'El invitado nunca ve la línea. La prueba.' },
  { en: 'Recipes are promises. Keep them.',
    es: 'Las recetas son promesas. Cúmplelas.',
    credit: "Inspired by Mike Bausch's Unsliced" },
  { en: 'If it wouldn’t leave your kitchen at home, don’t let it leave this one.',
    es: 'Si no saldría de tu cocina en casa, que no salga de esta.' },
  { en: 'Sharp knives. Labeled containers. Calm rush.',
    es: 'Cuchillos afilados. Recipientes etiquetados. Hora pico en calma.' },
  { en: 'Taste before you send. Every time.',
    es: 'Prueba antes de mandar. Siempre.' },
  { en: 'Standards don’t take nights off.',
    es: 'Los estándares no descansan.',
    credit: "Inspired by Mike Bausch's Unsliced" },
  { en: 'Mise en place is respect — for the rush, and for each other.',
    es: 'El mise en place es respeto — por la hora pico y por el equipo.' },
  { en: 'Cook it for the regular who orders it every single week.',
    es: 'Cocínalo para el cliente que lo pide todas las semanas.' },
  { en: 'The plate is your signature. Sign it proud.',
    es: 'El plato es tu firma. Fírmalo con orgullo.' },
  { en: 'Great kitchens are boring: same spec, same temp, every single time.',
    es: 'Las grandes cocinas son aburridas: misma receta, misma temperatura, todas las veces.',
    credit: "Inspired by Mike Bausch's Unsliced" },
];

const FOCUS: MindsetLine[] = [
  { en: 'Know one menu item better than yesterday — open your Path.',
    es: 'Conoce un platillo mejor que ayer — abre tu Camino.' },
  { en: '30-second greets. Every table. No exceptions.',
    es: 'Saludos en 30 segundos. Cada mesa. Sin excepciones.' },
  { en: 'Never walk past your table empty-handed.',
    es: 'Nunca pases junto a tu mesa con las manos vacías.' },
  { en: 'Check back within two bites or two minutes.',
    es: 'Regresa a los dos bocados o dos minutos.' },
  { en: 'Full clear before every check hits the table.',
    es: 'Mesa despejada antes de que llegue cada cuenta.' },
  { en: 'Refills land before anyone has to ask.',
    es: 'Los refills llegan antes de que alguien pida.' },
  { en: 'One genuine thank-you per table — like you mean it.',
    es: 'Un agradecimiento genuino por mesa — de verdad.' },
  { en: 'Help one teammate before they ask.',
    es: 'Ayuda a un compañero antes de que lo pida.' },
  { en: 'Study one Fundamentals card today — wasabi to chopsticks, know your stuff.',
    es: 'Estudia una tarjeta de Fundamentals hoy — del wasabi a los palillos.' },
  { en: 'Pace the meal — nobody eats over the wreckage of the last course.',
    es: 'Marca el ritmo — nadie come sobre los restos del tiempo anterior.' },
  { en: 'Unsure? Ask. Guessing is how refires happen.',
    es: '¿Dudas? Pregunta. Adivinar es como nacen los platillos repetidos.' },
  { en: 'Leave your station better than you found it.',
    es: 'Deja tu estación mejor de como la encontraste.' },
];

/** Same lines for everyone, all day — rotates daily. Offsets keep the
 *  three sections from cycling in lockstep. */
export function getDailyMindset(date: Date = new Date()): { foh: MindsetLine; boh: MindsetLine; focus: MindsetLine } {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return {
    foh: FOH[day % FOH.length],
    boh: BOH[(day + 4) % BOH.length],
    focus: FOCUS[(day + 8) % FOCUS.length],
  };
}
