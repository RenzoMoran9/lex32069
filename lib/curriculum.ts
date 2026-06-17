/**
 * Currículo ordenado para la ruta de aprendizaje guiada.
 * Las lecciones van de lo general a lo específico, en orden pedagógico.
 */
export type Lesson = {
  id: string;
  title: string;
  summary: string;
  topic: string; // se envía a Gemini como tema de la lección
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export const CURRICULUM: Module[] = [
  {
    id: "fundamentos",
    title: "1. Fundamentos",
    lessons: [
      {
        id: "objeto",
        title: "Objeto y finalidad de la ley",
        summary: "Qué regula la Ley 32069 y para qué sirve.",
        topic: "El objeto, la finalidad y los enfoques de la Ley 32069",
      },
      {
        id: "principios",
        title: "Principios rectores",
        summary: "Los principios que rigen toda contratación pública.",
        topic: "Los principios rectores de la contratación pública en la Ley 32069",
      },
      {
        id: "definiciones",
        title: "Definiciones y siglas clave",
        summary: "El vocabulario esencial: OECE, SEACE, RNP, PLADICOP, etc.",
        topic:
          "Las definiciones y acrónimos clave de la Ley 32069 y su Reglamento (OECE, SEACE, RNP, PLADICOP, DGA)",
      },
      {
        id: "ambito",
        title: "Ámbito de aplicación y exclusiones",
        summary: "A quién aplica la ley y qué contrataciones quedan excluidas.",
        topic:
          "El ámbito de aplicación de la Ley 32069 y las contrataciones excluidas de su alcance",
      },
    ],
  },
  {
    id: "actores",
    title: "2. Actores y registros",
    lessons: [
      {
        id: "actores-sistema",
        title: "Actores del sistema",
        summary: "OECE, entidades contratantes y el Tribunal.",
        topic:
          "Los actores involucrados en la contratación pública: el OECE, las entidades y el Tribunal",
      },
      {
        id: "rnp",
        title: "Registro Nacional de Proveedores (RNP)",
        summary: "Cómo se inscriben y habilitan los proveedores.",
        topic: "El Registro Nacional de Proveedores (RNP) en la Ley 32069 y su Reglamento",
      },
    ],
  },
  {
    id: "proceso",
    title: "3. El proceso de contratación",
    lessons: [
      {
        id: "modalidades",
        title: "Modalidades y herramientas",
        summary: "PLADICOP, catálogos electrónicos y otras herramientas.",
        topic:
          "Las modalidades y herramientas para la contratación pública (PLADICOP, catálogos electrónicos)",
      },
      {
        id: "procedimientos",
        title: "Procedimientos de selección",
        summary: "Los tipos de procedimiento y cuándo usar cada uno.",
        topic: "Los procedimientos de selección regulados en la Ley 32069 y su Reglamento",
      },
      {
        id: "montos",
        title: "Montos, topes y umbrales",
        summary: "Los límites económicos que definen cada procedimiento.",
        topic: "Los montos tope y umbrales que determinan los procedimientos de selección",
      },
    ],
  },
  {
    id: "contrato",
    title: "4. El contrato",
    lessons: [
      {
        id: "perfeccionamiento",
        title: "Perfeccionamiento y garantías",
        summary: "Cómo se firma el contrato y qué garantías se exigen.",
        topic: "El perfeccionamiento del contrato y las garantías exigidas en la Ley 32069",
      },
      {
        id: "modificaciones",
        title: "Modificaciones contractuales",
        summary: "Adicionales, reducciones y ampliaciones de plazo.",
        topic: "Las modificaciones contractuales: adicionales, reducciones y ampliaciones de plazo",
      },
      {
        id: "penalidades",
        title: "Penalidades",
        summary: "Penalidades por mora y otras penalidades.",
        topic: "Las penalidades aplicables al contratista en la Ley 32069 y su Reglamento",
      },
    ],
  },
  {
    id: "cierre",
    title: "5. Controversias y sanciones",
    lessons: [
      {
        id: "controversias",
        title: "Solución de controversias",
        summary: "Conciliación, arbitraje y Junta de Resolución de Disputas.",
        topic:
          "La solución de controversias: conciliación, arbitraje y Junta de Prevención y Resolución de Disputas",
      },
      {
        id: "infracciones",
        title: "Infracciones y sanciones",
        summary: "El régimen sancionador y el Tribunal.",
        topic: "El régimen de infracciones y sanciones de la Ley 32069",
      },
      {
        id: "transparencia",
        title: "SEACE y transparencia",
        summary: "El sistema electrónico y las obligaciones de publicidad.",
        topic: "El SEACE, la transparencia y la publicidad en la contratación pública",
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = CURRICULUM.flatMap((m) => m.lessons);
export const TOTAL_LESSONS = ALL_LESSONS.length;

export function findLesson(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}
