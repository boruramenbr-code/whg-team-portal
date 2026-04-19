-- ============================================================
-- 011_seed_policies_es.sql
-- Populates the _es columns for all policies (handbook ack,
-- 9 employee policies, 7 manager policies) with natural
-- Mexican/Central American Spanish translations.
--
-- Uses UPDATE ... WHERE title = '...' AND version = 1
-- so it layers onto existing rows from 002/003.
-- ============================================================

-- ============================================================
-- 0. HANDBOOK MASTER ACKNOWLEDGMENT
-- ============================================================
update policies set
  acknowledgment_text_es = $$He recibido el manual del empleado de Wong Hospitality Group y he tenido la oportunidad de leerlo. Acepto seguir todas las políticas y hacer preguntas si algo no me queda claro. Entiendo que el incumplimiento de estas reglas puede resultar en medidas disciplinarias, incluyendo la terminación de mi empleo. Las políticas pueden ser actualizadas y la gerencia me notificará sobre cualquier cambio.$$
where title = 'WHG Team Handbook' and version = 1;

-- ============================================================
-- 1. Cell Phone Use
-- ============================================================
update policies set
  purpose_es = $PURPOSE_ES$El uso personal del teléfono durante el turno distrae la atención de los clientes, atrasa al equipo y crea riesgos de seguridad y sanidad en la cocina. Esta política establece un estándar claro para que cada empleado sepa cuándo está bien usar el teléfono y cuándo no.$PURPOSE_ES$,
  details_es = $DETAILS_ES$- Los teléfonos personales deben estar fuera del piso y fuera de la cocina durante su turno. Guárdelos en su bolsa, casillero o área designada para teléfonos.
- Los teléfonos solo se pueden usar durante los descansos programados, y únicamente en el área de descanso o afuera — nunca a la vista de los clientes y nunca en áreas de preparación de alimentos o lavado de platos.
- Si espera una llamada de emergencia (hijo enfermo, situación familiar), notifique a su gerente al inicio de su turno. Ellos guardarán su teléfono o le permitirán revisarlo en horarios acordados.
- Nada de teléfonos en la estación del host, POS, barra, barra de sushi, parrilla de hibachi, línea de expedición o cualquier estación de preparación. Esto incluye navegar, enviar mensajes, tomar fotos o escuchar música con audífonos.
- No tome fotos ni videos de clientes, otros empleados, tickets de comida, pantallas del POS o el interior del restaurante sin aprobación del gerente. Esto protege la privacidad de los clientes y la información confidencial.
- Los relojes inteligentes cuentan como teléfonos. Si su reloj está conectado a su teléfono y está leyendo mensajes durante el servicio, eso es una violación.
- Los gerentes pueden usar teléfonos solo para propósitos de trabajo durante el servicio (horarios, pedidos, comunicación con los dueños). El uso personal sigue la misma regla de solo durante descansos.$DETAILS_ES$,
  consequences_es = $CONS_ES$- 1ra violación: Conversación verbal con su gerente y el teléfono se retiene por el resto del turno.
- 2da violación: Advertencia escrita en su expediente.
- 3ra violación: Advertencia escrita final y suspensión de un turno sin pago.
- 4ta violación: Terminación del empleo.
- Violaciones de tolerancia cero (que resultan en advertencia final inmediata o terminación según la gravedad): tomar fotos/videos de clientes o compañeros de trabajo sin consentimiento, usar el teléfono mientras maneja alimentos o en una estación frente a clientes, o publicar cualquier cosa sobre el restaurante, compañeros o clientes en redes sociales durante un turno.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Entiendo que el uso personal del teléfono celular durante mi turno se limita a los descansos programados en áreas designadas. No usaré mi teléfono en ninguna estación frente a clientes o de preparación de alimentos, y no tomaré fotos ni videos dentro del restaurante sin aprobación del gerente. Entiendo que las violaciones repetidas pueden llevar a medidas disciplinarias incluyendo la terminación, y que ciertas violaciones (como fotografiar clientes o publicar sobre el restaurante durante mi turno) pueden resultar en terminación inmediata.$ACK_ES$
where title = 'Cell Phone Use' and version = 1;

-- ============================================================
-- 2. Attendance & Punctuality
-- ============================================================
update policies set
  purpose_es = $PURPOSE_ES$Un restaurante funciona con un horario. Cuando una persona llega tarde o no se presenta, todo el equipo cubre el espacio, el servicio se afecta y los clientes lo notan. Esta política deja claro lo que esperamos en cuanto a presentarse, llegar a tiempo y manejar las situaciones cuando genuinamente no puede asistir.$PURPOSE_ES$,
  details_es = $DETAILS_ES$- Llegar a tiempo significa estar fichado y listo para trabajar a la hora programada de inicio — en uniforme, teléfono guardado, estación preparada. "A tiempo" no es cruzar la puerta a la hora de inicio.
- Planee llegar 10 minutos antes de su turno para tener tiempo de estacionarse, cambiarse y empezar el turno con calma.
- Se aplica una ventana de gracia de 5 minutos para fichar; cualquiera que fiche 6 o más minutos después de su hora programada se considera tarde.
- Para reportar ausencia (no puede asistir a su turno), debe llamar por teléfono directamente al gerente en turno — no por mensaje de texto, no a través de un compañero — al menos 3 horas antes de su hora programada cuando sea posible.
- Para una verdadera emergencia (enfermedad, accidente, crisis familiar) donde no es posible dar 3 horas de aviso, llame tan pronto como razonablemente pueda. Solo enviar mensaje de texto no es un aviso aceptable a menos que físicamente no pueda hablar.
- No presentarse sin aviso (faltar a un turno sin ningún contacto antes o durante el turno) se trata como una violación seria.
- Los intercambios de turno deben ser aprobados por un gerente con anticipación a través de 7shifts o R365 Workforce, dependiendo de la plataforma que use su ubicación. No puede intercambiar turnos informalmente con un compañero — el horario debe reflejar el cambio para que el gerente sepa quién está en el piso.
- Si va a llegar tarde, llame al gerente inmediatamente. No espere hasta que llegue para explicar.
- Ausencias consecutivas (dos o más turnos seguidos) pueden requerir una nota médica antes de su siguiente turno.
- Las ausencias injustificadas y la tardanza se rastrean en una ventana de 90 días. Los patrones importan más que los incidentes aislados.$DETAILS_ES$,
  consequences_es = $CONS_ES$- Tardanza (fichar 6+ minutos después de la hora programada):
  - 1ra ocurrencia en un período de 90 días: conversación verbal.
  - 2da ocurrencia: advertencia escrita.
  - 3ra ocurrencia: advertencia escrita final.
  - 4ta ocurrencia: terminación.
- Ausencia con aviso adecuado (3+ horas): no se disciplina la primera vez. Ausencias excesivas (3+ en un período de 90 días, incluso con aviso) pasan al proceso de advertencia escrita.
- Ausencia con aviso corto (menos de 3 horas, no una emergencia): se trata como una advertencia escrita.
- No presentarse sin aviso:
  - 1ra ofensa: advertencia escrita final, posible suspensión y pérdida de turnos preferidos.
  - 2da ofensa: terminación.
- Tres ausencias consecutivas sin aviso se tratan como renuncia voluntaria y su puesto se cierra.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Entiendo que presentarme a tiempo y en uniforme, listo para trabajar, es una expectativa fundamental de mi trabajo. Llamaré al gerente en turno por teléfono — no por mensaje — al menos 3 horas antes de mi turno si no puedo asistir, excepto en una verdadera emergencia. Entiendo que los intercambios de turno requieren aprobación previa del gerente a través de 7shifts o R365 Workforce, y que no presentarse sin aviso puede resultar en disciplina inmediata incluyendo la terminación. Entiendo que tres ausencias consecutivas sin aviso se tratarán como renuncia voluntaria.$ACK_ES$
where title = 'Attendance & Punctuality' and version = 1;

