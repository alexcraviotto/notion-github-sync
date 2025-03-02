# Notion to GitHub Sync

Sincroniza tareas entre Notion y GitHub Projects.

## Configuración

1. **Variables de entorno**:
   - Copia el archivo `config-templates/.env.example` a `.env` en la raíz del proyecto
   - Rellena las variables con tus tokens y configuración

2. **Mapeo de usuarios**:
   - Copia `config-templates/userMappings.example.js` a `src/config/userMappings.js`
   - Edita el archivo para mapear los nombres de usuario de Notion a GitHub
   - Formato: `'Nombre en Notion': 'usuario-github'`

3. **Mapeo de estados**:
   - Copia `config-templates/statusMappings.example.js` a `src/config/statusMappings.js`
   - Edita los estados para que coincidan con tu configuración
   - Asegúrate de que los estados de GitHub coincidan con tu Project

## Características

- Sincronización bidireccional entre Notion y GitHub Projects
- Mapeo configurable de estados entre ambas plataformas
- Sincronización de:
  - Títulos de tareas
  - Estados
  - Asignaciones
  - Prioridades
  - Fechas límite
  - Planificación de sprints
- Manejo automático de tareas eliminadas/archivadas
- Sincronización periódica configurable mediante CRON

## Requisitos Previos

- Node.js >= 14
- Una base de datos en Notion
- Un token de API de Notion
- Un token de GitHub con permisos para issues y proyectos
- Un proyecto GitHub (Projects v2)

## Instalación

```bash
npm install
```

## Uso

```bash
npm start
```

Por defecto, la sincronización se ejecuta cada 5 minutos. Puedes modificar este intervalo en el archivo `.env` usando la variable `SYNC_INTERVAL_CRON`.

## Tokens necesarios

### Notion
1. Crea una integración en https://www.notion.so/my-integrations
2. Copia el token de la integración a `NOTION_API_KEY`
3. Comparte tu base de datos de Notion con la integración
4. Copia el ID de la base de datos a `NOTION_DATABASE_ID`

### GitHub
1. Crea un token en https://github.com/settings/tokens
2. Asegúrate de dar permisos de repo y project
3. Copia el token a `GITHUB_TOKEN`

## Estructura del Proyecto

```
notion-github-sync/
├── src/
│   ├── config/       # Configuración de la aplicación
│   ├── services/     # Servicios para Notion y GitHub
│   ├── utils/        # Utilidades y funciones auxiliares
│   └── models/       # Modelos de datos (si se necesitan)
├── index.js          # Punto de entrada de la aplicación
└── package.json      # Configuración del proyecto
```

## Configuración de Estados

Los estados se mapean automáticamente entre Notion y GitHub Projects según la siguiente configuración (personalizable en `src/utils/mappers.js`):

| Estado en Notion | Estado en GitHub Projects |
|-----------------|-------------------------|
| Sin Empezar     | Backlog                |
| En progreso     | En progreso            |
| En revisión     | En revision            |
| Completado      | Completado             |
| Disponible      | Disponible             |
| Cancelado       | Cancelado              |

## Personalización

### Estados
Los estados se mapean de Notion a GitHub Projects. Puedes personalizar este mapeo en `src/config/statusMappings.js`. Por ejemplo:

```javascript
{
  'Por hacer': 'Backlog',
  'En progreso': 'In Progress'
}
```

### Usuarios
Los usuarios se mapean de nombres de Notion a usuarios de GitHub. Configura el mapeo en `src/config/userMappings.js`. Por ejemplo:

```javascript
{
  'Juan Pérez': 'juanperez-github',
  'María García': 'mariagarcia123'
}
```

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## Licencia

Este proyecto está licenciado bajo la licencia ISC.