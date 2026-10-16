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