-- ============================================================
-- 3. Dress Code & Hygiene
-- ============================================================
update policies set
  purpose_es = $PURPOSE_ES$Usted es la cara de Ichiban, Boru, Shokudo o Central Hub desde el momento que pisa el piso. Cómo se ve y qué tan limpio está afecta directamente la confianza del cliente, la seguridad alimentaria y el ambiente del restaurante. Esta política establece el estándar para que no haya dudas.$PURPOSE_ES$,
  details_es = $DETAILS_ES$UNIFORME:
- Use el uniforme asignado a su puesto y ubicación. Los uniformes deben estar limpios, sin arrugas y en buen estado — sin manchas, rasgaduras, agujeros o decoloración.
- Camisas: fajadas a menos que el uniforme esté específicamente diseñado para usarse por fuera (batas de chef, ciertos pullovers). No se deben ver camisetas interiores más allá del cuello o la manga a menos que sean negras o blancas lisas.
- Pantalones: pantalones negros limpios (o según lo especifique su gerente). No leggings, pantalones de yoga, jeans, shorts o pants deportivos a menos que el uniforme de su puesto lo especifique.
- Zapatos: cerrados, antideslizantes, negros. No tenis con logos grandes, no sandalias, no Crocs (ni siquiera Crocs de cocina a menos que estén aprobados para su estación).
- Los mandiles deben cambiarse cuando estén visiblemente sucios — no se usan durante todo el turno si están manchados.
- Si su uniforme está dañado, notifique a su gerente para que pueda ser reemplazado. No se presente a un turno con uniforme dañado.

HIGIENE:
- Báñese y use desodorante antes de cada turno.
- El cabello debe estar limpio, recogido y sujetado. Personal de BOH (cocina) debe usar gorra, cachucha o red para el cabello. Personal de FOH (servicio) con cabello largo debe tenerlo recogido y fuera de la cara.
- El vello facial debe estar recortado y limpio. Barbas más largas que un recorte corto requieren red para barba en BOH.
- Las uñas deben estar cortas, limpias y sin esmalte para cualquier persona que maneje alimentos. Esmalte de gel, acrílicos y extensiones no están permitidos para quienes manejan alimentos.
- No use perfumes fuertes, colonias o lociones con aroma — afectan la experiencia del cliente y pueden transferirse a los alimentos.
- Cepíllese los dientes antes de su turno. Evite alimentos con olores fuertes (mucho ajo, cebolla cruda) antes de presentarse a trabajar.
- Lávese las manos según los estándares de seguridad alimentaria — al entrar a la cocina, después de descansos, después de manejar producto crudo, después de ir al baño, después de tocarse la cara o el teléfono.

JOYERÍA Y ACCESORIOS:
- Cocina/BOH: solo anillo de matrimonio sencillo. Sin relojes, pulseras, anillos con piedras, aretes colgantes ni collares fuera del cuello de la camisa.
- FOH: joyería mínima y profesional. Sin arracadas grandes, sin pulseras ruidosas, sin collares que cuelguen sobre los alimentos o el servicio de bebidas.
- Los tatuajes están permitidos a menos que contengan contenido ofensivo (groserías, imágenes explícitas, símbolos de odio). Los gerentes pueden requerir que se cubran caso por caso.
- Piercings visibles (cara, lengua): un arete pequeño es aceptable. Expansiones, múltiples piercings faciales y aros de septum deben ser removidos o cubiertos durante el turno a menos que estén pre-aprobados por el Gerente General.$DETAILS_ES$,
  consequences_es = $CONS_ES$- 1ra violación: conversación verbal y — si es posible — corrección en el momento (enviado a casa a cambiarse si el problema es grave, como zapatos incorrectos o uniforme sucio). Si es enviado a casa, el tiempo fuera del reloj no se paga.
- 2da violación: advertencia escrita.
- 3ra violación: advertencia escrita final.
- 4ta violación: terminación.
- Violaciones de higiene que afectan la seguridad alimentaria (manos sin lavar, cabello en la comida, heridas abiertas sin cubrir) se tratan como advertencia escrita final inmediata sin importar el historial previo, y pueden resultar en terminación si son intencionales.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Entiendo que debo presentarme a cada turno con un uniforme limpio y completo que cumpla los estándares de mi ubicación, con buena higiene personal, cabello sujetado, uñas recortadas y sin aromas fuertes. Entiendo que puedo ser enviado a casa sin pago si llego fuera de uniforme o sin cumplir los estándares de higiene, y que las violaciones de higiene que afectan la seguridad alimentaria pueden resultar en disciplina inmediata incluyendo la terminación.$ACK_ES$
where title = 'Dress Code & Hygiene' and version = 1;

-- ============================================================
-- 4. Confidentiality
-- ============================================================
update policies set
  purpose_es = $PURPOSE_ES$Trabajar dentro de un restaurante de WHG le da acceso a información que no le pertenece compartir — recetas, precios, finanzas, información de clientes, datos personales de compañeros y decisiones de negocio en proceso. Esta política deja claro qué se queda dentro de estas cuatro paredes y cuáles son las consecuencias de revelarlo.$PURPOSE_ES$,
  details_es = $DETAILS_ES$QUÉ ES CONFIDENCIAL (lista no exhaustiva):
- Recetas, especificaciones y procedimientos — cortes de sushi, recetas de salsas, fórmulas de caldo, técnicas de hibachi, hojas de preparación, niveles de inventario y cualquier SOP documentado.
- Información financiera — números de ventas, costos de mano de obra, costos de alimentos, facturas, nómina, rentabilidad, renta, precios de proveedores, cantidades de propinas (más allá de las propias).
- Estrategia de negocio — planes de nuevos conceptos (pre-apertura de Shokudo, construcción de Central Hub, etc.), acuerdos de bienes raíces, conversaciones con inversionistas, cambios de liderazgo y cualquier conversación que escuche entre los dueños, la gerencia o consultores externos.
- Información de clientes — nombres, datos de contacto, historial de reservaciones, solicitudes especiales, quejas, incidentes, información de tarjetas de crédito y cualquier cosa que un cliente comparta con el personal.
- Información de compañeros — datos de contacto personales, tasas de pago, historial disciplinario, problemas de salud, estatus migratorio, asuntos familiares y cualquier cosa compartida en confianza.
- Términos con proveedores — precios, descuentos, detalles de contratos y relaciones comerciales.
- Sistemas internos y acceso — contraseñas del POS, credenciales de R365, credenciales de 7shifts, códigos de gerente, códigos de alarma, combinaciones de caja fuerte, contraseñas de Wi-Fi de áreas internas.

LO QUE NO DEBE HACER:
- Compartir información confidencial con cualquier persona fuera de WHG — incluyendo cónyuge, amigos, competidores, ex empleados o en redes sociales.
- Fotografiar o capturar pantallas de recetas, hojas de preparación, pantallas del POS, reportes financieros, horarios con información del personal o cualquier documento interno.
- Llevarse a casa, copiar o enviar documentos internos a una cuenta personal sin aprobación del gerente.
- Discutir acciones disciplinarias en curso, terminaciones o asuntos de recursos humanos con compañeros — acuda a un gerente si tiene inquietudes.
- Usar información de WHG para beneficiar a un competidor, un futuro empleador o su propio negocio.

CUANDO DEJE WHG:
- Su obligación de mantener confidenciales las recetas, finanzas, planes de negocio e información de clientes/compañeros continúa después de que termine su empleo. Dejar la compañía no lo libera de esta política.
- Devuelva todos los uniformes, llaves, manuales, materiales de entrenamiento y cualquier propiedad de WHG en su último día.
- Elimine cualquier documento, foto o archivo de WHG de dispositivos personales y cuentas personales en la nube.

REPORTAR VIOLACIONES:
- Si tiene conocimiento de una violación de confidencialidad por parte de un compañero, gerente o ex empleado, repórtelo a su gerente o a los dueños. Los reportes de buena fe están protegidos — vea el estándar de Anti-Represalias.$DETAILS_ES$,
  consequences_es = $CONS_ES$- Violación menor (conversación casual sobre una receta con un amigo, compartir información no sensible): conversación verbal o advertencia escrita dependiendo del contexto.
