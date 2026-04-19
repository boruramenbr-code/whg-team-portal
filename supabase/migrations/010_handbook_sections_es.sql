-- ============================================================
-- Spanish Handbook seed (scripts/handbook_parsed_es.json)
-- Inserts all 13 sections with language = 'es', handbook_version = 4
-- matching the English reseed (006).
-- ============================================================

-- Remove any prior Spanish seed so this is idempotent
delete from handbook_sections where language = 'es' and handbook_version = 4;

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 1, $title_es$Bienvenida y Nuestra Cultura$title_es$, $BODY_ES_1$## Un Mensaje de la Familia Wong

Bienvenido a Wong Hospitality Group. Ahora usted es parte de un equipo que se ha construido a lo largo de más de dos décadas con trabajo duro, sacrificio y la creencia genuina de que la buena comida y la buena hospitalidad pueden cambiar cómo una persona se siente durante su día. No llegamos aquí por casualidad, y las personas que representan esta marca en cada turno son la razón por la que seguimos aquí y seguimos creciendo. Este manual no es una formalidad. Es la guía operativa de cómo manejamos nuestros restaurantes y cómo esperamos que nuestro equipo se conduzca. Léalo, entiéndalo, y haga preguntas si algo no le queda claro. Preferimos responder sus preguntas ahora que tener que resolver un malentendido después. — La Familia Wong

## Acerca de Wong Hospitality Group

Wong Hospitality Group es un grupo de restaurantes familiar y de múltiples conceptos con sede en Baton Rouge, Louisiana. Lo que comenzó en 2003 como un solo restaurante de sushi ha crecido hasta convertirse en una colección de conceptos distintos, cada uno con su propia identidad pero todos operando bajo el mismo compromiso con la calidad, la consistencia y la hospitalidad. Nuestros conceptos actuales y próximos:

- Ichiban Sushi — Nuestro concepto original, establecido en 2003. Sushi, hibachi, y la base sobre la cual se construyó toda esta compañía.
- Boru Ramen — El lugar auténtico de ramen en Louisiana. De propiedad familiar, energía de anime, bowls reconfortantes y hospitalidad cálida.
- Shokudo — Sushi y ramen todo lo que pueda comer. Un formato diferente, el mismo estándar.
- Central Hub — Nuestro concepto más nuevo en desarrollo — restaurante, bar, café y gelato bajo un mismo techo.

## Propósito de Este Manual

Este manual establece los estándares, expectativas y políticas que rigen su empleo con Wong Hospitality Group. Aplica a todos los empleados en todas las ubicaciones a menos que una política específica se indique como aplicable solo a una ubicación. Cuando una política varía según el concepto, su gerente le comunicará lo que aplica en su restaurante. Este manual no es un contrato de empleo. No crea empleo garantizado por ningún período de tiempo. Es una guía — y se actualizará conforme la compañía crezca y nuestras necesidades evolucionen. Cuando se hagan cambios, usted será notificado.

## Nuestra Cultura

Estamos construyendo restaurantes que funcionan con sistemas, no con la personalidad de quien sea que esté en turno ese día. Eso significa que la experiencia es consistente ya sea que los dueños estén presentes o no, ya sea un martes tranquilo o un sábado lleno, y ya sea que un miembro del equipo esté en su primera semana o en su quinto año. Lo que eso requiere de cada persona en el equipo es responsabilidad — con los estándares, con los clientes y entre nosotros. Combinamos esa responsabilidad con justicia. Cuando hacemos que alguien rinda cuentas aquí, lo hacemos de manera clara, directa y sin avergonzar a nadie. Y cuando reconocemos a alguien, lo hacemos porque genuinamente se lo ganó.

## Valores Fundamentales

### Responsabilidad

Hágase responsable de sus acciones, sus errores y sus resultados. La responsabilidad no se trata de echar culpas — se trata de asumir la responsabilidad sin que se lo pidan. Los empleados que se hacen responsables de sí mismos ganan la confianza de la gerencia y de sus compañeros más rápido que cualquier otra persona.

### Urgencia

Urgencia no es solo moverse rápido. Es ver lo que necesita hacerse y hacerlo sin esperar a que se lo digan. Manténgase atento a su entorno, anticipe las necesidades y ayude a sus compañeros antes de que tengan que pedir.

### Profesionalismo

El profesionalismo se define por el comportamiento consistente — cómo se comunica, cómo maneja la presión y cómo representa esta marca en cada turno. Es consistencia por encima de la personalidad. Cómo responde usted cuando las cosas se ponen ocupadas o estresantes es una de las principales medidas de su nivel profesional aquí.

### El Equipo Primero

En un ambiente de restaurante, el equipo tiene éxito junto o no tiene éxito. El éxito individual es secundario al flujo del equipo. Si su sección está cubierta pero un compañero está ahogado de trabajo, su trabajo no está terminado hasta que todo el equipo esté al día. Nadie gana solo.

### Crecimiento

Crecimiento significa aceptar la retroalimentación y la corrección como una herramienta para mejorar, no como una crítica personal. Wong Hospitality Group invierte en personas que no solo buscan sobrevivir el turno, sino que activamente buscan oportunidades para desarrollar sus habilidades.

## Crecimiento y Oportunidad

Wong Hospitality Group promueve internamente siempre que es posible. Los aumentos, las oportunidades de liderazgo y el avance son reales aquí para los empleados que se los ganan. El camino hacia el crecimiento no se basa solo en el tiempo — se basa en la consistencia, la actitud y la disposición para desarrollarse. Los estándares en este manual son el punto de partida para esa conversación.$BODY_ES_1$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 2, $title_es$Fundamentos del Empleo$title_es$, $BODY_ES_2$Entender los términos de su empleo es importante. Esta sección cubre la estructura básica de cómo funciona el empleo en Wong Hospitality Group — qué tipo de empleado es usted, qué significa el período introductorio de 90 días, y cuáles son sus derechos y responsabilidades desde el inicio.

## Empleo a Voluntad

El empleo en Wong Hospitality Group es a voluntad. Esto significa que la Compañía o el empleado pueden terminar la relación laboral en cualquier momento, con o sin causa, y con o sin aviso previo. Nada en este manual, en ninguna conversación verbal, ni en ningún otro documento crea un contrato de empleo o garantiza empleo por ningún período específico de tiempo. El empleo a voluntad funciona en ambas direcciones. Usted es libre de renunciar en cualquier momento, y la Compañía se reserva el derecho de tomar decisiones de personal basadas en necesidades operativas, desempeño, o cualquier otra razón legal.

## Clasificaciones de Empleo

- Tiempo Completo — Empleados que regularmente trabajan 30 o más horas por semana. Los empleados de tiempo completo son elegibles para los beneficios aplicables después de completar el período introductorio de 90 días.
- Medio Tiempo — Empleados que regularmente trabajan menos de 30 horas por semana. Los empleados de medio tiempo no son elegibles para beneficios a menos que se especifique lo contrario por escrito.
- Temporal — Empleados contratados por un período definido o una necesidad operativa específica. Los empleados temporales no reciben los beneficios estándar y no se les garantiza empleo extendido más allá de su período definido.
- Gerencia Asalariada — Empleados exentos en roles gerenciales. Los empleados asalariados son elegibles para PTO como se describe en la Sección 9 y no son elegibles para pago de horas extra.

## Empleador de Igualdad de Oportunidades

