# Plataforma Guaruma 50 MW

Plataforma de seguimiento del Proyecto Solar Guaruma 50 MW (Empresa Hondureña de Generación, S.A. de C.V.).

- **Datos:** `Proyecto CAHSA 50 MW/00_Plataforma/Plataforma_Guaruma.xlsx` en OneDrive (fuente única).
- **Documentos:** se leen en vivo de la carpeta `Proyecto CAHSA 50 MW` con Microsoft Graph.
- **Inicio de sesión:** Microsoft (MSAL v3) con la cuenta @beco.hn.
- **Publicación:** GitHub Pages, rama `main`, carpeta raíz.

## Archivos
| Archivo | Para qué |
|---|---|
| `index.html` | Toda la app (diseño, lectura del Excel, documentos, vista previa). |
| `sw.js` | Service worker: instalación como app y funcionamiento sin conexión. Subir `VERSION` en cada cambio. |
| `manifest.json` | Nombre, colores e íconos de la app instalable. |
| `icons/` | Logo e íconos de EHGSA. |

## Azure (registro de la app)
En *Autenticación*, plataforma **Aplicación de página única (SPA)**, Redirect URI exactamente igual a la dirección de GitHub Pages, con `/` al final.
Permisos delegados de Microsoft Graph: `User.Read`, `Files.ReadWrite`.

## Módulo: Cronograma Licencia Ambiental (`cronograma-eia/`)
Cronograma detallado (Gantt, tabla, costos en L y US$) de la sección *Licencia ambiental* de Asana. Asana se mantiene como resumen; este módulo no escribe en Asana.
- **Datos:** `Proyecto CAHSA 50 MW/00_Plataforma/Cronograma Licencia Ambiental/cronograma.json` (la app crea la carpeta y el archivo la primera vez), con subcarpetas `respaldos/` (copia semanal automática), `importaciones/` e `informes/`.
- **Azure:** agregar como Redirect URI (SPA) la dirección del módulo, con `/` al final: `https://becoelectrico.github.io/<repositorio>/cronograma-eia/`.
- **Service worker propio:** `cronograma-eia/sw.js` (subir `VERSION` en cada cambio).

## Módulos dentro de la plataforma (`modulos/`)
Secciones con su propio archivo de código que la plataforma carga al entrar a la ruta (mismo menú, login, tema y barra superior). Se declaran en `MODS` de `index.html`; al cambiar un módulo, subir `APP_VER` en `index.html` y `VERSION` en `sw.js`.
Cada módulo se monta en un Shadow DOM: sus estilos no chocan con los de la plataforma y hereda sus colores, letra y tema claro/oscuro.

### Ruta regulatoria (`modulos/ruta-regulatoria.js`, ruta `#ruta-regulatoria`)
Matriz regulatoria de interconexión: qué pide cada ente (CND, EOR, CRIE, ENEE Transmisión, CREE, SEN, SERNA), en qué orden, dependencias, ruta crítica, costos y comparación con Asana. Fecha X (solicitud de premisas) 30 nov 2026; meta de puesta en marcha 31 jul 2028 (Resumen Proyecto Solar CAHSA en Asana).
- **Página fija:** no lee ni escribe OneDrive ni Asana; los trámites (`S`), tareas con dependencias (`T`) y plazos están en el archivo (actualizado al 20 oct 2026).
- La dirección vieja `ruta-regulatoria/` redirige a `#ruta-regulatoria`.

## Módulo: Consultas (`#consultas` en `index.html`)
Matriz de consultas del EsIA (EHG-SOL-001) y de cualquier otro frente, con la respuesta y los documentos que la respaldan.
- **Datos:** hojas `Consultas` (tabla `tConsultas`, una fila por consulta, columna `Frente`) y `Consulta docs` (tabla `tConsultaDocs`, una fila por documento ligado) del Excel maestro.
- **Códigos en `tConsultaDocs`:** el de la consulta (L1, AP6…); `H01`–`H13` = documento de la hoja completa; `GEN` = general del EsIA; `OTROS` = otros documentos.
- Se edita desde la plataforma (estado, respuesta, quién respondió, documentos ligados); cada cambio queda en la Bitácora. "Descargar Excel" exporta la matriz con los filtros aplicados.