- Violación moderada (fotografiar documentos internos, compartir números financieros, discutir el salario de un compañero): advertencia escrita final o terminación.
- Violación seria (compartir recetas o información financiera con un competidor, publicar documentos internos en línea, filtrar datos de clientes, usar información de WHG para beneficio personal o de un negocio externo): terminación inmediata y posible acción legal, incluyendo demandas por daños.
- Violaciones que involucren datos de tarjetas de crédito de clientes, estatus migratorio de compañeros u otra información legalmente protegida también pueden ser reportadas a las autoridades pertinentes.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Entiendo que durante y después de mi empleo con WHG, debo mantener estrictamente confidenciales las recetas, información financiera, planes de negocio, información de clientes, información personal de compañeros, términos con proveedores y acceso a sistemas internos. No fotografiaré, copiaré, compartiré ni publicaré ninguna información interna sin aprobación del gerente. Entiendo que las violaciones serias pueden resultar en terminación inmediata y acción legal, y que mi obligación de mantener la confidencialidad continúa después de que deje la compañía.$ACK_ES$
where title = 'Confidentiality' and version = 1;

-- ============================================================
-- 5. Anti-Harassment & Discrimination
-- ============================================================
update policies set
  purpose_es = $PURPOSE_ES$Toda persona que trabaja en un restaurante de WHG tiene derecho a un lugar de trabajo libre de acoso, discriminación e intimidación. Esta política define lo que no es aceptable, cómo reportarlo y qué puede esperar de nosotros cuando lo haga. Esto aplica a todos los empleados, gerentes, proveedores, contratistas y clientes.$PURPOSE_ES$,
  details_es = $DETAILS_ES$LO QUE ESTÁ PROHIBIDO:
- Acoso — conducta no deseada basada en raza, color, religión, sexo, orientación sexual, identidad de género, origen nacional, edad, discapacidad, embarazo, estado civil, estatus de veterano o cualquier otra característica protegida por la ley federal, de Louisiana o local.
- Acoso sexual — avances sexuales no deseados, solicitudes de favores sexuales, comentarios sexualmente sugestivos, bromas o contacto físico. Esto incluye tocar, rozar, mirar fijamente o hacer comentarios sobre el cuerpo de alguien. Incluye enviar fotos o mensajes inapropiados, incluso fuera del horario de trabajo.
- Discriminación — tratar a alguien diferente (en contratación, horarios, propinas, disciplina, promoción o trato diario) debido a una característica protegida.
- Represalias — castigar a alguien por reportar acoso, discriminación, un problema de seguridad, un problema de salario o cualquier otra queja de buena fe.
- Intimidación y hostigamiento — gritar, amenazar, insultar, humillar públicamente o aislar deliberadamente a un compañero. Las cocinas son de alta presión — la urgencia y la comunicación directa están bien; degradar a alguien no.
- Ambiente de trabajo hostil — conducta repetida o severa que dificulta que alguien haga su trabajo, incluso si ningún incidente individual es "serio" por sí solo.

LO QUE APLICA A TODOS:
- Esta política cubre su comportamiento durante el turno, fuera del turno pero en propiedad de WHG, en eventos de la compañía y en comunicaciones relacionadas con el trabajo (Telegram, texto, correo electrónico, redes sociales que mencionen a compañeros).
- El acoso de clientes hacia empleados cuenta. Si un cliente lo acosa, repórtelo al gerente en turno. La gerencia se encargará del cliente — incluyendo pedirle que se retire o prohibirle la entrada al restaurante.
- El comportamiento de proveedores, contratistas o repartidores también está cubierto.

QUÉ HACER SI LE SUCEDE A USTED O SI ES TESTIGO:
1. Si se siente seguro haciéndolo, dígale directamente a la persona que el comportamiento no es bienvenido y debe parar.
2. Repórtelo a un gerente inmediatamente, o si el gerente es el problema, reporte directamente a los dueños de WHG — contacte por Telegram.
3. Puede reportar de cualquier forma — en persona, por teléfono, por mensaje de texto, por correo electrónico o por escrito. No necesita tener pruebas; un reporte de buena fe es suficiente para iniciar una investigación.
4. Escriba lo que pasó mientras está fresco en su memoria — fecha, hora, lugar, quién estaba presente, qué se dijo o se hizo.
5. También puede contactar a la EEOC (federal) o la Comisión de Derechos Humanos de Louisiana si cree que su queja no se está manejando adecuadamente.

LO QUE WHG HARÁ:
- Tomar cada reporte en serio y comenzar la investigación dentro de un plazo razonable — típicamente dentro de 24 a 48 horas del reporte.
- Proteger la confidencialidad del empleado que reporta en la medida de lo posible. Cierta divulgación es necesaria para una investigación.
- Separar al denunciante y al acusado durante la investigación cuando sea apropiado (horarios, estación, comunicación).
- Documentar la investigación, los hallazgos y las acciones tomadas.
- Tomar acción correctiva — que puede ir desde capacitación hasta advertencia escrita final o terminación — basada en los hallazgos.
- Nunca tomar represalias contra un empleado por hacer un reporte de buena fe, incluso si la investigación no sustancia la queja.

REPORTES FALSOS:
- Los reportes de buena fe siempre están protegidos, incluso si la investigación no encuentra una violación de política.
- Los reportes hechos de mala fe (deliberadamente fabricados para dañar a otro empleado) son en sí mismos una violación de política y serán disciplinados.$DETAILS_ES$,
  consequences_es = $CONS_ES$- Violaciones menores (un solo comentario inapropiado, primer incidente de baja severidad): advertencia escrita más capacitación obligatoria.
- Violaciones moderadas (comentarios repetidos, crear un ambiente hostil, patrón de comportamiento): advertencia escrita final o terminación.
- Violaciones serias (cualquier contacto físico no deseado, amenazas, quid pro quo, discriminación dirigida en horarios/propinas/disciplina, o cualquier forma de acoso sexual que involucre contacto físico): terminación inmediata.
- Gerentes que presencian una violación y no actúan, o que toman represalias contra un denunciante, enfrentan la misma escala disciplinaria que el infractor original — el acoso por inacción sigue siendo una violación.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Entiendo que WHG prohíbe el acoso y la discriminación basados en cualquier característica protegida, así como las represalias, la intimidación y el comportamiento que crea un ambiente de trabajo hostil. Entiendo que esta política aplica durante el turno, fuera del turno en propiedad de WHG, en eventos de la compañía y en comunicaciones relacionadas con el trabajo. Sé cómo reportar una violación — a un gerente, a los dueños por Telegram, o a una agencia externa como la EEOC — y entiendo que los reportes de buena fe están protegidos contra represalias. Entiendo que las violaciones serias pueden resultar en terminación inmediata.$ACK_ES$
where title = 'Anti-Harassment & Discrimination' and version = 1;

-- ============================================================
-- 6. Safety & Emergency Procedures
-- ============================================================
update policies set
  purpose_es = $PURPOSE_ES$Los restaurantes están llenos de riesgos — superficies calientes, cuchillos afilados, pisos resbalosos, líquidos hirviendo, carga pesada, químicos y multitudes. La mayoría de las lesiones se pueden prevenir cuando el personal conoce las reglas y las sigue. Esta política cubre las prácticas de seguridad diarias y qué hacer cuando algo sale mal.$PURPOSE_ES$,
  details_es = $DETAILS_ES$REGLAS GENERALES DE SEGURIDAD:
- Zapatos: antideslizantes, cerrados, en buen estado. La suela desgastada es su responsabilidad reemplazar.
- Cuchillos: los cuchillos afilados son más seguros que los desafilados. Reporte cuchillos desafilados o dañados. Nunca intente atrapar un cuchillo que se cae — retroceda.
- Superficies calientes, freidoras y parrillas: nunca deje una freidora o parrilla sin supervisión. Use toallas secas para manejar sartenes calientes; las toallas mojadas transmiten el calor.
- Caminar con cuchillos, sartenes calientes o líquido hirviendo: avise claramente ("atrás," "caliente," "filo") antes de pasar junto a compañeros.
- Levantamiento: si un objeto es más pesado de lo cómodo, pida ayuda o use un carrito. Doble las rodillas, no la espalda. No levante más de 50 libras solo.
- Escaleras y bancos: use la herramienta correcta. Nunca se pare en sillas, cajas o equipo apilado.
- Señales de piso mojado: colóquelas antes de trapear, limpiar un derrame o terminar una tarea del área de lavado. Retírelas cuando el piso esté seco — no antes.
- Seguridad química: nunca mezcle químicos de limpieza. Use solo productos aprobados en sus contenedores originales con etiqueta. Las SDS (Hojas de Datos de Seguridad) están disponibles en cada ubicación — pregunte a un gerente si necesita verlas.

REPORTAR LESIONES E INCIDENTES:
- Cualquier lesión — sin importar qué tan pequeña — debe ser reportada al gerente en turno inmediatamente. Esto lo protege a usted (compensación laboral) y a la compañía.
- El gerente llenará un reporte de incidente. Si se necesita atención médica, la gerencia lo dirigirá a la clínica o sala de emergencias apropiada.
- No regrese a trabajar con una lesión que le impida desempeñarse de manera segura. No oculte una lesión por lealtad al equipo.
- Los casi-accidentes (cosas que casi causaron una lesión) también deben reportarse para que podamos corregir el peligro antes de que alguien se lastime.

INCENDIO Y EVACUACIÓN:
- Cada ubicación tiene extintores marcados, salidas de emergencia y un sistema Ansul sobre la línea de campana. Sepa dónde están desde su primer día. No se espera que el personal opere el sistema Ansul, pero debe saber dónde está.
- Si ve fuego: alerte al equipo, use un extintor solo si es pequeño y ha sido entrenado, y evacúe por la salida más cercana si se extiende. La seguridad de los clientes va antes que la propiedad.
- Reúnase en el punto de encuentro designado de su ubicación. No vuelva a entrar al edificio hasta que el departamento de bomberos o el gerente lo autorice.
- Llame al 911 primero en cualquier incendio que no sea contenido inmediatamente.

EMERGENCIAS MÉDICAS:
- Si un compañero o cliente tiene una emergencia médica (asfixia, desmayo, corte severo, quemadura, convulsión, reacción alérgica), llame al 911 inmediatamente y alerte al gerente.
- No mueva a una persona lesionada a menos que esté en peligro adicional.
- Sepa dónde está el botiquín de primeros auxilios en su ubicación. La mayoría de los cortes y quemaduras menores se manejan internamente; cualquier cosa más allá va al 911 o atención de urgencias.

ROBO ARMADO O AMENAZA:
- Coopere. El dinero es reemplazable. Usted no. No discuta, persiga ni resista.
- Observe lo que pueda de manera segura (descripción, dirección de salida, vehículo) solo después de que la amenaza haya pasado.
- Llame al 911 en cuanto sea seguro. Alerte a la gerencia.
- No publique sobre el incidente en redes sociales antes de que la gerencia y las autoridades hayan despejado la escena.

CLIMA SEVERO (huracán, tornado, inundación):
- El clima de Louisiana es real. Las decisiones de cierre, salida temprana y reapertura las toman los dueños de WHG a menos que se delegue lo contrario, y se comunicarán a través de Telegram y el sistema de horarios 7shifts / R365 Workforce.
- No maneje en condiciones de inundación para llegar a un turno.
- El regreso al trabajo depende del suministro eléctrico, agua y disponibilidad de personal. La gerencia coordinará.

COMPENSACIÓN LABORAL:
- Cualquier lesión que ocurra en el trabajo está cubierta por el seguro de compensación laboral. Repórtela inmediatamente para que la reclamación pueda ser presentada correctamente.
- No reportar una lesión dentro de 24 horas puede poner en riesgo su reclamación.$DETAILS_ES$,
  consequences_es = $CONS_ES$- 1ra violación (ignorar una regla de seguridad, no avisar "atrás," no poner señal de piso mojado): conversación verbal.
- 2da violación: advertencia escrita.
- 3ra violación: advertencia escrita final.
- 4ta violación: terminación.
- Violaciones intencionales o serias — juego brusco que cause riesgo de lesión, mezclar químicos a propósito, remover un protector de seguridad, negarse a reportar una lesión, regresar a trabajar de manera insegura — resultan en advertencia escrita final inmediata o terminación.
- No reportar una lesión dentro de 24 horas se trata como una violación seria tanto porque lo pone en riesgo legal como porque expone a la compañía.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Entiendo que trabajar en un restaurante involucra riesgos reales y que soy responsable de seguir las reglas de seguridad, usar equipo de protección y comunicarme claramente con mi equipo. Reportaré cualquier lesión, sin importar qué tan pequeña, al gerente en turno inmediatamente — y entiendo que no hacerlo dentro de 24 horas puede poner en riesgo mi reclamación de compensación laboral. Sé dónde están las salidas de emergencia, extintores y botiquines de primeros auxilios en mi ubicación, y entiendo que en un robo armado mi primera prioridad es la seguridad personal, no el dinero. Entiendo que los cierres por clima severo se comunicarán a través de Telegram y la plataforma de horarios utilizada en mi ubicación.$ACK_ES$
where title = 'Safety & Emergency Procedures' and version = 1;

-- ============================================================
-- 7. Food Handling & Safety
-- ============================================================
update policies set
  purpose_es = $PURPOSE_ES$Cada plato que sale de nuestras cocinas representa a WHG. Un solo error de seguridad alimentaria puede enfermar a un cliente, provocar una citación del departamento de salud o dañar la reputación que hemos construido por más de dos décadas. Esta política establece los estándares no negociables de manejo de alimentos que todo empleado debe seguir, sin importar el puesto.$PURPOSE_ES$,
  details_es = $DETAILS_ES$HIGIENE PERSONAL EN EL TRABAJO:
- Lávese las manos por un mínimo de 20 segundos con jabón y agua caliente: al iniciar un turno, después de usar el baño, después de comer o beber, después de manejar producto crudo, después de tocarse la cara/cabello/teléfono, después de sacar la basura, después de manejar dinero, y cualquier vez que las manos estén contaminadas.
- Se requieren guantes al manejar alimentos listos para consumir. Cambie los guantes entre tareas — nunca los reutilice entre crudo y cocido, o entre productos con diferentes alérgenos.
- Si está enfermo, no venga a trabajar. Específicamente, quédese en casa con: vómito, diarrea, fiebre, ictericia, dolor de garganta con fiebre o cualquier herida abierta en las manos que no pueda cubrirse completamente. Llame al gerente según la política de Asistencia.
- Regreso al trabajo después de vómito o diarrea: debe estar libre de síntomas por al menos 24 horas antes de su siguiente turno.
- Cortadas y heridas en las manos deben limpiarse, cubrirse con una venda a prueba de agua y cubrirse con un guante antes de manejar alimentos.
- No comer, beber, masticar chicle ni fumar en áreas de preparación de alimentos o lavado de platos. Las bebidas deben estar en un contenedor cerrado con tapa y popote, y fuera de las superficies de preparación.

CONTROL DE TEMPERATURA:
- Los alimentos fríos se mantienen a 41°F o menos. Los alimentos calientes se mantienen a 135°F o más. La zona entre ambas es la zona de peligro y los alimentos no pueden permanecer ahí.
- Revise y registre las temperaturas de refrigeradores, congeladores y mantenimiento en caliente en los intervalos establecidos por su ubicación (típicamente apertura, mitad de turno, cierre) usando el sistema actual de su ubicación (registros en papel, R365 o según lo indique la gerencia).
- Temperaturas de cocción — siga la tabla de temperaturas de su estación. Temperaturas internas mínimas: aves 165°F, carne molida 155°F, pescado 145°F, cortes enteros de res/cerdo 145°F, huevos preparados al momento 145°F.
- El manejo de pescado grado sushi sigue los procedimientos específicos de Ichiban, Boru y Shokudo. Nunca sustituya producto que no sea grado sushi. FIFO es estricto — primero en entrar, primero en salir, sin excepciones.
- El enfriamiento de alimentos calientes debe hacerse rápidamente: de 135°F a 70°F dentro de 2 horas, luego de 70°F a 41°F dentro de 4 horas adicionales.
- El recalentamiento de alimentos sobrantes debe alcanzar 165°F interno, rápido.