Wong Hospitality Group toma todas las decisiones de empleo — contratación, horarios, compensación, avance, disciplina y separación — basándose en el desempeño, las calificaciones, el comportamiento y las necesidades del negocio. No tomamos decisiones de empleo basadas en raza, color, religión, sexo, embarazo, orientación sexual, identidad de género, origen nacional, edad, discapacidad, información genética, estado de veterano, ni ninguna otra característica protegida por la ley aplicable.

## Autorización de Trabajo

Todos los empleados deben completar un Form I-9 verificando su identidad y autorización legal para trabajar en los Estados Unidos. Este es un requisito federal, y no se hacen excepciones. Usted debe presentar la documentación aceptable dentro del plazo requerido por la ley. El empleo no puede comenzar ni continuar sin un I-9 completado y verificado.

## Período Introductorio de 90 Días

Todos los empleados nuevos pasan por un período introductorio de 90 días que comienza en su primer día de empleo. Este es un período de evaluación mutua — una oportunidad para que usted aprenda el puesto y la cultura, y para que nosotros evaluemos si esto es una buena opción a largo plazo. Durante el período introductorio, estamos observando específicamente la asistencia, la actitud, la capacidad de aprendizaje, el profesionalismo y el trabajo en equipo. Estas cinco áreas son los indicadores más tempranos de si alguien va a prosperar aquí o va a tener dificultades. Completar exitosamente el período de 90 días no garantiza empleo continuo, pero sí marca el inicio oficial de su permanencia con la Compañía y activa la elegibilidad para los beneficios estándar de la Compañía. Los empleados que no están cumpliendo con las expectativas durante el período introductorio pueden ser separados sin pasar por el proceso disciplinario estándar. Este período existe precisamente para detectar problemas de compatibilidad temprano — para su beneficio y el nuestro.

## Expedientes de Personal

Wong Hospitality Group mantiene expedientes de personal para todos los empleados. Estos registros son confidenciales y solo son accesibles para la gerencia autorizada y los propietarios. Usted es responsable de asegurarse de que su información personal esté actualizada — incluyendo su dirección, número de teléfono, contacto de emergencia e información bancaria para depósito directo. Actualice su información a través de Paychex o notificando al gerente de oficina. La información desactualizada que cause problemas de nómina o comunicación es su responsabilidad corregirla.

## Elegibilidad para Recontratación

Los ex empleados que deseen regresar a Wong Hospitality Group son considerados para recontratación caso por caso. Las decisiones de recontratación toman en cuenta su historial de desempeño, la documentación de su empleo anterior, la razón de su salida y las necesidades actuales del negocio. Los empleados que fueron despedidos por causa o que se fueron por abandono de trabajo pueden no ser elegibles para recontratación. Los empleados recontratados son tratados como empleados nuevos para todos los propósitos incluyendo tarifa de pago, elegibilidad de beneficios y acumulación de PTO — a menos que se otorgue explícitamente crédito por servicio anterior por escrito por parte de los propietarios.$BODY_ES_2$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 3, $title_es$Estándares Profesionales y Conducta Diaria$title_es$, $BODY_ES_3$Los estándares no son sugerencias. Existen porque cada desviación tiene un efecto en los clientes, los compañeros y el negocio. Esta sección cubre las expectativas de conducta diaria que aplican a cada empleado, en cada turno.

## Conducta Profesional

Llegue a tiempo, en uniforme y listo para trabajar a la hora programada de su turno. La comunicación respetuosa y clara con compañeros y clientes es lo mínimo esperado — no un extra. Maneje los desacuerdos en privado después de su turno, no en el piso. Siga las instrucciones de la gerencia sin discutir durante el servicio. Si no está de acuerdo con una decisión, abórdela por el canal correcto en el momento adecuado. Mantener la compostura bajo presión es una de las medidas más visibles de su profesionalismo aquí.

## Urgencia y Responsabilidad

Anticipe lo que necesita hacerse y hágalo sin que se lo digan. Los momentos tranquilos no son tiempo para quedarse parado — son oportunidades para limpiar, surtir, preparar y apoyar a sus compañeros. "Eso no es mi trabajo" es una frase que no existe aquí. Si algo necesita hacerse y usted es capaz de hacerlo, hágalo. Eso es lo que significa equipo en la práctica.

## Estándares Cuando el Liderazgo No Está Presente

El estándar no cambia según quién esté observando. Estamos construyendo una cultura donde los sistemas guían el comportamiento, no la supervisión. Si usted solo trabaja a un alto nivel cuando un gerente está en su sección, no está cumpliendo con nuestro estándar. Los propietarios revisan las cámaras de seguridad. La actividad del POS se revisa. Sus patrones se notan con el tiempo, lo note usted o no.

## Política de Teléfonos Celulares

Los teléfonos celulares personales no están permitidos en el piso, en áreas de servicio, ni en ningún espacio frente a los clientes durante su turno. Su teléfono debe estar guardado y fuera de la vista. El uso del teléfono se permite únicamente en su descanso designado con reloj de salida marcado — no entre mesas, no en la estación de expedición, y no en los baños durante el servicio. Los gerentes pueden usar teléfonos solo para comunicación relacionada con el trabajo. Una mirada rápida por una emergencia genuina es entendible. Navegar, enviar mensajes y usar redes sociales durante el servicio no lo es.

## Audífonos y Auriculares

Los auriculares y audífonos no están permitidos en ninguna área frente a los clientes — incluyendo las cocinas abiertas en Boru Ramen y la barra de sushi en Ichiban. En el momento en que llega un cliente o comienza el servicio, la música se apaga y los audífonos se quitan. Sin excepciones. Excepción en Horas Muertas: Antes de abrir, después de cerrar, o durante un periodo genuino sin clientes a mitad de turno, se permite un solo audífono — nunca ambos. Las bocinas personales a volumen bajo son aceptables en áreas fuera de la vista del cliente durante esas mismas ventanas únicamente. La comunicación durante el servicio es esencial y los dispositivos de audio la obstaculizan.

### Referencia Rápida — Estado de Dispositivos de Audio:

- Servicio Activo: PROHIBIDO — en todas las áreas frente al cliente incluyendo cocinas abiertas
- Horas Muertas: Solo un audífono, volumen bajo, debe poder escuchar al equipo
- Antes/Después del Turno: Un audífono, volumen bajo, solo en áreas fuera de la vista del cliente

## Protocolo de Descansos y Baño

Durante las horas pico de servicio — 11:30am–1:30pm y 5:30pm–8:30pm — no hay descansos programados. Si tiene una necesidad urgente de ir al baño o una emergencia genuina, notifique al gerente en turno. Se esperan cinco minutos; diez minutos es el máximo absoluto. Fuera de las horas pico, los descansos ocurren en horarios aprobados por el gerente. Debe marcar su salida antes de dejar su estación. Permanecer con el reloj marcado durante un descanso es una violación de control de tiempo. Descansos en el local con reloj de salida marcado: coma en el área designada, use su teléfono, descanse — pero mantenga las interacciones con el personal que está trabajando breves y no distraiga a sus compañeros a mitad del servicio. Los descansos no se toman en áreas de servicio ni en ningún lugar visible para los clientes.

## Chismes y Comentarios Negativos

