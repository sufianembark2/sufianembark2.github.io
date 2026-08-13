# Tang Ji — Consultor de Acupuntura y MTC

Web personal para organizar puntos de acupuntura y dolencias de la Medicina
Tradicional China, en lugar de tenerlo todo repartido en libretas.

## Qué hace ahora mismo

- **Por dolencia:** listado con categorías → subcategorías → dolencia
  concreta, desplegable, con buscador arriba que filtra todo el árbol
  (ej. escribir "migraña" muestra la rama Cefaleas → Migraña aunque esté
  varios niveles escondida).
- **Por punto:** buscar un punto por código o nombre y ver su ficha completa
  (ubicación, indicaciones, técnica, precauciones, y en qué dolencias se usa).
- **Atlas:** listado de puntos filtrable por meridiano (de momento sin
  diagrama del cuerpo — es el siguiente paso).
- **Editar (requiere iniciar sesión):** un botón arriba a la derecha pide
  usuario y contraseña antes de dejar añadir o editar contenido. Por
  defecto es `admin` / `1234` — cámbialo cuanto antes desde
  "Editar → Cuenta". Consultar la web (buscar dolencias, ver puntos) nunca
  requiere iniciar sesión.

  **Importante sobre esto:** al ser una web sin servidor, este login es
  una valla de acceso para uso normal, no seguridad de nivel bancario —
  alguien con conocimientos técnicos podría saltárselo desde las
  herramientas de desarrollador del navegador. No es grave porque cada
  visitante solo puede tocar su propia copia local de los datos, nunca la
  de otra persona.

- **Edición completa (añadir, editar, mover y eliminar):** una vez iniciada
  sesión como admin, aparecen botones directamente en cada elemento:
  - En cada **categoría**: `📁+` añadir subcategoría dentro, `🩹+` añadir
    dolencia dentro, `✎` editar el nombre (y moverla a otra categoría
    padre), `🗑` eliminarla (avisa si tiene contenido dentro).
  - En cada **dolencia**: `✎` editar nombre/descripción/puntos/categoría,
    `🗑` eliminarla.
  - En cada **punto** (pestaña "Por punto"): `✎` editar su ficha completa
    (incluido el código — si lo cambias, se actualiza solo en todas las
    dolencias que lo usaban), `🗑` eliminarlo.
  - Botones "＋ Nueva categoría principal" y "＋ Nuevo punto" arriba de
    cada listado para crear desde cero.
  - El panel "Editar" (el del botón de arriba) sigue disponible para lo
    mismo desde un formulario centralizado, y cada pestaña también admite
    editar/cancelar/eliminar cuando se llega a ella desde uno de los
    botones inline.
- **Copia de seguridad:** dentro de "Editar → Copia de seguridad" se puede
  descargar todo en un archivo `.json` y volver a cargarlo (útil al cambiar
  de ordenador, o simplemente para no perder el trabajo).

Importante: los datos añadidos se guardan en el navegador de cada
dispositivo (localStorage), no en la nube. Si tu madre usa siempre el mismo
ordenador/navegador no pasa nada, pero conviene descargar la copia de
seguridad de vez en cuando.

## Publicarla gratis en GitHub Pages

Tu repositorio `sufianembark2.github.io` ya está ocupado con la parte de
TikTok, así que lo mejor es crear un **repositorio nuevo** solo para esto.
Quedará publicada en una dirección tipo:

```
https://sufianembark2.github.io/tangji/
```

Pasos (sin usar la terminal, todo desde la web de GitHub):

1. Entra en [github.com/new](https://github.com/new).
2. Ponle de nombre, por ejemplo, `tangji` (o el que prefieras).
3. Déjalo en **Public**, y crea el repositorio (no marques ningún archivo
   inicial extra).
4. Dentro del repo nuevo, pulsa **"Add file" → "Upload files"**.
5. Arrastra estos archivos y carpetas tal cual están:
   - `index.html`
   - `README.md`
   - la carpeta `css/` (con `style.css` dentro)
   - la carpeta `js/` (con `data.js` y `app.js` dentro)
6. Pulsa **"Commit changes"**.
7. Ve a **Settings → Pages** (menú de la izquierda).
8. En "Build and deployment", elige **Source: Deploy from a branch**, rama
   `main`, carpeta `/ (root)`, y guarda.
9. Espera 1-2 minutos y entra en la URL que te muestra GitHub arriba
   (`https://sufianembark2.github.io/tangji/`).

A partir de ahí, cualquier cambio futuro en los archivos (por ejemplo si
mejoramos el CSS o añadimos el atlas visual) se sube igual, con
"Upload files" y sobrescribiendo lo que haya.

## Próximos pasos posibles

- Diagrama del cuerpo con los puntos ubicados visualmente en la pestaña
  Atlas.
- Más categorías, subcategorías, dolencias y puntos (esto ya lo puede ir
  rellenando tu madre desde "Editar").
- Si algún día se quiere que los datos estén disponibles desde varios
  dispositivos a la vez, habría que añadir una base de datos en la nube —
  de momento todo funciona sin necesidad de eso.
