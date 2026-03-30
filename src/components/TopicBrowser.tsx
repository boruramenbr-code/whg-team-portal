'use client';

interface Topic {
  label: string;
  question: string;
}

interface TopicGroup {
  category: string;
  topics: Topic[];
}

const EMPLOYEE_TOPICS: TopicGroup[] = [
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
}

export default function TopicBrowser({ handbookSource, onSelect }: Props) {
  const groups = handbookSource === 'manager' ? MANAGER_TOPICS : EMPLOYEE_TOPICS;
  const isManager = handbookSource === 'manager';

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-5 rounded-full ${isManager ? 'bg-amber-500' : 'bg-[#2E86C1]'}`} />
        <h3 className="text-xs font-bold text-[#1B3A6B] uppercase tracking-wider">
          {isManager ? 'Manager Topics' : 'Handbook Topics'}
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