El chisme destruye la cultura del equipo más rápido que casi cualquier otra cosa. Llevar quejas o preocupaciones a personas que no pueden resolverlas no es desahogarse — es esparcir el problema. Si tiene un problema con un compañero, una política o una situación, llévelo directamente a la gerencia. Lo que no es aceptable: hablar de compañeros a sus espaldas, quejarse de la gerencia con otros empleados, o ventilar asuntos internos en redes sociales.

## Monitoreo en el Lugar de Trabajo

Las cámaras de seguridad están en uso en los espacios operativos de todos los restaurantes de la Compañía. Los empleados no deben tener expectativa de privacidad en estas áreas. La actividad del POS, los registros de entrada y salida, y los datos de transacciones se revisan regularmente. El monitoreo existe para proteger a todos — empleados y clientes incluidos.$BODY_ES_3$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 4, $title_es$Control de Tiempo, Asistencia y Responsabilidad$title_es$, $BODY_ES_4$La confiabilidad es la base de todo lo que construimos aquí. Es lo primero que evaluamos, lo primero que afecta su elegibilidad para un aumento, y lo primero que les indica a sus compañeros y gerentes si usted es alguien en quien vale la pena invertir.

## Sistema de Control de Tiempo

Wong Hospitality Group usa 7Punches para el registro de tiempo de los empleados. Usted marcará entrada y salida usando la estación de iPad designada en su ubicación. Cada registro se graba y se vincula directamente a la nómina, lo cual significa que la precisión importa — para usted y para el negocio.

- Marque entrada no más de 7 minutos antes de la hora de inicio programada de su turno. Las entradas anticipadas sin aprobación del gerente serán marcadas y pueden ser ajustadas.
- Marque salida puntualmente cuando termine su turno. No permanezca con el reloj marcado después de que haya completado sus tareas.
- Ingrese sus propinas al marcar salida a través de la estación de 7Punches antes de irse. Si las propinas no fueron ingresadas o se ingresaron incorrectamente, notifique a su gerente inmediatamente para un ajuste.
- Nunca marque entrada por otro empleado ni permita que alguien más marque entrada por usted. Esto se considera fraude de tiempo y es motivo de terminación inmediata.
- Permanecer con el reloj marcado mientras está en descanso es una violación de control de tiempo. Debe marcar salida antes de que comience su descanso y marcar entrada cuando regrese.

Sus registros son visibles para usted en tiempo real a través de la aplicación de 7shifts. Revise sus propios registros regularmente. Si algo no se ve bien, repórtelo inmediatamente a su gerente con fechas específicas, horas e información de respaldo. Los ajustes no se pueden hacer basándose solo en la memoria.

## Puntualidad

Llegar a tiempo significa estar listo para trabajar a la hora de inicio programada — no ir entrando por la puerta, no estarse cambiando todavía. Se registra un retardo cuando un empleado marca entrada más de 5 minutos después de la hora de inicio programada sin aprobación previa del gerente. Tres retardos dentro de un período de 30 días activarán una conversación formal y pueden resultar en documentación escrita.

## Expectativas de Asistencia

Cuando está programado, se espera que esté ahí. Entendemos que las emergencias ocurren. Lo que estamos evaluando es su patrón a lo largo del tiempo. Las ausencias repetidas, los patrones ligados a días específicos y las notificaciones de último minuto se rastrean y documentan. Una emergencia legítima es comprensible. Tres ausencias en un mes sin un patrón claro de legitimidad son un problema.

## Reportar Ausencia

Si no puede cumplir con su turno programado, notifique al equipo a través del grupo de gerentes en Telegram al menos 2 horas antes de la hora de inicio programada. No envíe mensajes a gerentes individuales. La notificación grupal asegura que todos los gerentes estén enterados simultáneamente y crea un registro escrito. Una ausencia que ocurre consistentemente un viernes por la noche o después de un día festivo se verá de manera diferente que una ausencia aislada con una razón verificable. No buscamos castigar a la gente por ser humana. Buscamos identificar patrones.

## Sin Aviso / Sin Presentarse

No presentarse sin avisar es una de las cosas más perjudiciales que pueden pasar en un turno. La primera vez que no se presente sin avisar resulta en una advertencia escrita formal. Una segunda vez dentro de cualquier período de 90 días puede resultar en terminación. Dos o más veces consecutivas sin presentarse ni avisar se tratará como una renuncia voluntaria — abandono de trabajo. Si una emergencia genuina le impidió comunicarse, contacte a su gerente tan pronto como le sea posible.

## Solicitudes de Tiempo Libre

Las solicitudes de tiempo libre deben enviarse a través de 7shifts con un mínimo de dos semanas de anticipación. Enviar una solicitud no garantiza su aprobación. No haga arreglos de viaje antes de recibir aprobación escrita de su gerente. Una solicitud sin confirmar no es una ausencia aprobada.

## Disponibilidad

Su disponibilidad debe ser enviada honestamente y mantenerse actualizada en 7shifts. Si su disponibilidad cambia, notifique a su gerente con anticipación y actualice el sistema antes de que se construya el siguiente horario. Ser programado basándose en disponibilidad desactualizada y luego reportar ausencia se trata como un problema de asistencia, no como un error de programación.

## Intercambios de Turno y Cobertura

Los intercambios de turno están permitidos pero deben ser aprobados por la gerencia antes de que se realice el intercambio, completados a través de 7shifts, y no deben crear horas extra ni violar las reglas laborales. No puede intercambiar con un empleado que no esté capacitado para su posición. Su turno programado sigue siendo su responsabilidad hasta que un gerente confirme el cambio.

## Disciplina Progresiva por Asistencia

1. Orientación verbal — primera conversación documentada con expectativas claras establecidas 2. Advertencia escrita — documentación formal con un plazo de mejora definido 3. Advertencia final — último paso documentado antes de que se considere la terminación 4. Terminación — si el patrón continúa después de todos los pasos anteriores No toda situación requiere cada paso. Las violaciones graves pueden saltar pasos dependiendo del historial. El objetivo de la disciplina progresiva es dar a los empleados una oportunidad justa para corregir el rumbo.

## Redención y Reinicio

Si recibe una advertencia escrita y demuestra mejora consistente — sin repetición del mismo problema por 12 meses consecutivos — esa documentación puede considerarse inactiva para propósitos de evaluación futura. La redención requiere mejora genuina y sostenida. Los gerentes rastrean estos plazos y reconocen el progreso real. Ese reconocimiento aparece en sus evaluaciones.$BODY_ES_4$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 5, $title_es$Pago, Nómina y Compensación$title_es$, $BODY_ES_5$Que le paguen correctamente y a tiempo importa. Esta sección explica cómo funciona la nómina, qué es responsabilidad de usted rastrear, y cómo manejarlo si algo no se ve bien.

## Calendario de Pago

Wong Hospitality Group procesa la nómina en un calendario quincenal — se le paga dos veces al mes, el 5 y el 20:

- Las horas trabajadas del 1 al 15 se pagan el 20 de ese mes.
- Las horas trabajadas del 16 al fin de mes se pagan el 5 del mes siguiente.

Cuando un día de pago programado cae en fin de semana o día feriado bancario, el pago se emite en el día hábil anterior más cercano. La nómina se procesa a través de Paychex. Todos los empleados deben inscribirse en depósito directo durante la incorporación.

## Tarifa de Pago de Entrenamiento

A todos los empleados se les paga una tarifa de entrenamiento de $8.00 por hora durante su período de entrenamiento designado, sin importar la posición. Su tarifa regular de pago comienza cuando el gerente confirma que su período de entrenamiento está completo.

