# Manual de integraciones externas

Las integraciones externas permiten que una SPA, juego, quiz o laboratorio virtual reporte notas directamente a actividades existentes en e-notes.

## Flujo general

1. En e-notes, entra al curso.
2. Abre el tab **Integraciones**.
3. Crea una integracion con nombre y selecciona las actividades a las que la app externa podra reportar notas.
4. Copia el token o los endpoints generados.
5. La app externa usa esos endpoints para listar estudiantes, mostrar actividades permitidas y enviar la nota final.

El token identifica la integracion y el curso. La app externa no debe enviar `courseId`.

## Integraciones multi-curso

Una integracion pertenece siempre a un solo curso. Si una misma actividad externa se usa en varios grupos, e-notes debe crear una integracion independiente por curso, cada una con su propio token.

Desde el tab **Integraciones**, al crear una integracion puedes seleccionar otros cursos para replicarla. e-notes intenta encontrar actividades equivalentes en cada curso destino usando estas reglas:

- Mismo numero de corte.
- Mismo nombre de actividad.

Si un curso destino no tiene todas las actividades equivalentes, se omite y no se crea la integracion para ese curso.

La responsabilidad de una SPA multi-curso queda del lado de la SPA externa: debe tener una lista de tokens y permitir que el estudiante seleccione su grupo antes de cargar estudiantes y actividades.

## Endpoints

Reemplaza:

```txt
BASE_URL=https://tu-dominio.com
TOKEN=token-generado-en-e-notes
```

### 1. Informacion de la integracion

```http
GET /api/integrations/TOKEN
```

Respuesta:

```json
{
  "id": "integration-id",
  "name": "Examen virtual corte 1",
  "course": {
    "id": "course-id",
    "name": "Base de datos 1ACH"
  },
  "activities": [
    {
      "id": "activity-id",
      "name": "Quiz SQL",
      "weightPercentage": 30,
      "source": "virtual",
      "periodCut": {
        "id": "cut-id",
        "name": "Corte 1",
        "cutNumber": 1
      }
    }
  ]
}
```

### 2. Lista de estudiantes

```http
GET /api/integrations/TOKEN/students
```

Respuesta:

```json
{
  "course": {
    "id": "course-id",
    "name": "Base de datos 1ACH"
  },
  "activities": [
    {
      "id": "activity-id",
      "name": "Quiz SQL",
      "students": [
        {
          "id": "student-id",
          "name": "Juan Perez"
        }
      ]
    }
  ]
}
```

La app externa debe mostrar `name`, pero guardar y enviar `id`.

Este endpoint devuelve el listado ya acotado por e-notes: por cada actividad habilitada en la integracion, solo aparecen los estudiantes que todavia no tienen nota registrada en esa actividad. La SPA externa no decide el filtro; solo consume las actividades y estudiantes que e-notes le entrega.

### 3. Reportar una nota

```http
POST /api/integrations/TOKEN/submit
Content-Type: application/json
```

Body:

```json
{
  "studentId": "student-id",
  "activityId": "activity-id",
  "score": 4.5
}
```

Respuesta:

```json
{
  "ok": true,
  "grade": {
    "id": "grade-id",
    "student_id": "student-id",
    "evaluation_activity_id": "activity-id",
    "score": 4.5,
    "notes": "Reportado por integracion externa: Examen virtual corte 1"
  },
  "student": {
    "id": "student-id",
    "name": "Juan Perez"
  }
}
```

Si ya existe una nota para ese estudiante y actividad, e-notes no la modifica. La respuesta indica que el envio fue omitido:

```json
{
  "ok": true,
  "skipped": true,
  "reason": "La actividad ya tiene una nota registrada para este estudiante",
  "grade": {
    "id": "grade-id",
    "student_id": "student-id",
    "evaluation_activity_id": "activity-id",
    "score": 4.2,
    "notes": "Nota previa"
  }
}
```

## Validaciones

El endpoint de envio valida que:

- El token exista y la integracion este activa.
- El estudiante pertenezca al curso de la integracion.
- La actividad este habilitada en esa integracion.
- La nota este entre `0` y `5`.

## Ejemplo en JavaScript

```js
const baseUrl = "https://tu-dominio.com"
const token = "token-generado-en-e-notes"

async function loadIntegration() {
  const infoResponse = await fetch(`${baseUrl}/api/integrations/${token}`)

  if (!infoResponse.ok) throw new Error("No se pudo cargar la integracion")

  const info = await infoResponse.json()

  const studentsResponse = await fetch(`${baseUrl}/api/integrations/${token}/students`)
  if (!studentsResponse.ok) throw new Error("No se pudo cargar estudiantes")

  const studentsData = await studentsResponse.json()

  return {
    course: info.course,
    activities: info.activities,
    availability: studentsData.activities,
  }
}

async function submitGrade({ studentId, activityId, score }) {
  const response = await fetch(`${baseUrl}/api/integrations/${token}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ studentId, activityId, score }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || "No se pudo reportar la nota")
  }

  return data
}
```

## Recomendaciones para apps externas

- No uses `studentName` para reportar notas; usa siempre `studentId`.
- Guarda el token fuera del codigo publico cuando sea posible. Si la SPA es completamente publica, trata el token como una llave de escritura y rota/desactiva la integracion cuando termine la actividad.
- Muestra solo las actividades devueltas por `GET /api/integrations/TOKEN`.
- Convierte la nota final a la escala `0` a `5` antes de llamar a `/submit`.
- Si la actividad externa permite reintentos, define si el ultimo intento sobrescribe la nota anterior.