CONTAMINACIÓN CRUZADA:
- Las proteínas crudas se almacenan debajo de los alimentos listos para consumir y los productos frescos, siempre.
- Tablas de cortar y utensilios separados para proteínas crudas vs. productos frescos vs. alimentos listos para consumir.
- Los trapos usados para producto crudo no se usan para nada más.
- La conciencia de alérgenos no es opcional. Conozca su menú. Si un cliente declara una alergia, informe a un gerente inmediatamente — no adivine. Los alérgenos comunes incluyen cacahuate, mariscos, ajonjolí y gluten, entre otros. Un error puede mandar a alguien al hospital.

FIFO, ETIQUETADO Y FECHADO:
- Cada artículo preparado debe etiquetarse con fecha e iniciales cuando se almacena. Ningún contenedor sin etiquetar en el refrigerador.
- Rote el inventario — producto nuevo detrás del producto viejo.
- Deseche producto que haya pasado su fecha de uso. No sirva producto vencido o cuestionable, sin importar el desperdicio percibido. "En caso de duda, tírelo."

LIMPIEZA Y SANITIZACIÓN:
- Siga el programa de limpieza publicado en su ubicación. Firme cuando complete cada tarea.
- Las cubetas de sanitizante deben prepararse a la concentración correcta (pruebe con tiras) y cambiarse cuando estén sucias o cada 2 a 4 horas, lo que ocurra primero.
- Las superficies de preparación se lavan, enjuagan y sanitizan entre tareas — no solo se pasan con un trapo.
- Pisos, paredes, estantes y equipo se limpian según el programa, no "cuando se vean sucios."
- El procedimiento del fregadero de tres compartimentos — lavar, enjuagar, sanitizar — se sigue cada vez. Sin atajos.

DEPARTAMENTO DE SALUD E INSPECCIONES:
- Coopere con cualquier inspector de salud de manera completa y profesional. No discuta, mienta ni intente ocultar nada.
- Alerte al gerente en turno en el momento que llegue un inspector.
- La certificación ServSafe la mantiene el Gerente de Cocina o un dueño en cada ubicación. El personal general mantiene la credencial de manejador de alimentos requerida por Louisiana / East Baton Rouge Parish. Mantenga la suya vigente. WHG cubrirá el costo cuando se requiera una certificación para su puesto.$DETAILS_ES$,
  consequences_es = $CONS_ES$- 1ra violación (lavado de manos omitido, cambio incorrecto de guantes, contenedor sin etiquetar, registro de temperatura menor omitido): conversación verbal y corrección en el momento.
- 2da violación: advertencia escrita.
- 3ra violación: advertencia escrita final.
- 4ta violación: terminación.
- Violaciones serias resultan en advertencia escrita final inmediata o terminación, dependiendo de la gravedad:
  - Trabajar un turno con síntomas (vómito, diarrea, fiebre) y no reportarlo
  - Servir alimentos pasados de fecha de uso a sabiendas
  - Ignorar una alergia declarada por un cliente
  - Falsificar un registro de temperatura o firma de limpieza
  - Contaminación cruzada deliberada
  - No alertar a la gerencia cuando llega un inspector de salud
- Violaciones que causen directamente enfermedad de un cliente, una inspección fallida o una citación del departamento de salud son causa de terminación inmediata.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Entiendo que la seguridad alimentaria no es negociable en ninguna cocina de WHG y que seguir las reglas de lavado de manos, uso de guantes, control de temperatura, prevención de contaminación cruzada, FIFO, etiquetado y sanitización es parte fundamental de mi trabajo. No me presentaré a trabajar con síntomas de vómito, diarrea o fiebre, y solo regresaré después de estar libre de síntomas por al menos 24 horas. Nunca falsificaré un registro de temperatura o limpieza, nunca ignoraré una alergia declarada por un cliente y alertaré a la gerencia inmediatamente cuando llegue un inspector de salud. Entiendo que las violaciones serias de seguridad alimentaria pueden resultar en terminación inmediata.$ACK_ES$
where title = 'Food Handling & Safety' and version = 1;

-- ============================================================
-- 8. Drug & Alcohol
-- ============================================================
update policies set
  purpose_es = $PURPOSE_ES$Un restaurante es un ambiente de ritmo rápido, alta temperatura y herramientas filosas donde el juicio afectado pone en riesgo a todo el equipo, a nuestros clientes y a usted mismo. Esta política establece una línea clara: usted se presenta a trabajar sobrio y apto para sus funciones, cada turno, cada vez.$PURPOSE_ES$,
  details_es = $DETAILS_ES$CONDUCTA PROHIBIDA:
- Nadie trabaja bajo los efectos. Presentarse a un turno — o regresar a un turno después de un descanso — bajo la influencia del alcohol, marihuana, drogas ilegales o medicamentos recetados mal utilizados está prohibido.
- No se consume alcohol durante el turno. Esto incluye "cervezas de turno," sorbos de cócteles o probar bebidas que ha preparado. En WHG, trabajar y beber no se mezclan.
- No se permiten drogas en las instalaciones. La posesión, distribución, venta o uso de drogas ilegales en propiedad o estacionamientos de WHG está prohibido — durante o fuera del turno.
- Marihuana: sin importar el estatus legal actual en Louisiana o su tarjeta médica personal, WHG es un lugar de trabajo libre de drogas. No puede presentarse a trabajar bajo la influencia de marihuana. El uso fuera del horario que lo deje afectado en el trabajo sigue siendo una violación.
- Medicamentos recetados: si está tomando un medicamento recetado que pudiera afectar su capacidad de trabajar de manera segura, notifique a su gerente antes de que comience su turno. No necesita revelar el medicamento — solo que podría estar afectado. La gerencia trabajará con usted para hacer ajustes.
- Medicamentos de venta libre que causen somnolencia no deben tomarse antes de un turno sin notificar a un gerente.

ALCOHOL OFRECIDO POR CLIENTES:
- A veces los clientes ofrecen bebidas a bartenders, meseros o personal de cocina. Decline cortésmente. Si un cliente insiste, involucre a un gerente.
- Beber después del horario en las instalaciones, donde esté permitido en su ubicación, requiere aprobación del gerente y límites claros — no se extiende al siguiente turno.

CONDUCTA FUERA DEL HORARIO:
- Lo que haga en su tiempo libre es asunto suyo, con tres límites:
  1. No puede presentarse a su siguiente turno afectado.
  2. No puede traer drogas ilegales o alcohol a propiedad de WHG.
  3. No puede tener conductas fuera del trabajo que dañen la reputación de WHG (ej., intoxicación pública con uniforme, publicar videos de uso de drogas vinculados al restaurante).

PRUEBAS POST-ACCIDENTE Y POR SOSPECHA RAZONABLE:
- Si está involucrado en un accidente o lesión laboral, se le puede requerir una prueba de drogas y alcohol antes de regresar al trabajo. Las pruebas se realizan en una instalación designada por WHG. Negarse a la prueba se trata igual que un resultado positivo.
- Si un gerente tiene sospecha razonable de que está afectado durante un turno (habla arrastrada, movimiento inestable, olor a alcohol o marihuana, comportamiento errático), será removido del piso y se le puede requerir una prueba. La sospecha razonable debe ser observada y documentada por un gerente — no basada en rumores.
- WHG cubrirá el costo de las pruebas requeridas.

BUSCAR AYUDA:
- Si está luchando con el uso de sustancias, puede acudir a los dueños o a un gerente en confianza antes de que se convierta en un asunto disciplinario. Trabajaremos con usted en un plan razonable — tiempo libre, referencia a consejería o horario ajustado — para apoyar la recuperación.
- La divulgación voluntaria está protegida cuando ocurre antes de una violación. Una vez que ha ocurrido una violación, la divulgación voluntaria no borra la violación pero se considerará en la respuesta.$DETAILS_ES$,
  consequences_es = $CONS_ES$- Trabajar bajo los efectos, consumir alcohol durante el turno o poseer drogas en las instalaciones: terminación inmediata.
