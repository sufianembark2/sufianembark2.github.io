/* ============================================================
   Tang Ji — Datos de ejemplo
   Esto es solo el punto de partida: todo lo que se añada desde
   el panel "Editar" se guarda en este navegador (localStorage)
   y se combina con esto la próxima vez que se abra la página.
   ============================================================ */

const DEFAULT_DATA = {
  categories: [
    {
      id: "cat-musculares",
      name: "Dolores musculares",
      children: [
        {
          id: "cat-espalda",
          name: "Dolores de espalda",
          children: [
            {
              id: "dis-lumbalgia",
              name: "Lumbalgia",
              description: "Dolor en la zona lumbar, a menudo por sobreesfuerzo o frío-humedad. Tonificar Riñón y activar la circulación local.",
              points: ["V23", "B6", "H3"]
            },
            {
              id: "dis-cervicalgia",
              name: "Cervicalgia / dolor de cuello",
              description: "Rigidez y dolor cervical, con frecuencia asociado a tensión o mal apoyo al dormir.",
              points: ["VB20", "IG4"]
            }
          ]
        },
        {
          id: "cat-articulares",
          name: "Dolores articulares",
          children: [
            {
              id: "dis-rodilla",
              name: "Dolor de rodilla",
              description: "Dolor articular en rodilla, revisar si hay componente de humedad (hinchazón) o frío (empeora con el clima).",
              points: ["E36", "B6"]
            }
          ]
        }
      ]
    },
    {
      id: "cat-internos",
      name: "Dolores internos",
      children: [
        {
          id: "cat-digestivos",
          name: "Digestivos",
          children: [
            {
              id: "dis-gastritis",
              name: "Gastritis",
              description: "Molestia epigástrica, acidez. Armonizar Estómago y fortalecer Bazo.",
              points: ["E36", "B6"]
            }
          ]
        },
        {
          id: "cat-cefaleas",
          name: "Cefaleas",
          children: [
            {
              id: "dis-migrana",
              name: "Migraña",
              description: "Cefalea intensa, a menudo unilateral. Relacionar con exceso de Hígado o ascenso de Yang.",
              points: ["VB20", "IG4", "H3", "DU20"]
            },
            {
              id: "dis-cefalea-tension",
              name: "Cefalea tensional",
              description: "Dolor en banda, asociado a tensión muscular cervical y estrés.",
              points: ["VB20", "DU20", "IG4"]
            }
          ]
        }
      ]
    },
    {
      id: "cat-cronicas",
      name: "Enfermedades crónicas",
      children: [
        {
          id: "cat-respiratorias",
          name: "Respiratorias",
          children: [
            {
              id: "dis-asma",
              name: "Asma",
              description: "Dificultad respiratoria recurrente. Tonificar Pulmón, dispersar flema.",
              points: ["P7", "E36"]
            }
          ]
        }
      ]
    },
    {
      id: "cat-flojera",
      name: "Flojera / fatiga",
      children: [
        {
          id: "dis-fatiga-cronica",
          name: "Fatiga crónica",
          description: "Cansancio persistente sin causa aparente. Tonificar Qi de Bazo y Riñón.",
          points: ["E36", "DU20", "B6"]
        }
      ]
    }
  ],

  points: [
    {
      code: "IG4",
      name: "Hegu · Valle de la Unión",
      meridian: "Intestino Grueso",
      location: "En el dorso de la mano, en el punto medio del segundo hueso metacarpiano, en la zona más alta del músculo al juntar pulgar e índice.",
      indications: "Dolor de cabeza, dolor facial, dolor de cuello, resfriados, analgesia general.",
      technique: "Presión firme o punción perpendicular de 0.5-1 cun.",
      cautions: "Evitar en embarazo (se considera punto que puede inducir el parto)."
    },
    {
      code: "E36",
      name: "Zusanli · Tres Millas de la Pierna",
      meridian: "Estómago",
      location: "4 dedos por debajo de la rótula, un dedo hacia fuera de la cresta de la tibia.",
      indications: "Fortalece el Qi general, digestión, fatiga, dolor de rodilla.",
      technique: "Punción de 1-1.5 cun, o moxibustión para tonificar.",
      cautions: "Ninguna relevante en uso habitual."
    },
    {
      code: "VB20",
      name: "Fengchi · Estanque del Viento",
      meridian: "Vesícula Biliar",
      location: "En la nuca, en la depresión entre el esternocleidomastoideo y el trapecio, a la altura del lóbulo de la oreja.",
      indications: "Cefalea, migraña, rigidez cervical, mareo, resfriados.",
      technique: "Punción dirigida hacia la nariz contraria, 0.5-1 cun. Requiere cuidado por la proximidad al bulbo raquídeo.",
      cautions: "No dirigir la punción hacia arriba ni profundizar en exceso."
    },
    {
      code: "V23",
      name: "Shenshu · Shu del Riñón",
      meridian: "Vejiga",
      location: "En la zona lumbar, dos dedos a cada lado de la apófisis espinosa entre L2 y L3.",
      indications: "Lumbalgia, debilidad de rodillas, fatiga, problemas relacionados con el Riñón.",
      technique: "Punción oblicua o moxibustión.",
      cautions: "Ninguna relevante en uso habitual."
    },
    {
      code: "B6",
      name: "Sanyinjiao · Reunión de los Tres Yin",
      meridian: "Bazo",
      location: "4 dedos por encima del maléolo interno, justo detrás del borde de la tibia.",
      indications: "Digestión, ginecología, insomnio, fatiga, dolor de rodilla.",
      technique: "Punción perpendicular 0.5-1 cun.",
      cautions: "Evitar en embarazo (punto clásicamente contraindicado)."
    },
    {
      code: "H3",
      name: "Taichong · Gran Barrido",
      meridian: "Hígado",
      location: "En el dorso del pie, en la depresión entre el primer y segundo metatarsiano.",
      indications: "Migraña, mareo, irritabilidad, tensión, regula el Qi de Hígado.",
      technique: "Punción perpendicular 0.3-0.5 cun.",
      cautions: "Ninguna relevante en uso habitual."
    },
    {
      code: "DU20",
      name: "Baihui · Cien Reuniones",
      meridian: "Vaso Gobernador",
      location: "En la línea media de la cabeza, en el punto de intersección con una línea imaginaria que une ambas orejas.",
      indications: "Cefalea, mareo, fatiga mental, elevación del Qi (prolapsos).",
      technique: "Punción horizontal muy superficial, o moxibustión.",
      cautions: "Ninguna relevante en uso habitual."
    },
    {
      code: "P7",
      name: "Lieque · Hendidura Rota",
      meridian: "Pulmón",
      location: "Por encima de la apófisis estiloides del radio, 1.5 dedos por encima del pliegue de la muñeca, lado del pulgar.",
      indications: "Tos, asma, dolor de garganta, resfriados, dolor cervical.",
      technique: "Punción oblicua 0.3-0.5 cun.",
      cautions: "Ninguna relevante en uso habitual."
    }
  ]
};