## Aplicación de Paychex

Se recomienda encarecidamente que todo empleado descargue la aplicación de Paychex y mantenga su cuenta activa durante todo su empleo. Aquí es donde accede a sus recibos de pago, maneja el depósito directo, actualiza las retenciones de impuestos y obtiene su W-2. Mantener su información personal y bancaria actualizada en Paychex es su responsabilidad.

## Depósito Directo

El depósito directo es obligatorio para todos los empleados y se configura durante la incorporación a través de Paychex. Si necesita actualizar su información bancaria, hágalo en la aplicación de Paychex o notificando al gerente de oficina antes de la fecha límite de nómina para el próximo período de pago.

## Horas Extra

Las horas extra se calculan semanalmente. Cualquier empleado por hora no exento que trabaje más de 40 horas en una sola semana laboral tiene derecho a pago de horas extra a 1.5 veces su tarifa regular por hora por todas las horas por encima de 40. Las horas extra deben ser pre-aprobadas por la gerencia. Las horas extra no autorizadas se abordarán como un problema de conducta, aunque los empleados siempre serán compensados por todas las horas trabajadas.

## Empleados con Propinas

Los empleados en posiciones con propinas reciben un salario por hora con propinas de acuerdo con la ley de Louisiana y la ley federal. Las propinas deben ingresarse al marcar salida en cada turno usando la estación de iPad de 7Punches antes de irse. Los arreglos de propina compartida y distribución de propinas varían según la ubicación y están descritos en los materiales de capacitación específicos de su posición.

## Errores de Pago y Discrepancias

Si cree que hay un error en su pago, repórtelo de inmediato. Revise sus horas regularmente a través de la aplicación de 7shifts, que muestra los registros en tiempo real. Lleve las discrepancias a su gerente con fechas específicas, horas y datos de respaldo. Los ajustes no se pueden hacer basándose solo en la memoria. La manipulación deliberada de registros de tiempo para inflar el pago — incluyendo entradas anticipadas no autorizadas, salidas tardías, o hacer que otro empleado marque por usted — se considera fraude de tiempo y resultará en terminación inmediata.

## Embargos de Salario

Si la Compañía recibe una orden de embargo de salario legalmente válida, estamos obligados por ley a cumplirla. Los embargos aparecerán en su recibo de pago. Si tiene preguntas sobre un embargo específico, contacte directamente a la agencia emisora.$BODY_ES_5$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 6, $title_es$Seguridad, Política de Drogas y Alcohol, y Responsabilidad en el Trabajo$title_es$, $BODY_ES_6$Los restaurantes son ambientes de alta energía y alto riesgo. Cuchillos, superficies calientes, pisos mojados, equipo pesado y llamas abiertas son parte de la realidad diaria. La seguridad no es una política que publicamos en una pared y olvidamos — es algo de lo que cada empleado es activamente responsable, en cada turno.

## Seguridad General en el Lugar de Trabajo

- Use calzado antideslizante apropiado en cada turno. Los pisos mojados y grasosos son constantes en ambientes de restaurante.
- Mantenga los pasillos, salidas y rutas de servicio despejados en todo momento. No deje equipo o artículos personales donde creen un peligro de tropiezo.
- Reporte cualquier condición insegura a un gerente inmediatamente. Si ve un peligro, diga algo antes de que alguien se lastime.
- Use el equipo solo para su propósito previsto y solo si ha sido capacitado en su uso.
- Levante de forma segura. Doble las rodillas, mantenga la carga cerca de su cuerpo y pida ayuda cuando la carga sea demasiado pesada.

## Seguridad en la Cocina

- Maneje los cuchillos con toda su atención. Nunca apresure el trabajo con cuchillos, nunca deje las cuchillas expuestas en superficies, y siempre corte en dirección opuesta a su cuerpo.
- Use guantes de horno o protección apropiada al manejar utensilios calientes. Avise "caliente" o "atrás" cuando se mueva por la cocina con algo caliente o filoso.
- Limpie los derrames inmediatamente. Nunca deje líquidos en el piso y se vaya.
- Nunca deje comida cocinándose sin atención en una llama abierta o quemador activo.
- Conozca la ubicación de los extintores, botiquines de primeros auxilios y desconexiones de emergencia en su ubicación.

## Seguridad con Productos Químicos

- Use los productos químicos solo como se indica. Nunca improvise con concentraciones o aplicaciones de productos químicos.
- Nunca mezcle productos químicos. Mezclar productos de limpieza puede crear gases tóxicos.
- Almacene los productos químicos en áreas designadas, debidamente etiquetados y alejados de alimentos y superficies en contacto con alimentos.
- Las Hojas de Datos de Seguridad (SDS) para todos los productos químicos están disponibles con su gerente.

## Reporte de Lesiones y Accidentes

Toda lesión o accidente en el lugar de trabajo — sin importar lo menor que sea — debe ser reportado al gerente en turno inmediatamente. 5. Notifique al gerente en turno inmediatamente. 6. Busque primeros auxilios o atención médica según sea necesario. No continúe trabajando si está lesionado. 7. Complete un formulario de Reporte de Accidente documentando qué pasó, cuándo, dónde, cómo y quién fue testigo. Este reporte debe completarse el mismo día. 8. Si un cliente se lesiona en nuestras instalaciones, notifique al gerente en turno inmediatamente. No admita culpa ni haga declaraciones sobre responsabilidad.

## Compensación de Trabajadores

Wong Hospitality Group cuenta con seguro de compensación de trabajadores para todos los empleados. Si se lesiona en el trabajo, puede tener derecho a beneficios que cubran tratamiento médico y salarios perdidos. Estos beneficios están disponibles solo para lesiones que se reporten puntualmente y se documenten apropiadamente. No espere. Repórtelo cuando suceda.

## Procedimientos de Incendio y Emergencia

Conozca sus salidas. Cada empleado debe identificar las salidas de emergencia en su ubicación durante su primera semana.

- Alerte al gerente en turno y llame al 911 inmediatamente si hay algún riesgo para la vida o la propiedad.
- Ayude a los clientes a salir de manera segura si puede hacerlo sin riesgo para usted mismo.
- No use elevadores durante una emergencia de incendio.
- Reúnase en el punto de encuentro designado afuera y espere instrucciones de la gerencia o los servicios de emergencia. No vuelva a entrar hasta que se le autorice.

## Protocolo de Crimen y Robo

En caso de un robo o amenaza criminal, su seguridad es la única prioridad. Ninguna cantidad de dinero, equipo o inventario vale su vida.

- Cumpla con las demandas de cualquier persona que haga una amenaza creíble. No resista ni discuta.
- Llame al 911 tan pronto como sea seguro hacerlo.
- Notifique a la gerencia y a los propietarios inmediatamente después de llamar a los servicios de emergencia.
- No discuta el incidente con otros empleados, clientes, ni en redes sociales. Toda comunicación será manejada por los propietarios.

## Política de Drogas y Alcohol

Wong Hospitality Group mantiene una política de cero tolerancia para trabajar bajo la influencia del alcohol, drogas ilegales o cualquier sustancia controlada que afecte su capacidad para realizar su trabajo. Presentarse o trabajar un turno bajo los efectos es motivo de terminación inmediata. Si está tomando un medicamento recetado que pudiera afectar su estado de alerta o coordinación, infórmelo a un gerente antes de que comience su turno. La posesión, venta o distribución de sustancias ilegales en propiedad de la Compañía resultará en terminación inmediata y referencia a las autoridades.