- Negarse a una prueba post-accidente o por sospecha razonable: se trata como resultado positivo — terminación inmediata.
- Prueba post-accidente o por sospecha razonable con resultado positivo: terminación inmediata.
- Violaciones menores (tomar un sorbo de la bebida de un cliente, no notificar al gerente sobre un medicamento recetado que podría afectar el trabajo): advertencia escrita final en la primera ofensa, terminación en la segunda.
- Conducta fuera del horario que dañe la reputación de WHG (intoxicación pública con uniforme, publicaciones en redes sociales vinculando uso de drogas al restaurante): advertencia escrita final o terminación según la gravedad.
- Violaciones que involucren vender, distribuir o compartir drogas con compañeros se tratan como terminación inmediata más referencia a las autoridades cuando sea apropiado.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Entiendo que WHG es un lugar de trabajo libre de drogas y que presentarme a trabajar bajo los efectos del alcohol, marihuana, drogas ilegales o medicamentos recetados mal utilizados está prohibido. No beberé durante el turno, no aceptaré bebidas ofrecidas por clientes ni traeré drogas ilegales o alcohol a propiedad de WHG. Entiendo que sin importar las leyes de marihuana en Louisiana o cualquier tarjeta médica personal, no puedo presentarme a trabajar bajo la influencia. Acepto las pruebas de drogas y alcohol post-accidente y por sospecha razonable como condición de empleo, y entiendo que negarme a la prueba se trata igual que un resultado positivo. Entiendo que las violaciones pueden resultar en terminación inmediata.$ACK_ES$
where title = 'Drug & Alcohol' and version = 1;

-- ============================================================
-- 9. Social Media
-- ============================================================
update policies set
  purpose_es = $PURPOSE_ES$WHG no es estricto con el uso personal de redes sociales. Confiamos en que nuestro equipo use buen juicio. Esta política existe para que las líneas que realmente importan — privacidad de los clientes, información confidencial y cualquier cosa que dañe la reputación del restaurante — queden claras.$PURPOSE_ES$,
  details_es = $DETAILS_ES$LA VERSIÓN CORTA:
Publique lo que quiera en sus propias cuentas, en su propio tiempo. Solo no haga que WHG se vea o se escuche mal, y no cruce las líneas a continuación.

REGLAS FIRMES — NO HAGA ESTO:
- No tome fotos ni videos de clientes sin su consentimiento. Esto es un asunto de privacidad y de responsabilidad legal, sin importar qué tan inofensiva parezca la publicación.
- No publique información confidencial. Recetas, técnicas de preparación, finanzas, precios de proveedores, planes de negocio y cualquier otra cosa cubierta por la política de Confidencialidad se mantiene fuera de las redes sociales.
- No publique contenido que acose, discrimine o amenace a compañeros, gerentes, clientes o competidores. Las publicaciones sarcásticas "indirectas" dirigidas a personas específicas también cuentan.
- No hable en nombre de WHG cuando no tiene esa autoridad. Si algo se hace público — una mala reseña, un incidente, un rumor — no publique una respuesta como si representara a la compañía. Refiéralo a los dueños.
- No haga transmisiones en vivo ni grabe durante el servicio sin aprobación del gerente. Publicaciones breves durante el descanso que no muestren a clientes o la cocina en mal estado están bien.

BUEN JUICIO — algunas cosas para tener en cuenta:
- Si publica una foto de un platillo, su uniforme o usted mismo en el trabajo, revise el fondo. Clientes, pantallas del POS, hojas de preparación y estaciones desordenadas pueden colarse en una foto sin que lo note.
- Si está molesto por algo en el trabajo — un turno, un compañero, un gerente, una propina — llévelo a un gerente o a los dueños, no al internet. Desahogarse públicamente sobre asuntos internos es la forma más rápida de convertir un problema pequeño en uno grande.
- Las publicaciones que impliquen declaraciones oficiales de WHG — sobre incidentes, asuntos de recursos humanos o decisiones de negocio — necesitan autorización de los dueños. Las publicaciones donde "habla por usted mismo" están bien.

SE RECOMIENDA:
- Compartir, dar like y repostear contenido de las cuentas oficiales de Ichiban, Boru, Shokudo y Central Hub.
- Publicaciones genuinas mostrando orgullo por su trabajo, su equipo o un platillo del que esté orgulloso — el tipo de contenido que hace que la marca se vea bien.
- Etiquetar las cuentas oficiales cuando publique algo positivo.

DESPUÉS DE DEJAR WHG:
- Las obligaciones de confidencialidad (recetas, finanzas, información de clientes y compañeros) continúan después del empleo. Vea la política de Confidencialidad.
- Es libre de listar su empleo en WHG en LinkedIn o en su currículum.

ACTIVIDAD PROTEGIDA:
Esta política no restringe su derecho legal de discutir salarios, horarios y condiciones de trabajo con compañeros o el público, ni de reportar problemas de seguridad, acoso, discriminación, robo de salarios o actividad ilegal. Los reportes de buena fe siempre están protegidos.$DETAILS_ES$,
  consequences_es = $CONS_ES$La mayoría de los problemas de redes sociales son una conversación, no una acción disciplinaria. Hablaremos con usted primero antes de escalar.

- Problemas menores (el fondo de una publicación muestra algo accidentalmente, error con etiquetas): conversación con su gerente.
- Problemas moderados (desahogo público sobre un compañero o turno, problemas menores repetidos, transmisión en vivo durante el servicio): advertencia escrita.
- Problemas serios resultan en advertencia escrita final o terminación:
  - Publicar fotos o información personal de clientes
  - Filtrar información confidencial (recetas, finanzas, planes de negocio)
  - Contenido de acoso, discriminatorio o amenazante dirigido a compañeros, clientes o la compañía
  - Contenido que cause daño medible a WHG (atención mediática, investigación de salud, boicot de clientes)
  - Violaciones intencionales y repetidas después de coaching previo$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Entiendo que WHG confía en mí para usar buen juicio en redes sociales, y que mis cuentas personales son mías. No publicaré fotos de clientes sin consentimiento, información confidencial ni contenido que acose a compañeros o dañe la reputación de WHG. Llevaré los problemas del trabajo a un gerente o a los dueños en lugar de publicarlos. Entiendo mis derechos de discutir salarios, horarios y condiciones de trabajo, y de reportar actividad ilegal, están protegidos. Entiendo que las violaciones serias pueden resultar en terminación, y que las obligaciones de confidencialidad continúan después de que deje WHG.$ACK_ES$
where title = 'Social Media' and version = 1;

-- ============================================================
-- MANAGER POLICIES (10-16)
-- ============================================================

-- 10. Leadership Standards & Code of Conduct
update policies set
  purpose_es = $PURPOSE_ES$Establecer el estándar de comportamiento esperado de cada gerente en Wong Hospitality Group. Los gerentes establecen el tono para el equipo a través de su propia conducta, y los estándares de este manual no pueden ser aplicados por alguien que no vive según ellos.$PURPOSE_ES$,
  details_es = $DETAILS_ES$- Cumpliré con cada política del Manual del Equipo WHG y las hojas individuales de políticas para empleados. Los estándares que aplican a mi equipo me aplican a mí sin excepción.
