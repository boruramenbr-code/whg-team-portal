-- ============================================================
-- 088 — Quick Guide infographics (Randy, Sept 23 2026)
--
-- Cards can carry a drawn infographic instead of an uploaded picture.
-- The infographic stores the shape of the point — a key number,
-- escalation steps, a process, time windows, do/don't, a checklist, a
-- side-by-side, a pay calendar — and the app draws it in the topic's
-- accent color (src/components/GuideInfographic.tsx). Any text in it can
-- be { "en": ..., "es": ... }, so it switches language with the app.
--
-- When a card has one, it replaces the picture AND the bullet points —
-- the infographic is written to carry the whole card. Cards without one
-- keep the classic picture → headline → points → heads-up layout.
--
-- Pilot: all 9 cards of "Lates, Call-Outs & Time Off" + the meal-window
-- card in "Meals & Perks". The Quick Guide is still preview-only, so
-- only the owner sees these until topics are published.
--
-- Safe to run more than once. The last statement prints the result.
-- ============================================================

alter table handbook_cards add column if not exists infographic jsonb;

-- Reliability comes first.
update handbook_cards
set infographic = $IG${
  "type": "stat",
  "value": "#1",
  "label": {
    "en": "Reliability",
    "es": "Confiabilidad"
  },
  "sub": {
    "en": "The first thing we evaluate — and the first thing that affects your raise. It shows your team you're worth investing in.",
    "es": "Lo primero que evaluamos — y lo primero que afecta tu aumento. Le muestra a tu equipo que vale la pena invertir en ti."
  },
  "icon": "shield"
}$IG$::jsonb,
    updated_at = now()
where id = '98d90b46-b264-4ae1-9585-ac7383724e79';

-- More than 5 minutes late counts as a tardy.
update handbook_cards
set infographic = $IG${
  "type": "stat",
  "value": "5",
  "unit": {
    "en": "min",
    "es": "min"
  },
  "label": {
    "en": "The line for a tardy",
    "es": "El límite para un retardo"
  },
  "sub": {
    "en": "On time means ready to work at your start time — not walking in the door, not still changing. A manager approved it ahead of time? Not a tardy.",
    "es": "A tiempo significa listo para trabajar a tu hora de inicio — no entrando por la puerta ni cambiándote todavía. ¿Un gerente lo aprobó antes? No cuenta como retardo."
  },
  "icon": "clock",
  "footer": {
    "tone": "warn",
    "text": {
      "en": "3 tardies in 30 days → a formal conversation, and it may be written up",
      "es": "3 retardos en 30 días → una conversación formal, y puede quedar por escrito"
    }
  }
}$IG$::jsonb,
    updated_at = now()
where id = '80becfe6-ab2f-4e31-875b-f219c75bb982';

-- Can’t make it? Post in the Telegram manager group at least 2 hours before.
update handbook_cards
set infographic = $IG${
  "type": "stat",
  "value": "2",
  "unit": {
    "en": "hrs",
    "es": "hrs"
  },
  "label": {
    "en": "notice before your shift",
    "es": "de aviso antes de tu turno"
  },
  "sub": {
    "en": "Post it in the Telegram manager group — every manager sees it, and there's a written record. Don't text one manager directly.",
    "es": "Publícalo en el grupo de gerentes de Telegram — todos los gerentes lo ven y queda por escrito. No le escribas a un solo gerente."
  },
  "icon": "send",
  "footer": {
    "tone": "warn",
    "text": {
      "en": "One honest emergency is fine. Patterns — Friday nights, after holidays, or 3 in a month without a clear reason — are a problem.",
      "es": "Una emergencia honesta está bien. Los patrones — viernes en la noche, después de festivos, o 3 en un mes sin una razón clara — son un problema."
    }
  }
}$IG$::jsonb,
    updated_at = now()
where id = '135caf09-294c-4252-9e4d-a09a2c7cdfb6';

-- Never no call / no show.
update handbook_cards
set infographic = $IG${
  "type": "steps",
  "tone": "escalation",
  "steps": [
    {
      "title": {
        "en": "First time",
        "es": "Primera vez"
      },
      "sub": {
        "en": "A formal written warning",
        "es": "Una advertencia escrita formal"
      }
    },
    {
      "title": {
        "en": "Again within 90 days",
        "es": "Otra vez en 90 días"
      },
      "sub": {
        "en": "May mean termination",
        "es": "Puede significar terminación"
      }
    },
    {
      "title": {
        "en": "Two in a row",
        "es": "Dos seguidas"
      },
      "sub": {
        "en": "Treated as quitting — job abandonment",
        "es": "Se trata como renuncia — abandono de trabajo"
      }
    }
  ],
  "note": {
    "en": "A real emergency kept you from calling? Contact your manager as soon as you can.",
    "es": "¿Una emergencia real te impidió avisar? Contacta a tu gerente lo antes posible."
  }
}$IG$::jsonb,
    updated_at = now()
where id = 'bc991f53-54c2-4da8-bb4c-cdb33ffef67e';

-- Request time off in 7shifts at least 2 weeks ahead.
update handbook_cards
set infographic = $IG${
  "type": "steps",
  "tone": "process",
  "steps": [
    {
      "title": {
        "en": "Request it in 7shifts",
        "es": "Pídelo en 7shifts"
      },
      "sub": {
        "en": "At least 2 weeks ahead",
        "es": "Con al menos 2 semanas de anticipación"
      }
    },
    {
      "title": {
        "en": "Wait for your manager's written OK",
        "es": "Espera el visto bueno por escrito de tu gerente"
      },
      "sub": {
        "en": "Asking isn't the same as approved",
        "es": "Pedirlo no es lo mismo que aprobarlo"
      }
    },
    {
      "title": {
        "en": "Then book your travel",
        "es": "Luego reserva tu viaje"
      },
      "sub": {
        "en": "Never before it's approved",
        "es": "Nunca antes de que esté aprobado"
      }
    }
  ],
  "note": {
    "en": "An unconfirmed request is not an approved absence.",
    "es": "Una solicitud sin confirmar no es una ausencia aprobada."
  }
}$IG$::jsonb,
    updated_at = now()
