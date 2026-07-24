/**
 * Weekly Owner's Inspiration — the standing voice of ownership.
 *
 * When no real Owner's Message is live, the week's inspiration holds
 * the card on Home. Rotates every 7 days, same message all week,
 * cycles forever. A real post from Randy always overrides it — and
 * when that post expires, the rotation resumes automatically.
 *
 * These render AS the Owner's Message, so every line is written in
 * Randy's voice — warm, direct, them-first — and Randy reviews and
 * owns every word.
 */

export interface WeeklyNote {
  en: string;
  es: string;
}

const WEEKLY: WeeklyNote[] = [
  { en: 'People ask me what makes this place work. It’s never been the recipes — it’s the people carrying the plates and running the line. Thank you for being that. This week, let’s make somebody’s night.',
    es: 'Me preguntan qué hace funcionar este lugar. Nunca han sido las recetas — es la gente que carga los platos y saca la línea. Gracias por ser esa gente. Esta semana, hagámosle la noche a alguien.' },
  { en: 'Anyone can serve food. What we do is different: we make people feel taken care of. That last 30% — the warmth, the eye contact, the genuine thank-you — that’s what they drive across town for.',
    es: 'Cualquiera puede servir comida. Lo nuestro es diferente: hacemos que la gente se sienta cuidada. Ese último 30% — la calidez, la mirada, el gracias genuino — por eso cruzan la ciudad.' },
  { en: 'If you want more here — more skills, more responsibility, a different position — say it out loud. Open your training path, raise your hand. We build careers in this company, not just schedules.',
    es: 'Si quieres más aquí — más habilidades, más responsabilidad, otra posición — dilo en voz alta. Abre tu camino de entrenamiento, levanta la mano. En esta empresa construimos carreras, no solo horarios.' },
  { en: 'Some shifts test you. The rush hits, the tickets stack, and nothing bounces right. Those are the nights that build professionals — and the nights I’m proudest of this team.',
    es: 'Hay turnos que te ponen a prueba. Llega la hora pico, se apilan los tickets y nada sale a la primera. Esas son las noches que forman profesionales — y las noches que más orgullo me dan.' },
  { en: 'Take care of each other first. A team that covers for each other, teaches each other, and celebrates each other will take care of every guest automatically. It always flows in that order.',
    es: 'Primero cuídense entre ustedes. Un equipo que se apoya, se enseña y se celebra, cuida a cada invitado automáticamente. Siempre fluye en ese orden.' },
  { en: 'That table tonight might be a first date, a promotion, a goodbye dinner. We don’t know which — so we treat every one like it matters, because to somebody, it does.',
    es: 'Esa mesa de hoy puede ser una primera cita, un ascenso, una despedida. No sabemos cuál — así que tratamos cada una como si importara, porque para alguien, importa.' },
  { en: 'Greatness is boring: the same greet, the same standards, the same groomed table, every single day. Consistency isn’t glamorous — it’s just what separates the best from everyone else.',
    es: 'La grandeza es aburrida: el mismo saludo, los mismos estándares, la misma mesa cuidada, todos los días. La consistencia no brilla — solo separa a los mejores de todos los demás.' },
  { en: 'Small wins count. A first-timer who books a birthday. A perfect close. A trainee’s first solo table. Notice them, celebrate them — the big wins are just small ones stacked up.',
    es: 'Las victorias pequeñas cuentan. Un primerizo que reserva un cumpleaños. Un cierre perfecto. La primera mesa sola de un aprendiz. Nótalas, celébralas — las grandes solo son pequeñas apiladas.' },
  { en: 'Remember your first week here? The nerves, the names, the menu that looked impossible? Somebody helped you through it. Be that somebody for the newest name on the schedule.',
    es: '¿Recuerdas tu primera semana aquí? Los nervios, los nombres, el menú imposible. Alguien te ayudó a pasarla. Sé ese alguien para el nombre más nuevo del horario.' },
  { en: 'My family’s name is on the door — but this place runs on yours. Every shift you work builds something we all share. I don’t take that lightly, and I never will.',
    es: 'El apellido de mi familia está en la puerta — pero este lugar corre con el tuyo. Cada turno que trabajas construye algo que compartimos. No lo tomo a la ligera, y nunca lo haré.' },
  { en: 'Rest is part of the job. On your day off, actually be off. This industry burns out the people who never stop — and I need you sharp, healthy, and here for the long run.',
    es: 'Descansar es parte del trabajo. En tu día libre, descansa de verdad. Esta industria quema a los que nunca paran — y te necesito con energía, sano y aquí a largo plazo.' },
  { en: 'If something’s broken — a process, a schedule, a piece of equipment, a morale problem — tell a manager or tell me. I’d rather hear a hard truth today than lose a good person over it next month.',
    es: 'Si algo está roto — un proceso, un horario, un equipo, el ánimo — dile a un gerente o dime a mí. Prefiero una verdad difícil hoy que perder a alguien bueno el próximo mes.' },
  { en: 'The easiest day to lower a standard is the day nobody’s watching. That’s exactly the day we don’t. What we do when it’s slow and quiet is who we really are.',
    es: 'El día más fácil para bajar un estándar es el día que nadie mira. Ese es justo el día que no lo hacemos. Lo que hacemos cuando está tranquilo es quienes somos de verdad.' },
  { en: 'Hospitality isn’t a shift you work — it’s a way you treat people. The regular, the first-timer, the delivery driver, the teammate having a rough day. All of them get the same warmth.',
    es: 'La hospitalidad no es un turno — es una forma de tratar a la gente. El cliente de siempre, el primerizo, el repartidor, el compañero con un mal día. Todos reciben la misma calidez.' },
  { en: 'Learn one thing this week. One roll you couldn’t name, one skill you haven’t signed off, one word of Japanese. A year of single weeks like that and you’re a different professional.',
    es: 'Aprende una cosa esta semana. Un rollo que no sabías nombrar, una habilidad sin firmar, una palabra de japonés. Un año de semanas así y eres otro profesional.' },
  { en: 'Mistakes happen on my floor every night — that’s what a real restaurant looks like. Own it, fix it, learn it. The only mistake that worries me is the one somebody hides.',
    es: 'En mi piso hay errores cada noche — así se ve un restaurante de verdad. Acéptalo, corrígelo, apréndelo. El único error que me preocupa es el que alguien esconde.' },
  { en: 'FOH and BOH aren’t two teams — they’re two halves of one promise. The kitchen’s craft deserves service that honors it; the floor’s hustle deserves plates worth carrying. Respect flows both ways.',
    es: 'FOH y BOH no son dos equipos — son dos mitades de una promesa. El oficio de la cocina merece un servicio que lo honre; el esfuerzo del piso merece platos dignos de cargar. El respeto va en ambas direcciones.' },
  { en: 'Guests can get sushi and ramen a lot of places. They come back HERE for faces they recognize and the feeling that someone’s glad they walked in. You are the reason for the second visit.',
    es: 'Los invitados pueden comer sushi y ramen en muchos lugares. Vuelven AQUÍ por caras conocidas y por sentir que alguien se alegra de verlos entrar. Tú eres la razón de la segunda visita.' },
  { en: 'Details are love made visible: the wiped soy bottle, the straight chopsticks, the water refilled before anyone asks. Guests can’t always name what felt right — but they always feel it.',
    es: 'Los detalles son cariño hecho visible: la botella de soya limpia, los palillos derechos, el agua rellenada antes de que pidan. Los invitados no siempre saben qué se sintió bien — pero siempre lo sienten.' },
  { en: 'Your attitude walks in the door thirty seconds before your skills do. Bring the version of you that you’d want to work beside — the rest of the shift tends to follow it.',
    es: 'Tu actitud entra por la puerta treinta segundos antes que tus habilidades. Trae la versión de ti con la que te gustaría trabajar — el resto del turno suele seguirla.' },
  { en: 'Somebody on this team did something great this week that nobody saw. If you saw it — say it. Recognition from a teammate hits different than anything I could ever post here.',
    es: 'Alguien de este equipo hizo algo grande esta semana que nadie vio. Si tú lo viste — dilo. El reconocimiento de un compañero llega más lejos que cualquier cosa que yo publique aquí.' },
  { en: 'Busy nights are the show we practice for. When the board fills and the door won’t stop — that’s not the hard part of this job. That’s the part where we get to prove who we are.',
    es: 'Las noches llenas son el show para el que practicamos. Cuando el tablero se llena y la puerta no para — esa no es la parte difícil. Es la parte donde demostramos quiénes somos.' },
  { en: 'Slow days are craft days. Deep-clean the station, study the menu, drill the pour, teach somebody something. Champions are built in the off-season — every industry, same rule.',
    es: 'Los días lentos son días de oficio. Limpia a fondo, estudia el menú, practica, enséñale algo a alguien. Los campeones se forman fuera de temporada — en toda industria, la misma regla.' },
  { en: 'We feed this city, and this city feeds our families. When Baton Rouge walks through our door, they’re trusting us with their evening. That trust is the whole business.',
    es: 'Alimentamos a esta ciudad, y esta ciudad alimenta a nuestras familias. Cuando Baton Rouge cruza nuestra puerta, nos confía su noche. Esa confianza es todo el negocio.' },
  { en: 'To the families behind my team: thank you for sharing them with us on nights, weekends, and holidays. I know what that costs, and I promise it’s building toward something.',
    es: 'A las familias detrás de mi equipo: gracias por compartirlos con nosotros en noches, fines de semana y días festivos. Sé lo que eso cuesta, y prometo que está construyendo algo.' },
  { en: 'Act like an owner this week — not because it’s your money, but because it’s your name too. Pick up the trash you didn’t drop. Fix the thing nobody assigned you. That’s how leaders get noticed here.',
    es: 'Actúa como dueño esta semana — no porque sea tu dinero, sino porque también es tu nombre. Recoge la basura que no tiraste. Arregla lo que nadie te asignó. Así se notan los líderes aquí.' },
  { en: 'The best compliment we get isn’t about the food — it’s "everyone here seems like they actually like each other." Guests feel a real team from across the room. Keep being one.',
    es: 'El mejor cumplido que recibimos no es sobre la comida — es "aquí todos parecen llevarse bien de verdad." Los invitados sienten un equipo real desde el otro lado del salón. Sigan siéndolo.' },
  { en: 'This company is still growing, and every new door we open gets staffed by people who grew inside these ones. The next leader of something we haven’t built yet is reading this right now.',
    es: 'Esta empresa sigue creciendo, y cada puerta nueva que abrimos se llena con gente que creció dentro de estas. El próximo líder de algo que aún no construimos está leyendo esto ahora mismo.' },
];

/** Same note all week — flips every 7 days, cycles forever. */
export function getWeeklyInspiration(date: Date = new Date()): WeeklyNote {
  const start = new Date(date.getFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const week = Math.floor(day / 7);
  return WEEKLY[week % WEEKLY.length];
}