- Modelaré los cinco valores fundamentales de WHG — Responsabilidad, Urgencia, Profesionalismo, Equipo Primero y Crecimiento — en cada turno, cada decisión y cada interacción.
- Me comunicaré con los miembros del equipo, clientes y compañeros gerentes de manera respetuosa, profesional y consistente, sin importar el nivel de estrés, presión de tiempo o circunstancias personales.
- No usaré mi posición para recibir beneficios personales, trato preferencial o favores que no se extienden al resto del equipo.
- Aceptaré la guía y corrección de los dueños sin actitud defensiva, y guiaré y corregiré a mi equipo con la misma justicia y respeto.
- Lideraré con el ejemplo en todo momento. El respeto se gana estableciendo el estándar, no se exige por el título. Entiendo que mi equipo observa cómo reacciono más de lo que escucha lo que digo, y que mi conducta establece el techo del profesionalismo del equipo que lidero.
- Daré respeto constantemente y primero, sin importar si es correspondido en el momento. La mala actitud de un empleado no excusa la mía. Nunca me rebajaré ni reflejaré una actitud no deseada de un miembro del equipo — como gerente, me sujeto a un estándar más alto y soy el responsable de mostrar cómo lucen la buena actitud, la compostura y el respeto en el piso.
- Corregiré en privado y entrenaré en público. Las discusiones sobre la actitud, desempeño o error de un empleado específico se llevarán a cabo de manera privada y respetuosa. Los momentos de enseñanza, estándares y refuerzo positivo del comportamiento correcto se comparten abiertamente con el equipo para que todos aprendan de ellos.
- Trataré todos los comentarios de empleados — incluyendo comentarios anónimos, quejas y críticas dirigidas a mí personalmente — como una oportunidad de aprendizaje. No reaccionaré con enojo, actitud defensiva, sarcasmo, desahogo público o cualquier forma de represalia. Mi respuesta a los comentarios es en sí misma un momento de liderazgo, y lo manejaré como tal.
- Representaré a Wong Hospitality Group con integridad en todo momento, incluyendo fuera del horario de trabajo y en todos los entornos públicos y privados donde pueda ser razonablemente identificado como gerente de WHG.$DETAILS_ES$,
  consequences_es = $CONS_ES$El incumplimiento de estos estándares resultará en coaching documentado, reentrenamiento, descenso de puesto o terminación dependiendo de la gravedad y frecuencia del problema.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Como gerente de Wong Hospitality Group, soy responsable de modelar, aplicar y mantener este estándar. Acepto un deber de cuidado superior al de los empleados que superviso. Entiendo y acepto seguir los Estándares de Liderazgo y Código de Conducta de WHG.$ACK_ES$
where title = 'Leadership Standards & Code of Conduct' and version = 1;

-- 11. Anti-Retaliation
update policies set
  purpose_es = $PURPOSE_ES$Proteger la integridad de los procesos de retroalimentación, quejas e investigaciones de WHG, y asegurar que cada empleado se sienta seguro al plantear inquietudes sin temor a consecuencias.$PURPOSE_ES$,
  details_es = $DETAILS_ES$- No tomaré represalias — directa o indirectamente — contra ningún empleado que presente una queja, envíe retroalimentación anónima, reporte acoso o problemas de seguridad, o participe en una investigación.
- Las represalias incluyen, pero no se limitan a: reducir las horas de un empleado, cambiar su horario desfavorablemente, asignar tareas o secciones indeseables, excluirlo de reuniones, entrenamiento o actividades del equipo, disciplinarlo sin causa documentada, retener reconocimiento ganado u oportunidades de promoción, o terminar su empleo.
- Si un empleado que superviso presenta una queja o envía retroalimentación, continuaré tratándolo de manera profesional y justa. Cualquier inquietud posterior de desempeño o disciplina involucrando a ese empleado será documentada por escrito y revisada con los dueños antes de tomar cualquier acción.
- Entiendo que las represalias están prohibidas por ley y por política de la compañía sin importar si la queja original es posteriormente sustanciada, desestimada o retirada.
- Si soy sujeto de una queja, no intentaré identificar al denunciante, no discutiré la queja con el empleado u otros miembros del equipo, y cooperaré completamente con cualquier investigación.
- Trataré la retroalimentación anónima y las quejas sobre mí como información de la cual aprender, no como un ataque personal. Ofenderme, enojarme, ponerme a la defensiva o ser despectivo — incluso en privado — erosiona la confianza que hace funcionar el canal de retroalimentación. Un gerente profesional absorbe la retroalimentación, reflexiona honestamente sobre ella y mejora.
- No haré comentarios públicos, sarcásticos o pasivo-agresivos sobre quejas, retroalimentación o las personas que pudieron haberlas planteado — durante el turno, fuera del turno, en persona o en cualquier plataforma de mensajería o redes sociales.
- Si observo a otro gerente participando en represalias, reaccionando de manera no profesional a la retroalimentación o intentando identificar a un denunciante anónimo, lo reportaré a los dueños inmediatamente.$DETAILS_ES$,
  consequences_es = $CONS_ES$Las represalias son una violación seria de la ley y la política de la compañía. Las violaciones confirmadas pueden resultar en terminación inmediata y pueden exponer a la compañía y al gerente individual a responsabilidad civil y legal.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Como gerente de Wong Hospitality Group, soy responsable de modelar, aplicar y mantener este estándar. Acepto un deber de cuidado superior al de los empleados que superviso. Entiendo y acepto seguir la Política Anti-Represalias de WHG.$ACK_ES$
where title = 'Anti-Retaliation Policy' and version = 1;

-- 12. Employee Confidentiality & Privacy
update policies set
  purpose_es = $PURPOSE_ES$Proteger la información personal, financiera y médica de cada empleado de WHG, y preservar la confianza que permite a los miembros del equipo trabajar sin temor de que su información privada sea compartida.$PURPOSE_ES$,
  details_es = $DETAILS_ES$- Mantendré confidencial toda la información personal de los empleados, incluyendo pero sin limitarse a: tasas de pago, salarios, propinas, historial de compensación, dirección, número de teléfono, contactos de emergencia, número de Seguro Social, estatus migratorio, información bancaria, condiciones médicas, ajustes razonables, historial disciplinario y evaluaciones de desempeño.
- No discutiré la información personal de ningún empleado con otros empleados, clientes, proveedores ni ninguna persona fuera de la gerencia y los dueños de WHG.
- No discutiré el salario, desempeño o historial disciplinario de un empleado con otro empleado.
- Solo accederé a los registros de empleados cuando tenga una razón legítima de negocio para hacerlo, y no compartiré mis credenciales de acceso con ninguna otra persona.
- Almacenaré los documentos físicos que contengan información de empleados en ubicaciones seguras, y cerraré sesión en los sistemas digitales cuando me aleje.
- Si sospecho que ha ocurrido una divulgación no autorizada o violación de datos, notificaré a los dueños dentro de 24 horas.
- Esta obligación aplica durante mi empleo con WHG y continúa indefinidamente después de que termine mi empleo.$DETAILS_ES$,
  consequences_es = $CONS_ES$Las violaciones pueden resultar en terminación inmediata y pueden exponer a la compañía y al gerente individual a responsabilidad civil y legal.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Como gerente de Wong Hospitality Group, soy responsable de modelar, aplicar y mantener este estándar. Acepto un deber de cuidado superior al de los empleados que superviso. Entiendo y acepto seguir la Política de Confidencialidad y Privacidad del Empleado de WHG.$ACK_ES$
where title = 'Employee Confidentiality & Privacy' and version = 1;

-- 13. Complaint Handling & Escalation
update policies set
  purpose_es = $PURPOSE_ES$Asegurar que cada queja de empleado sea recibida, documentada y atendida de manera consistente, justa y legalmente conforme.$PURPOSE_ES$,
  details_es = $DETAILS_ES$- Cuando un empleado me traiga una queja — verbalmente, por escrito o a través del canal de retroalimentación anónima de WHG — la tomaré en serio sin importar qué tan menor pueda parecer inicialmente.
