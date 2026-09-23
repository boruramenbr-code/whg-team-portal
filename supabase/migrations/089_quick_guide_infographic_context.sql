-- ============================================================
-- 089 — Quick Guide infographics: context (Randy, Sept 23 2026)
--
-- Randy liked the pilot but found it a little simple. Every infographic
-- can now carry two more lines, always in the same spot at the bottom:
--   • why      — one sentence on the reason behind the rule
--   • example  — one sentence showing it on a real shift (skipped when
--                the graphic is already concrete)
-- The full policy stays one tap away — the "Read the full policy in the
-- Handbook" button now sits right under the card.
--
-- The "why" lines are business reasons, never new rules; the handbook
-- remains the official policy (every card's footer says so).
--
-- Rewrites the 10 pilot cards in full. Safe to run more than once.
-- ============================================================

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
  "icon": "shield",
  "why": {
    "en": "Skill doesn't help the team on a night you're not there. Reliability is what makes everything else you do count.",
    "es": "La habilidad no ayuda al equipo la noche que no estás. La confiabilidad es lo que hace que todo lo demás cuente."
  },
  "example": {
    "en": "Two servers with the same skills — the one who never misses a shift is the one we invest in first.",
    "es": "Dos meseros con las mismas habilidades — el que nunca falta es en quien invertimos primero."
  }
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
  },
  "why": {
    "en": "Your start time is when your section and your teammates are counting on you. Five minutes late puts everyone behind before the first guest arrives.",
    "es": "Tu hora de inicio es cuando tu sección y tus compañeros cuentan contigo. Cinco minutos tarde atrasa a todos antes de que llegue el primer cliente."
  },
  "example": {
    "en": "Shift starts at 5:00. Ready on the floor at 5:04 — on time. Still changing at 5:06 — tardy.",
    "es": "El turno empieza a las 5:00. Listo en el piso a las 5:04 — a tiempo. Cambiándote todavía a las 5:06 — retardo."
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
  },
  "why": {
    "en": "Two hours is what a manager needs to call someone in, so your teammates don't get buried.",
    "es": "Dos horas es lo que un gerente necesita para llamar a alguien más, para que tus compañeros no se ahoguen."
  },
  "example": {
    "en": "Working at 4:00? Post in the manager group by 2:00 at the latest.",
    "es": "¿Entras a las 4:00? Avisa en el grupo de gerentes a más tardar a las 2:00."
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
  },
  "why": {
    "en": "When you don't call, nobody knows whether to wait for you or replace you — the whole shift absorbs it.",
    "es": "Cuando no avisas, nadie sabe si esperarte o reemplazarte — todo el turno lo absorbe."
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
  },
  "why": {
    "en": "Two weeks lets your manager build the schedule around you instead of scrambling.",
    "es": "Dos semanas le permiten a tu gerente armar el horario contigo en mente en vez de improvisar."
  },
  "example": {
    "en": "Want Friday the 20th off? Request it in 7shifts by Friday the 6th.",
    "es": "¿Quieres el viernes 20 libre? Pídelo en 7shifts a más tardar el viernes 6."
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
  ],
  "why": {
    "en": "A manager has to make sure whoever covers is trained for your spot and that the swap doesn't create overtime.",
    "es": "Un gerente tiene que asegurarse de que quien te cubra esté capacitado para tu puesto y de que el cambio no genere horas extra."
  },
  "example": {
    "en": "A teammate agreed to take your Saturday? It's still your shift until a manager approves the swap in 7shifts.",
    "es": "¿Un compañero aceptó cubrir tu sábado? Sigue siendo tu turno hasta que un gerente apruebe el cambio en 7shifts."
  }
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
  },
  "why": {
    "en": "Your schedule is built from what 7shifts says you can work. Wrong availability means a wrong schedule for everyone.",
    "es": "Tu horario se arma con lo que 7shifts dice que puedes trabajar. Disponibilidad equivocada significa un horario equivocado para todos."
  },
  "example": {
    "en": "Starting classes on Tuesdays? Update 7shifts before next week's schedule posts on Thursday.",
    "es": "¿Empiezas clases los martes? Actualiza 7shifts antes de que se publique el horario de la próxima semana el jueves."
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
  },
  "why": {
    "en": "Every step is documented, so you always know where you stand and exactly what fixes it. No surprises.",
    "es": "Cada paso queda documentado, así siempre sabes dónde estás y qué lo corrige. Sin sorpresas."
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
  },
  "why": {
    "en": "We care about your pattern, not one mistake held against you forever.",
    "es": "Nos importa tu patrón, no un error que te persiga para siempre."
  },
  "example": {
    "en": "Written warning in March. Clean through the next March — and it can come off.",
    "es": "Advertencia escrita en marzo. Limpio hasta el siguiente marzo — y puede salir de tu historial."
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
  },
  "why": {
    "en": "Those are our busiest hours. Every hand is on the floor for guests.",
    "es": "Esas son nuestras horas más ocupadas. Todas las manos están en el piso para los clientes."
  },
  "example": {
    "en": "Working 11 to 5? Eat before 11:30 or after 1:30.",
    "es": "¿Trabajas de 11 a 5? Come antes de las 11:30 o después de la 1:30."
  }
}$IG$::jsonb,
    updated_at = now()
where id = '7e1ebc1a-76e0-44ba-877b-cea959addccf';

-- ── Result (should read 10 and 8) ─────────────────────────────────
select
  count(*) filter (where infographic ? 'why') as cards_with_why,
  count(*) filter (where infographic ? 'example') as cards_with_example
from handbook_cards
where infographic is not null;