## Servicio Responsable de Alcohol

Todo empleado que sirva o maneje alcohol debe tener un Permiso #A de Louisiana (Bar Card) válido antes de servir. Este es un requisito legal. Obténgalo y manténgalo vigente. La orientación sobre cómo obtener su Bar Card se cubre durante la incorporación.

- Ningún empleado menor de 18 años puede servir alcohol en ninguna capacidad.
- Pida identificación a cualquier cliente que aparente tener menos de 40 años de edad. En caso de duda, pida identificación. Siempre.
- No sirva alcohol a ningún cliente que parezca visiblemente intoxicado. Decline cortésmente y notifique a su gerente. La responsabilidad por servir de más recae en el empleado y en la Compañía.
- Si un cliente intoxicado necesita ayuda para llegar a casa de manera segura, involucre a su gerente. No permita que un cliente intoxicado se vaya manejando si puede prevenirlo razonablemente.

Wong Hospitality Group está comprometido a mantener un ambiente seguro, protegido y profesional para nuestros clientes, empleados y operaciones del negocio. Para apoyar este compromiso, nuestras ubicaciones de restaurantes usan sistemas de vigilancia de video y audio en las áreas comunes de trabajo en todas las instalaciones.

### Qué Se Monitorea

Las cámaras de seguridad — que pueden capturar tanto video como audio — están en uso en los siguientes tipos de áreas:

- Comedores y áreas de servicio frente al cliente
- Áreas de bar y servicio de bebidas
- Recepción y áreas de entrada
- Cocina y áreas de preparación de alimentos
- Áreas de punto de venta y manejo de efectivo
- Áreas de almacenamiento y espacios comunes de la parte trasera
- Estacionamientos y exteriores del edificio

Los sistemas de vigilancia no se instalan en áreas donde los empleados tienen una expectativa razonable de privacidad, incluyendo baños y áreas designadas para cambiarse.

### Propósito de la Vigilancia

Los sistemas de vigilancia están en su lugar para propósitos legítimos de negocio, incluyendo pero no limitándose a:

- Seguridad de clientes y empleados
- Prevención de pérdidas y disuasión de robo
- Monitoreo de calidad operativa y estándares
- Investigación de quejas, incidentes o violaciones de políticas
- Protección de los activos de la compañía

### Ley de Louisiana y Su Reconocimiento

Bajo la Ley de Vigilancia Electrónica de Louisiana (La. Rev. Stat. § 15:1303), Louisiana es un estado de consentimiento de una parte. Al trabajar en cualquier ubicación de Wong Hospitality Group, usted reconoce que está enterado y da su consentimiento para el monitoreo de audio y video en las áreas comunes de trabajo descritas anteriormente. Este reconocimiento se documenta como parte de su incorporación y empleo continuo. Al firmar su documentación de empleo y continuar su empleo con Wong Hospitality Group, usted reconoce que la vigilancia de audio y video está en uso en las áreas comunes de trabajo en todas las ubicaciones. Usted entiende que las grabaciones pueden ser revisadas para propósitos de seguridad, protección y operación.

### Acceso y Confidencialidad

Las grabaciones de vigilancia son confidenciales y solo son accesibles para la gerencia autorizada y los propietarios. Las grabaciones no se compartirán externamente excepto cuando lo requiera la ley, procedimientos legales o solicitudes autorizadas de las autoridades. Los empleados no tienen permitido manipular, desactivar, obstruir o intentar acceder al equipo de vigilancia o las grabaciones.

### Conducta Prohibida

Las siguientes son violaciones de esta política y pueden resultar en acción disciplinaria hasta e incluyendo terminación:

- Manipular, cubrir o desactivar cualquier cámara de vigilancia o dispositivo de audio
- Obstruir intencionalmente el campo de visión de cualquier cámara de seguridad
- Acceder o intentar acceder a grabaciones de vigilancia sin autorización
- Instalar dispositivos de grabación personales o no autorizados en propiedad de la compañía$BODY_ES_6$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 7, $title_es$Evaluaciones de Desempeño, Aumentos y Oportunidades de Ascenso$title_es$, $BODY_ES_7$El crecimiento en Wong Hospitality Group es real — pero es intencional. Los aumentos y ascensos no ocurren según un calendario fijo ni porque ha pasado el tiempo. Ocurren porque alguien ha demostrado consistentemente las habilidades, la actitud y la confiabilidad que justifican la inversión.

## Cómo Se Estructuran las Evaluaciones

Las evaluaciones en Wong Hospitality Group están vinculadas a su fecha de contratación, no a un calendario general de la compañía. Su evaluación ocurre alrededor de su aniversario laboral — no al mismo tiempo que todos los demás. Una evaluación es una revisión — no es una garantía de aumento. Cada evaluación resulta en una conversación. No toda conversación resulta en un aumento de pago.

## Qué Evaluamos

Cuando evaluamos a un empleado, estamos observando cinco categorías. La habilidad importa, pero es solo una pieza del panorama. Alguien que es talentoso pero poco confiable, o hábil pero resistente a recibir orientación, no está listo para un aumento — y se lo diremos directamente, junto con lo que necesita cambiar.

### Confiabilidad

¿Está usted aquí cuando está programado? ¿Llega a tiempo, listo para trabajar? ¿Cubre sus turnos responsablemente y se comunica cuando algo surge? Un historial de confiabilidad es innegociable para avanzar.

### Conducta Profesional

Cómo se comunica con compañeros y clientes, cómo maneja la presión, si contribuye a un ambiente positivo de equipo, y si representa esta marca de la manera correcta en cada turno — no solo cuando los propietarios están observando.

### Urgencia y Ética de Trabajo

¿Está activo y atento durante los períodos tranquilos, o desaparece? ¿Ayuda a sus compañeros cuando están ahogados de trabajo, o se queda en su carril y hace lo mínimo? La urgencia y la responsabilidad son cosas que observamos constantemente, no solo durante las evaluaciones.

### Capacidad de Recibir Retroalimentación

Cómo recibe la retroalimentación dice mucho sobre su potencial aquí. Los empleados que aceptan la corrección, hacen el ajuste y siguen adelante crecen más rápido que los empleados talentosos que discuten cada corrección. La capacidad de recibir orientación es uno de los indicadores más fuertes de éxito a largo plazo aquí.

### Nivel de Habilidad

Velocidad, precisión, conocimiento del POS, control de estación, conocimiento del menú — el lado técnico de su trabajo. Esto importa junto con las otras cuatro categorías, no en lugar de ellas.

## Qué Significa Realmente un Aumento

Un aumento es una inversión. Significa que creemos que usted está produciendo valor consistentemente a un nivel que justifica un pago más alto. No es un ajuste por simpatía, una recompensa por pedir con confianza, ni una reacción a cuánto tiempo ha estado aquí. La antigüedad se respeta, pero el tiempo por sí solo no mueve su tarifa de pago.

## Cuando Se Niega un Aumento

Si su evaluación no resulta en un aumento, usted merece una explicación clara — no un vago "todavía no." Le diremos específicamente qué categoría o categorías lo están deteniendo, cómo debe verse la mejora, y cuál es el plazo para una re-evaluación. Una negación no es un callejón sin salida. Es un mapa. Úselo.

## Ascenso a Liderazgo