- Nunca desestimaré una queja, presionaré al denunciante para que la retire ni intentaré resolverla diciéndole al empleado que no es un problema real.
- No prometeré un resultado específico al denunciante antes de que la queja haya sido revisada con los dueños.
- Para quejas que involucren acoso, discriminación, riesgos de seguridad, problemas de salario o actividad presuntamente ilegal, las escalaré a los dueños dentro de 24 horas y no intentaré investigar de manera independiente.
- Para quejas operativas de rutina (horarios, comunicación, conflictos interpersonales), documentaré la queja, intentaré resolverla directa y justamente, y notificaré a los dueños si recurre o escala.
- Documentaré cada queja que reciba con la fecha, la naturaleza general de la queja (sin violar la confidencialidad), la acción tomada y el resultado.
- No discutiré los detalles de una queja con nadie fuera de los dueños y las partes directamente involucradas en la investigación.
- Cooperaré completamente con cualquier investigación, incluyendo investigaciones en las que pueda ser mencionado.$DETAILS_ES$,
  consequences_es = $CONS_ES$No recibir, documentar o escalar adecuadamente una queja puede resultar en disciplina documentada, descenso de puesto o terminación, y puede exponer a la compañía a responsabilidad legal.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Como gerente de Wong Hospitality Group, soy responsable de modelar, aplicar y mantener este estándar. Acepto un deber de cuidado superior al de los empleados que superviso. Entiendo y acepto seguir la Política de Manejo y Escalamiento de Quejas de WHG.$ACK_ES$
where title = 'Complaint Handling & Escalation' and version = 1;

-- 14. Fair & Consistent Enforcement
update policies set
  purpose_es = $PURPOSE_ES$Asegurar que las políticas de WHG se apliquen a cada empleado de la misma manera, sin importar la antigüedad, amistad, relación personal o cualquier característica protegida.$PURPOSE_ES$,
  details_es = $DETAILS_ES$- Aplicaré cada política de WHG de manera consistente a todos los empleados que superviso. Una regla que aplica a un miembro del equipo aplica a todos.
- No aplicaré políticas selectivamente basándome en favoritismo, relaciones personales, antigüedad o posición informal en el equipo.
- No aplicaré ni ignoraré políticas de manera diferente basándome en la raza, color, religión, sexo, embarazo, orientación sexual, identidad de género, origen nacional, edad, discapacidad, información genética, estatus de veterano o cualquier otra característica protegida por ley.
- Cuando emita disciplina, seguiré los pasos documentados de disciplina progresiva (advertencia verbal, advertencia escrita, advertencia final, terminación) a menos que la gravedad de la violación justifique una escalación inmediata.
- Cada acción disciplinaria que emita será documentada por escrito con la fecha, la política violada, los hechos del incidente, la disciplina emitida y el reconocimiento del empleado.
- Revisaré la disciplina documentada con los dueños antes de acciones de terminación, excepto en casos donde se requiera acción inmediata para proteger la seguridad o el negocio.
- Cuando dos o más empleados cometan la misma violación, aplicaré el mismo nivel de disciplina a menos que haya una razón documentada y objetiva (historial previo, gravedad, intención) que justifique una respuesta diferente.$DETAILS_ES$,
  consequences_es = $CONS_ES$La aplicación inconsistente, discriminatoria o no documentada de la disciplina puede resultar en coaching, descenso de puesto o terminación, y puede exponer a la compañía a responsabilidad legal.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Como gerente de Wong Hospitality Group, soy responsable de modelar, aplicar y mantener este estándar. Acepto un deber de cuidado superior al de los empleados que superviso. Entiendo y acepto seguir la Política de Aplicación Justa y Consistente de WHG.$ACK_ES$
where title = 'Fair & Consistent Enforcement' and version = 1;

-- 15. Financial & Operational Integrity
update policies set
  purpose_es = $PURPOSE_ES$Proteger los activos financieros de Wong Hospitality Group y asegurar que cada transacción de efectivo, cortesía, descuento, nómina e inventario se maneje con total responsabilidad.$PURPOSE_ES$,
  details_es = $DETAILS_ES$- Seguiré todos los procedimientos documentados para manejo de efectivo, depósitos diarios, conteos de caja, conteos de caja fuerte y entregas de efectivo.
- No retiraré efectivo de ninguna caja registradora, caja fuerte o entrega para uso personal bajo ninguna circunstancia.
- No haré cortesías, descuentos ni anulaciones de transacciones para mí mismo, mi familia o mis amigos personales sin aprobación previa documentada de los dueños.
- No editaré mis propios registros de tiempo, ajustaré mis propias horas ni modificaré mis propios registros de pago en ningún sistema. Todas las correcciones a mis propios registros deben solicitarse por escrito y ser procesadas por otra persona autorizada.
- Cuando edite los registros de tiempo de otro empleado, documentaré la razón de cada corrección y notificaré al empleado.
- Seguiré los procedimientos de FIFO e inventario documentados, y no retiraré inventario, alimentos o suministros del restaurante para uso personal sin aprobación documentada.
- Reportaré con exactitud los conteos de clientes, ventas, anulaciones, cortesías y descuentos en el POS y en R365 o el software de contabilidad actual en uso en ese momento.
- Si observo o sospecho de conducta financiera indebida por parte de otro gerente o empleado, lo reportaré a los dueños inmediatamente y por escrito.
- No aceptaré regalos, efectivo o favores de proveedores que puedan crear o aparentar crear un conflicto de interés. Cualquier regalo de proveedor que supere un valor nominal debe ser revelado a los dueños.$DETAILS_ES$,
  consequences_es = $CONS_ES$La conducta financiera indebida puede resultar en terminación inmediata, puede ser reportada a las autoridades y puede resultar en acción civil para recuperar pérdidas.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Como gerente de Wong Hospitality Group, soy responsable de modelar, aplicar y mantener este estándar. Acepto un deber de cuidado superior al de los empleados que superviso. Entiendo y acepto seguir la Política de Integridad Financiera y Operativa de WHG.$ACK_ES$
where title = 'Financial & Operational Integrity' and version = 1;

-- 16. Fraternization & Boundaries
update policies set
  purpose_es = $PURPOSE_ES$Mantener límites claros entre los gerentes y los miembros del equipo que supervisan, proteger contra conflictos de interés y preservar el ambiente profesional que permite a WHG operar con justicia.$PURPOSE_ES$,
  details_es = $DETAILS_ES$- No buscaré ni participaré en una relación romántica o sexual con ningún empleado que supervise directa o indirectamente.
- Si existe una relación preexistente o se desarrolla una relación mutua con un empleado actual, revelaré la relación a los dueños inmediatamente para que se puedan tomar los pasos apropiados (reasignación, cambio de línea de reporte u otra resolución). No revelar la relación se tratará como una violación de esta política.
- No consumiré alcohol con empleados que superviso de una manera que comprometa mi autoridad, cree favoritismo o ponga a la compañía en riesgo. Los eventos ocasionales del equipo donde se sirva alcohol están permitidos cuando se conducen de manera profesional y con límites razonables.
- No usaré sustancias ilegales en presencia de empleados en ningún momento, durante o fuera del horario de trabajo.
- No pediré prestado dinero, prestaré dinero ni entraré en ningún arreglo financiero personal con un empleado que supervise.
- Mantendré límites apropiados en redes sociales. Las conexiones personales en redes sociales con empleados que superviso no se recomiendan, y no publicaré contenido sobre empleados individuales, su trabajo o su vida personal sin su consentimiento.
- No proporcionaré transporte, vivienda u otros servicios personales a empleados que supervise de una manera que cree dependencia, favoritismo o la apariencia de conducta impropia.$DETAILS_ES$,
  consequences_es = $CONS_ES$Las relaciones no reveladas, los límites comprometidos o la conducta indebida bajo esta política pueden resultar en disciplina documentada, descenso de puesto o terminación dependiendo de la gravedad y el impacto.$CONS_ES$,
  acknowledgment_text_es = $ACK_ES$Como gerente de Wong Hospitality Group, soy responsable de modelar, aplicar y mantener este estándar. Acepto un deber de cuidado superior al de los empleados que superviso. Entiendo y acepto seguir la Política de Relaciones y Límites de WHG.$ACK_ES$
where title = 'Fraternization & Boundaries' and version = 1;

-- ============================================================
-- DONE — Verify with:
-- select title, length(purpose_es) as p, length(details_es) as d,
--        length(consequences_es) as c, length(acknowledgment_text_es) as a
-- from policies where active = true order by sort_order;
-- ============================================================
