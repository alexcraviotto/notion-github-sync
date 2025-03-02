# Notion-GitHub Sync

Sincronizador automático de tareas entre Notion y GitHub Projects. Esta herramienta mantiene sincronizadas las tareas de tu base de datos de Notion con un proyecto de GitHub, incluyendo estados, asignaciones y otros metadatos.

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

1. Clona este repositorio:
```bash
git clone <url-del-repositorio>
cd notion-github-sync
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
```env
# Notion
NOTION_API_KEY=tu_api_key_de_notion
NOTION_DATABASE_ID=tu_id_de_base_de_datos

# GitHub
GITHUB_TOKEN=tu_token_de_github
GITHUB_OWNER=nombre_de_usuario_o_organizacion
GITHUB_REPO=nombre_del_repositorio
GITHUB_PROJECT_NUMBER=numero_del_proyecto

# Configuración de sincronización
SYNC_INTERVAL_CRON="*/5 * * * *"  # Cada 5 minutos por defecto
```

## Uso

### Iniciar en modo producción:
```bash
npm start
```

### Iniciar en modo desarrollo (con recarga automática):
```bash
npm run dev
```

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

## Contribuir

Las contribuciones son bienvenidas. Por favor, abre un issue primero para discutir los cambios que te gustaría hacer.

## Licencia

Este proyecto está licenciado bajo la licencia ISC.