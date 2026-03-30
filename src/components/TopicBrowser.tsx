'use client';

interface Topic {
  label: string;
  question: string;
}

interface TopicGroup {
  category: string;
  topics: Topic[];
}

const EMPLOYEE_TOPICS_EN: TopicGroup[] = [
  {
    category: 'Policies',
    topics: [
      { label: 'Attendance & Call-outs', question: 'What is the attendance and call-out policy?' },
      { label: 'Dress Code', question: 'What are the dress code requirements?' },
      { label: 'Phone Use', question: 'What is the policy for personal phone use at work?' },
      { label: 'Social Media', question: 'What is the social media policy?' },
      { label: 'Harassment & Conduct', question: 'What is the harassment and workplace conduct policy?' },
      { label: 'Progressive Discipline', question: 'What is the progressive discipline policy?' },
    ],
  },
  {
    category: 'Pay & Benefits',
    topics: [
      { label: 'Meal Discounts', question: 'What is the meal discount policy?' },
      { label: 'Tips & Tip Out', question: 'How does the tip and tip-out policy work?' },
      { label: 'Overtime', question: 'Is there overtime pay and how does it work?' },
      { label: 'Holidays', question: 'Do we have to work on holidays and is there holiday pay?' },
      { label: 'Time Off & Vacation', question: 'What is the time off and vacation policy?' },
      { label: 'Breaks', question: 'When are break times and how long are they?' },
    ],
  },
  {
    category: 'Work Standards',
    topics: [
      { label: 'Guest Service', question: 'What are the guest service standards?' },
      { label: 'Uniform & Appearance', question: 'What are the uniform and appearance standards?' },
      { label: 'Clocking In & Out', question: 'What are the rules for clocking in and out?' },
      { label: 'Safety & Emergencies', question: 'What are the safety and emergency procedures?' },
      { label: 'Food Safety', question: 'What are the food safety requirements for staff?' },
    ],
  },
];

const EMPLOYEE_TOPICS_ES: TopicGroup[] = [
  {
    category: 'Políticas',
    topics: [
      { label: 'Asistencia y Ausencias', question: '¿Cuál es la política de asistencia y ausencias?' },
      { label: 'Código de Vestimenta', question: '¿Cuáles son los requisitos del código de vestimenta?' },
      { label: 'Uso del Teléfono', question: '¿Cuál es la política de uso del teléfono personal en el trabajo?' },
      { label: 'Redes Sociales', question: '¿Cuál es la política de redes sociales?' },
      { label: 'Acoso y Conducta', question: '¿Cuál es la política de acoso y conducta en el trabajo?' },
      { label: 'Disciplina Progresiva', question: '¿Cuál es la política de disciplina progresiva?' },
    ],
  },
  {
    category: 'Pago y Beneficios',
    topics: [
      { label: 'Descuento en Comidas', question: '¿Cuál es la política de descuento en comidas?' },
      { label: 'Propinas', question: '¿Cómo funciona la política de propinas?' },
      { label: 'Horas Extra', question: '¿Hay pago de horas extra y cómo funciona?' },
      { label: 'Días Festivos', question: '¿Hay que trabajar en días festivos y hay pago especial?' },
      { label: 'Días Libres', question: '¿Cuál es la política de días libres y vacaciones?' },
      { label: 'Descansos', question: '¿Cuándo son los descansos y cuánto duran?' },
    ],
  },
  {
    category: 'Estándares de Trabajo',
    topics: [
      { label: 'Servicio al Cliente', question: '¿Cuáles son los estándares de servicio al cliente?' },
      { label: 'Uniforme y Apariencia', question: '¿Cuáles son los estándares de uniforme y apariencia?' },
      { label: 'Entrada y Salida', question: '¿Cuáles son las reglas para marcar entrada y salida?' },
      { label: 'Seguridad y Emergencias', question: '¿Cuáles son los procedimientos de seguridad y emergencias?' },
      { label: 'Seguridad Alimentaria', question: '¿Cuáles son los requisitos de seguridad alimentaria para el personal?' },
    ],
  },
];

const MANAGER_TOPICS: TopicGroup[] = [
  {
    category: 'People Management',
    topics: [
      { label: 'Progressive Discipline', question: 'What is the progressive discipline process step by step?' },
      { label: 'Performance Coaching', question: 'What are the steps for a performance coaching conversation?' },
      { label: 'Call-out & No-shows', question: 'How do I handle a call-out or no-show?' },
      { label: 'Terminations', question: 'What is the process for terminating an employee?' },
      { label: 'New Hire Onboarding', question: 'What is the new hire onboarding process?' },
      { label: 'Documenting Incidents', question: 'How should I document employee incidents and write-ups?' },
    ],
  },
  {
    category: 'Operations',
    topics: [
      { label: 'Opening Procedures', question: 'What are the opening procedures?' },
      { label: 'Closing Procedures', question: 'What are the closing procedures?' },
      { label: 'Cash Handling', question: 'What are the cash handling and drawer procedures?' },
      { label: 'Guest Complaints', question: 'How do I handle a guest complaint escalation?' },
      { label: 'Labor & Scheduling', question: 'What are the guidelines for managing labor and scheduling?' },
    ],
  },
  {
    category: 'Compliance',
    topics: [
      { label: 'Food Safety', question: 'What are the food safety compliance requirements for managers?' },
      { label: 'Break & Labor Laws', question: 'What break and labor law requirements should managers follow?' },
      { label: 'Tip Compliance', question: 'What are the tip pooling and compliance rules for managers?' },
    ],
  },
];

interface Props {
  handbookSource: 'employee' | 'manager';
  onSelect: (question: string) => void;
  language: 'en' | 'es';
}

export default function TopicBrowser({ handbookSource, onSelect, language }: Props) {
  const isManager = handbookSource === 'manager';
  const isSpanish = language === 'es';

  const groups = isManager
    ? MANAGER_TOPICS
    : isSpanish
    ? EMPLOYEE_TOPICS_ES
    : EMPLOYEE_TOPICS_EN;

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-5 rounded-full ${isManager ? 'bg-amber-500' : 'bg-[#2E86C1]'}`} />
        <h3 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider">
          {isManager
            ? 'Manager Topics'
            : isSpanish
            ? 'Temas del Manual'
            : 'Handbook Topics'}
        </h3>
      </div>

      {groups.map((group) => (
        <div key={group.category}>
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
            isManager ? 'text-amber-600' : 'text-[#2E86C1]'
          }`}>
            {group.category}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.topics.map(({ label, question }) => (
              <button
                key={label}
                onClick={() => onSelect(question)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  isManager
                    ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 hover:border-amber-400'
                    : 'bg-[#EBF3FB] border-[#2E86C1]/20 text-[#1B3A6B] hover:bg-[#2E86C1]/10 hover:border-[#2E86C1]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