Los roles de liderazgo se ganan y conllevan una responsabilidad real. Cuando evaluamos a alguien para un ascenso, estamos mirando más allá del desempeño laboral. Estamos observando cómo influyen en las personas a su alrededor, cómo manejan los conflictos y el estrés, si hacen cumplir los estándares incluso cuando nadie está observando, y si hacen que el equipo sea mejor. El trabajo duro gana respeto. Liderar correctamente gana confianza. Hay una diferencia, y buscamos ambas cosas antes de poner a alguien en un rol de liderazgo.

## Transparencia de Pago y Confidencialidad

Las decisiones de aumentos y ascensos se documentan internamente para asegurar consistencia. Las tarifas de pago individuales son confidenciales. Si tiene preguntas sobre su propio pago o evaluación, llévelas directamente a su gerente. Una vez que un empleado alcanza el rango superior para su posición, el crecimiento adicional requiere responsabilidades expandidas, capacitación cruzada o ascenso a una posición de nivel más alto.$BODY_ES_7$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 8, $title_es$Horarios, Comunicación y Sistemas Operativos$title_es$, $BODY_ES_8$Operar múltiples restaurantes de la manera correcta requiere sistemas claros — para los horarios, para la comunicación y para las herramientas que usamos para mantener las operaciones organizadas. Los sistemas pueden evolucionar conforme crecemos, pero las expectativas detrás de ellos se mantienen igual.

## Horarios

Wong Hospitality Group usa 7shifts como nuestra plataforma de horarios. Aquí es donde vive su horario, donde envía solicitudes de tiempo libre y donde se registran sus marcas de reloj. Cada empleado debe descargar la aplicación, configurar su cuenta durante la incorporación y usarla activamente. Su horario se publica semanalmente, a más tardar el jueves para la semana siguiente. Usted es responsable de conocer sus turnos. No revisar la aplicación no es una razón aceptable para faltar a un turno programado.

- La disponibilidad debe enviarse honestamente y mantenerse actualizada. Los cambios deben hacerse antes de que se construya el siguiente horario.
- Las conversaciones verbales sobre horarios no anulan lo publicado en 7shifts a menos que un gerente confirme el cambio por escrito.
- La disponibilidad limitada puede afectar la cantidad de horas que se le ofrecen.

## Intercambios de Turno y Cobertura

La vida pasa, y a veces necesita intercambiar un turno. Todos los intercambios de turno deben ser aprobados por un gerente antes de que sucedan, completados a través de 7shifts, y no deben crear horas extra ni violar las reglas laborales. No puede intercambiar con alguien que no esté capacitado para su posición. Su turno sigue siendo su responsabilidad hasta que un gerente confirme el cambio.

## Comunicación

Nuestra plataforma principal de comunicación para mensajes del equipo y operativos es Telegram. Así es como la gerencia comunica anuncios y actualizaciones, y cómo los empleados notifican a la gerencia cuando no pueden cumplir con un turno. Usted será agregado a los grupos de Telegram apropiados durante la incorporación. Revisar Telegram regularmente es parte del trabajo. El tono que use en Telegram debe reflejar el mismo profesionalismo que esperamos en el piso. La comunicación operativa no es redes sociales. Manténgala clara, respetuosa y en tema.

## Sistemas de Nómina y Recursos Humanos

La nómina se procesa a través de Paychex. Descargue la aplicación y mantenga su cuenta activa — ahí es donde accede a recibos de pago, maneja el depósito directo, actualiza información personal y obtiene documentos de impuestos. Sus horas son visibles en tiempo real a través de 7shifts. Manténgase al tanto de sus propios registros.

## Cambios en los Sistemas y Adaptabilidad

Wong Hospitality Group es una compañía en crecimiento, y nuestros sistemas evolucionarán con ella. Cuando ocurran cambios, usted será notificado y se le dará la capacitación necesaria para hacer la transición sin problemas. La resistencia a adoptar los sistemas requeridos se trata como un problema de conducta, no como una preferencia.$BODY_ES_8$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 9, $title_es$Beneficios del Empleado, Política de Comidas y Beneficios Adicionales$title_es$, $BODY_ES_9$Los beneficios y ventajas en esta sección son parte de cómo cuidamos a las personas que se presentan consistentemente y hacen el trabajo de la manera correcta. Estos no son derechos que vienen automáticamente con el puesto — son privilegios que reflejan nuestra inversión en empleados que se los han ganado.

## Política de Comidas para Empleados

Queremos que conozca el menú, disfrute la comida que ayuda a servir y se sienta bien cuidado durante su turno. El beneficio de comida viene con lineamientos claros que protegen el costo de alimentos, la precisión del inventario y la equidad en todo el equipo.

### Descuento de Comida en Turno

Los empleados reciben un descuento en comida mientras trabajan un turno programado. Su comida solo puede ser consumida en su descanso designado con reloj de salida marcado. No se permite comer a nadie — personal o gerencia — durante las horas de 11:30am–1:30pm o 5:30pm–8:30pm. Esas ventanas están reservadas completamente para el servicio al cliente.

### Beneficio de Comida para Gerentes

Los gerentes reciben una comida de turno gratuita por turno, con un tope de $15, y no más de dos comidas gratuitas en un solo día. Debe ser ingresada al sistema POS antes de comer.

### Descuento para Comer Fuera de Turno

Los empleados pueden recibir un descuento al comer fuera de turno, para hasta cuatro invitados. El descuento no aplica al alcohol a menos que la gerencia lo haya autorizado, y puede ser suspendido en días de alto volumen. Consulte con su gerente para los detalles específicos en su ubicación.

### Cumplimiento de la Política de Comidas

Toda comida — sin importar el nivel de descuento o la posición — debe ser ingresada al sistema POS antes de que la coma. El abuso del beneficio de comida puede resultar en la pérdida del privilegio y acción disciplinaria adicional.

## Tiempo Libre Pagado (PTO)

El PTO se ofrece exclusivamente a empleados de gerencia asalariada y sub-gerencia. Los empleados por hora no son elegibles para PTO en este momento.

### Calendario de PTO para Gerentes Asalariados

- Años 1 y 2 — 5 días de PTO por año
- Años 3 y 4 — 10 días de PTO por año
- Año 5 en adelante — 14 días de PTO por año

El PTO se reinicia en su fecha de aniversario de empleo. El PTO no utilizado no se acumula para el siguiente período. Los gerentes y sub-gerentes no pueden aprobar su propio tiempo libre. Todas las solicitudes de PTO requieren la aprobación del Gerente General o de los propietarios. El cobro de PTO es una excepción aprobada solo por los propietarios — nunca automático, nunca garantizado, siempre documentado por escrito cuando se aprueba.

## Seguro Médico

Los empleados elegibles de tiempo completo pueden calificar para seguro médico con apoyo del empleador después de completar 90 días. La Compañía actualmente contribuye el 25% hacia la cobertura. La inscripción se realiza durante la inscripción abierta anual en octubre.

## Plan de Retiro 401(k)

Los empleados elegibles pueden participar en nuestro plan de ahorro para el retiro 401(k), que incluye una contribución del empleador equivalente hasta un porcentaje definido. La participación es voluntaria pero se recomienda encarecidamente. Los detalles de inscripción se proporcionan por separado.

## Bono por Desempeño y Reconocimiento Anual