where id = '546daacb-29ae-4951-8b25-abef5a5cfd4a';

-- Swapping a shift? Get a manager’s OK first.
update handbook_cards
set infographic = $IG${
  "type": "steps",
  "tone": "process",
  "steps": [
    {
      "title": {
        "en": "Find someone trained for your position",
        "es": "Busca a alguien capacitado para tu posición"
      },
      "sub": {
        "en": "The swap can't create overtime or break labor rules",
        "es": "El cambio no puede crear horas extra ni romper reglas laborales"
      }
    },
    {
      "title": {
        "en": "Request the swap in 7shifts",
        "es": "Pide el cambio en 7shifts"
      }
    },
    {
      "title": {
        "en": "A manager confirms it",
        "es": "Un gerente lo confirma"
      },
      "sub": {
        "en": "Until then, the shift is still yours",
        "es": "Hasta entonces, el turno sigue siendo tuyo"
      }
    }
  ]
}$IG$::jsonb,
    updated_at = now()
where id = '9aca4933-547d-4d03-8fa7-29d294aefcb3';

-- Keep your availability honest and up to date.
update handbook_cards
set infographic = $IG${
  "type": "dodont",
  "do": [
    {
      "en": "Keep your availability current in 7shifts",
      "es": "Mantén tu disponibilidad al día en 7shifts"
    },
    {
      "en": "Tell your manager early when it changes",
      "es": "Avísale a tu gerente con tiempo cuando cambie"
    }
  ],
  "dont": [
    {
      "en": "Leave old availability up",
      "es": "Dejar disponibilidad vieja"
    },
    {
      "en": "Get scheduled on it, then call out",
      "es": "Que te programen con ella y luego faltar"
    }
  ],
  "note": {
    "en": "Calling out on a shift your old availability allowed counts as an attendance issue — not a scheduling mistake.",
    "es": "Faltar a un turno que tu disponibilidad vieja permitía cuenta como problema de asistencia — no como error de horario."
  }
}$IG$::jsonb,
    updated_at = now()
where id = 'cc7d84f4-323e-43fc-9ff2-83fac998065e';

-- If attendance becomes a problem, these are the steps.
update handbook_cards
set infographic = $IG${
  "type": "steps",
  "tone": "escalation",
  "steps": [
    {
      "title": {
        "en": "Verbal coaching",
        "es": "Orientación verbal"
      },
      "sub": {
        "en": "A documented talk with clear expectations",
        "es": "Una conversación documentada con expectativas claras"
      }
    },
    {
      "title": {
        "en": "Written warning",
        "es": "Advertencia escrita"
      },
      "sub": {
        "en": "Formal documentation and a timeline to improve",
        "es": "Documentación formal con un plazo para mejorar"
      }
    },
    {
      "title": {
        "en": "Final warning",
        "es": "Advertencia final"
      },
      "sub": {
        "en": "The last step before termination is considered",
        "es": "El último paso antes de considerar la terminación"
      }
    },
    {
      "title": {
        "en": "Termination",
        "es": "Terminación"
      },
      "sub": {
        "en": "If the pattern continues",
        "es": "Si el patrón continúa"
      }
    }
  ],
  "note": {
    "en": "Serious violations can skip steps. The goal is a fair chance to course-correct.",
    "es": "Las violaciones graves pueden saltar pasos. La meta es darte una oportunidad justa de corregir el rumbo."
  }
}$IG$::jsonb,
    updated_at = now()
where id = 'ca9833df-e896-4852-ba3d-fdb94fc627bf';

-- 12 clean months can reset a written warning.
update handbook_cards
set infographic = $IG${
  "type": "stat",
  "value": "12",
  "unit": {
    "en": "months",
    "es": "meses"
  },
  "segments": 12,
  "label": {
    "en": "in a row, same issue never repeated",
    "es": "seguidos, sin repetir el mismo problema"
  },
  "sub": {
    "en": "Do that and a written warning can come off your record. Managers track it — and real progress shows in your evaluation.",
    "es": "Si lo logras, una advertencia escrita puede salir de tu historial. Los gerentes lo registran — y el progreso real se nota en tu evaluación."
  }
}$IG$::jsonb,
    updated_at = now()
where id = '0659d386-ac94-423e-aca8-26e0b302a755';

-- No eating 11:30am–1:30pm or 5:30pm–8:30pm — not even managers.
update handbook_cards
set infographic = $IG${
  "type": "day",
  "from": "10:00",
  "to": "22:00",
  "blocks": [
    {
      "start": "11:30",
      "end": "13:30"
    },
    {
      "start": "17:30",
      "end": "20:30"
    }
  ],
  "blockLabel": {
    "en": "Reserved for guest service — no eating, not even managers",
    "es": "Reservado para el servicio — nadie come, ni los gerentes"
  },
  "openLabel": {
    "en": "Your shift meal happens outside these windows.",
    "es": "Tu comida de turno es fuera de estas horas."
  }
}$IG$::jsonb,
    updated_at = now()
where id = '7e1ebc1a-76e0-44ba-877b-cea959addccf';

-- ── Result (should read 10) ────────────────────────────────────────
select count(*) as cards_with_infographic
from handbook_cards
where infographic is not null;