Los empleados de tiempo completo por hora de BOH son elegibles para un bono trimestral de desempeño cuando cumplen con todos los criterios durante ese trimestre: sin ausencias injustificadas o reportes de ausencia, sin documentación disciplinaria activa, y una evaluación de desempeño positiva. Los montos de los bonos son determinados por ubicación. La Compañía lleva a cabo un evento anual de reconocimiento por las fiestas para todo el personal. Los empleados en buen estado pueden ser elegibles para un bono de fin de año basado en antigüedad y desempeño. Estos programas no son compensación garantizada.

## Modificaciones a los Beneficios

Los beneficios, estructuras de descuento y requisitos de elegibilidad pueden cambiar según las necesidades operativas, actualizaciones de seguros o crecimiento del negocio. La Compañía se reserva el derecho de modificar cualquier programa de beneficios en cualquier momento. Los cambios se comunicarán a los empleados conforme ocurran.$BODY_ES_9$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 10, $title_es$Estándares de Uniforme y Apariencia Profesional$title_es$, $BODY_ES_10$Cómo se ve usted cuando entra por esa puerta es lo primero que un cliente nota antes de que usted diga una palabra o entregue un solo plato. Una apariencia limpia y pulida comunica profesionalismo, atención al detalle y respeto por el ambiente del que es parte. Los requisitos de uniforme varían según la posición y la ubicación. Los detalles específicos para su rol están en sus materiales de capacitación de posición. Esta sección cubre los estándares universales que aplican a cada empleado en todos los restaurantes de Wong Hospitality Group.

## Requisitos de Uniforme

Su uniforme debe estar limpio, sin arrugas y en buenas condiciones en cada turno. Llegar con un uniforme sucio o dañado es lo mismo que llegar sin estar preparado. Los uniformes iniciales son proporcionados por la Compañía. Usted es responsable de mantenerlos. Si llega sin uniforme, se le puede enviar a casa a corregirlo. Ese tiempo no es compensado.

## Arreglo Personal e Higiene

- El cabello debe estar limpio, controlado y fuera de la cara y los hombros durante el servicio. Todos los empleados de BOH y cualquier persona que maneje alimentos debe usar una redecilla o sujetador de cabello.
- Las manos y uñas deben estar limpias en todo momento. Las uñas deben mantenerse cortas y libres de esmalte descascarado o excesivamente decorativo.
- Se espera el uso de desodorante. Este es un trabajo físico en un ambiente caluroso.
- La colonia y el perfume deben ser mínimos o evitarse por completo. Las fragancias fuertes interfieren con la experiencia gastronómica y pueden ser desagradables para los compañeros en espacios cerrados.

## Higiene de Manos y Uso de Guantes

Las manos limpias son innegociables. Lávese las manos a fondo y con frecuencia — cuando llegue, después de usar el baño, después de manejar proteínas crudas, después de tocarse la cara o el teléfono, y en cualquier momento que sus manos entren en contacto con algo que pueda contaminar alimentos o superficies. El uso de guantes varía según el concepto. En nuestros conceptos de ramen, se fomenta el uso de guantes durante la preparación de alimentos como una señal visible de cuidado. En nuestros conceptos de sushi, la elaboración a mano es el estándar — el lavado frecuente de manos es estrictamente requerido durante todo el servicio. Los detalles específicos para su posición se cubren en sus materiales de capacitación.

## Tatuajes y Piercings

Los tatuajes están permitidos siempre que no sean ofensivos o inapropiados para un ambiente de comida familiar. La gerencia puede requerir que ciertos tatuajes se cubran durante el servicio — esto no es un debate en el piso. Si se solicita que se cubra, se espera que lo haga sin discutir. Los piercings deben ser mínimos y profesionales. Los retenedores transparentes o neutros son una alternativa aceptable donde los piercings visibles no se alinean con los estándares de presentación. Todas las decisiones se aplican consistentemente y se manejan en privado.

## Artículos Personales, Almacenamiento y Cumplimiento del Código de Salud

Las pertenencias personales deben almacenarse solo en las áreas designadas para empleados. No están permitidas en áreas de servicio, estaciones de expedición, superficies de preparación de alimentos o espacios de trabajo de la cocina. Este es un requisito del departamento de salud. Los alimentos y bebidas personales siguen la misma regla. Nada personal — incluyendo su propia botella de agua — pertenece en la línea, en la estación de expedición, detrás del bar o en cualquier superficie de preparación de alimentos. Los artículos personales en áreas de alimentos crean riesgo de contaminación y son una violación del código de salud.

## Redes Sociales y Representación Pública

Usted representa esta marca ya sea que esté trabajando o no. Lo siguiente no está permitido en ninguna plataforma pública:

- Publicar información confidencial sobre nuestras operaciones, recetas, finanzas o asuntos internos
- Desprestigiar la marca, la gerencia, los propietarios o a compañeros de trabajo en cualquier foro público
- Publicar contenido que cree riesgo legal, reputacional u operativo para Wong Hospitality Group

Las violaciones pueden resultar en acción disciplinaria hasta e incluyendo terminación.$BODY_ES_10$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 11, $title_es$Acoso, Discriminación y Conducta Laboral$title_es$, $BODY_ES_11$Wong Hospitality Group está comprometido a mantener un lugar de trabajo donde cada empleado sea tratado con dignidad y respeto. El acoso, la discriminación y la violencia en el lugar de trabajo no tienen lugar en ninguno de nuestros restaurantes, y tomamos cada reporte con seriedad.

## Empleo con Igualdad de Oportunidades

Wong Hospitality Group toma todas las decisiones de empleo basándose en el desempeño, las calificaciones, el comportamiento y las necesidades del negocio. No tomamos decisiones de empleo basadas en raza, color, religión, sexo, embarazo, orientación sexual, identidad de género, origen nacional, edad, discapacidad, información genética, estado de veterano, servicio militar, ni ninguna otra característica protegida por la ley federal, estatal o local.

## Lugar de Trabajo Libre de Acoso

El acoso está prohibido en cualquier forma. El comportamiento repetido que crea un ambiente de trabajo hostil, intimidante u ofensivo califica como acoso independientemente de la intención. El impacto importa más que la intención. El acoso incluye pero no se limita a:

- Conducta verbal como insultos, chistes ofensivos, apodos despectivos, amenazas o comentarios no deseados sobre las características protegidas de alguien
- Conducta visual como imágenes ofensivas, gestos o material escrito exhibido en o alrededor del lugar de trabajo
- Conducta física como contacto físico no deseado, bloqueo de movimiento o cualquier acto de agresión física
- Atención persistente no deseada, burlas o comportamiento que una persona razonable encontraría ofensivo o degradante

## Acoso Sexual

El acoso sexual incluye avances sexuales no deseados, solicitudes de favores sexuales, y cualquier conducta verbal, visual o física de naturaleza sexual que cree un ambiente de trabajo intimidante, hostil u ofensivo. Ejemplos incluyen proposiciones, comentarios inapropiados, compartir imágenes explícitas, chistes sexuales groseros, o cualquier conducta que una persona razonable encontraría sexualmente ofensiva. No hay zona gris en esto. Si no es bienvenido y es de naturaleza sexual, no es aceptable aquí.

## Violencia en el Lugar de Trabajo

Tenemos una política de cero tolerancia para la violencia en el lugar de trabajo de cualquier tipo. Lo siguiente está estrictamente prohibido:

- Agresión física o cualquier forma de contacto físico no deseado con intención de dañar o intimidar
- Amenazas verbales o escritas dirigidas a cualquier persona
- Comportamiento que cause que alguien tema razonablemente que va a ser dañado
- Posesión o exhibición de cualquier arma de fuego o arma en propiedad de la Compañía excepto cuando lo permita la ley estatal aplicable

Las violaciones pueden resultar en terminación inmediata y referencia a las autoridades. Esta es un área donde no pasamos por los pasos de disciplina progresiva.

## Reportar una Preocupación

Si experimenta o presencia acoso, discriminación o violencia en el lugar de trabajo, repórtelo. No podemos abordar lo que no sabemos. No se le requiere estar seguro de que lo que experimentó cumple con una definición legal — si algo se siente mal, díganos. El proceso para reportar: 9. Reporte al gerente en turno lo antes posible. 10. Si su gerente es la fuente de la preocupación, o no se siente cómodo reportándole a él, vaya directamente al Gerente General. 11. Si la preocupación involucra al Gerente General o permanece sin resolver, contacte a los propietarios directamente vía Telegram. 12. Si la preocupación involucra a los propietarios, contacte a Recursos Humanos a través de Paychex para una revisión independiente.

## Proceso de Investigación

Cada reporte será investigado de manera pronta, exhaustiva y tan confidencialmente como sea posible. Se espera que los empleados que sean entrevistados cooperen completamente y proporcionen información honesta. Si una queja se comprueba, seguirá una acción correctiva. Los gerentes que presencien o sean informados de acoso y no actúen también están sujetos a disciplina. Ignorar un problema no es una posición neutral.

## Las Represalias Están Prohibidas

Ningún empleado enfrentará represalias por reportar una preocupación, participar en una investigación o apoyar a un compañero que haya hecho un reporte de buena fe. Las represalias incluyen reducción de horarios, asignaciones desfavorables, exclusión o cualquier trato adverso vinculado a un reporte protegido. Por otro lado, presentar una queja que sea a sabiendas falsa y con intención de perjudicar a otro empleado también es una violación sujeta a disciplina. Esta política existe para proteger a las personas — no para ser usada como arma.

## Manejo de Conflictos Laborales

No toda tensión interpersonal llega al nivel de acoso. Los desacuerdos deben abordarse directamente y profesionalmente, o con la ayuda de un gerente. Lo que no es aceptable: dejar que se derrame en el piso, desahogarse con otros compañeros, o dejar que se acumule en algo que afecte a todo el equipo.

## Separación del Empleo

El empleo puede terminar por renuncia voluntaria, terminación por parte de la Compañía, abandono de trabajo o acuerdo mutuo. Si decide renunciar, le pedimos un mínimo de dos semanas de aviso. Cómo se va dice algo — haga que diga lo correcto. El abandono de trabajo se define como dos o más veces consecutivas sin presentarse ni avisar sin una explicación de emergencia verificada. Esto se trata como una renuncia voluntaria.$BODY_ES_11$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 12, $title_es$Declaración Final y Refuerzo Cultural$title_es$, $BODY_ES_12$Usted ha leído muchas páginas. Eso es intencional — creemos en la claridad, y la claridad necesita espacio para hacerse bien. Pero si hay algo que queremos que se lleve de todo lo escrito en este manual, es esto: los estándares que hemos establecido existen para proteger a todos, no para controlar a nadie. Lo protegen a usted — porque las expectativas claras significan que sabe exactamente dónde está parado y hacia dónde se dirige. Protegen a sus compañeros — porque los estándares consistentes crean justicia, y la justicia es lo que hace que un equipo realmente funcione. Protegen la experiencia del cliente — porque las personas que confían en nosotros lo suficiente para gastar su dinero y su tiempo aquí merecen ser atendidas por un equipo que se enorgullece de lo que hace. Y protegen el futuro de esta compañía — porque no podemos crecer, expandirnos y crear más oportunidad para más personas si la base debajo de nosotros es inconsistente. Wong Hospitality Group fue construido a través del sacrificio, el trabajo duro y el compromiso de hacer las cosas bien incluso cuando nadie estaba viendo. Eso no ha cambiado. Lo que ha cambiado es el tamaño de la operación y la cantidad de personas por las que somos responsables — que es exactamente por lo que los sistemas, la documentación y los estándares importan más ahora que nunca. No estamos construyendo restaurantes que funcionen con personalidades. Estamos construyendo restaurantes que funcionen con sistemas — donde la experiencia es consistente, el equipo rinde cuentas, y la oportunidad de crecer es real para cualquiera dispuesto a ganársela. Eso no sucede por accidente. Sucede porque cada persona en el equipo — desde los propietarios hasta el nuevo empleado en su primera semana — mantiene la línea. No esperamos perfección. Esperamos esfuerzo, honestidad y la disposición para mejorar cuando la corrección llegue. Si usted trae esas cosas, hay un lugar para usted aquí y un futuro por el que vale la pena trabajar. Nos alegra que esté aquí. Ahora vamos a trabajar. — La Familia Wong Este manual opera con estándares. Esos estándares crean estabilidad, oportunidad, justicia y crecimiento. Este manual no pretende crear miedo — pretende crear claridad. Creemos en la responsabilidad con justicia. Creemos en los estándares con humanidad. Creemos en la estructura con oportunidad. Si usted se compromete con la confiabilidad, el profesionalismo, el crecimiento y el trabajo en equipo — hay una oportunidad aquí. Si los estándares en este manual se ignoran repetidamente, la responsabilidad seguirá. Estamos construyendo restaurantes que operen a un alto nivel ya sea que los propietarios estén presentes o no. Usted es parte de eso.$BODY_ES_12$, true);

insert into handbook_sections (language, handbook_version, sort_order, title, body, active)
values ('es', 4, 13, $title_es$Reconocimiento del Empleado$title_es$, $BODY_ES_13$Al firmar abajo, usted confirma que ha recibido y revisado el Manual del Equipo de Wong Hospitality Group. Usted entiende que es su responsabilidad leer este manual completo, hacer preguntas sobre cualquier cosa que no le quede clara, y cumplir con las políticas y estándares descritos en el mismo. Usted reconoce lo siguiente:

- El empleo con Wong Hospitality Group es a voluntad, lo que significa que cualquiera de las partes puede terminar la relación laboral en cualquier momento con o sin causa o aviso previo.
- Las políticas en este manual pueden actualizarse conforme el negocio crezca. Cuando se hagan actualizaciones, usted será notificado. El empleo continuo constituye la aceptación de cualquier política revisada.
- Usted es responsable de entender y seguir los estándares en este manual. Alegar que desconocía una política no es una defensa contra la acción disciplinaria.
- El incumplimiento de las políticas de la Compañía puede resultar en acción disciplinaria hasta e incluyendo terminación.

Este manual no es un contrato de empleo. Es una guía de los estándares, expectativas y políticas que rigen su empleo con Wong Hospitality Group. Nombre del Empleado (letra de molde): _______________________________________________ Firma del Empleado:____________________________________________________ Fecha: _____________________ Ubicación del Restaurante: ________________________________________________ Posición: _________________________________________________________ Firma del Gerente: __________________________________________________ Fecha: _____________________ Una copia firmada de este reconocimiento se conservará en el expediente de personal del empleado. El empleado tiene derecho a conservar una copia de este manual para su propia referencia.$BODY_ES_13$, true);

-- Verify
select sort_order, title, length(body) as body_len from handbook_sections where language = 'es' and handbook_version = 4 order by sort_order;
