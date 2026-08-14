# Cómo añadir fotos a un punto

No hace falta tocar el panel de edición ni escribir nada en la web para
esto — solo colocar archivos en la carpeta correcta con el nombre correcto.

## Pasos

1. Busca el **código exacto** del punto tal como aparece en su ficha
   (pestaña "Por punto" o en "Editar → Punto"). Por ejemplo `IG4`, `E36`,
   `VB20`. Tiene que ser textual, con las mismas mayúsculas — a diferencia
   del Explorador de Windows, la web publicada sí distingue mayúsculas de
   minúsculas.
2. Dentro de `images/points/`, crea una carpeta con ese código exacto:
   ```
   images/points/IG4/
   ```
3. Mete ahí las fotos que quieras, **numeradas empezando en 1** y en
   orden: `1.jpg`, `2.jpg`, `3.jpg`... Formatos válidos: `.jpg`, `.jpeg`,
   `.png`, `.webp` (puedes mezclar formatos entre fotos distintas, ej.
   `1.jpg` y `2.png`, siempre que la numeración sea correlativa).
4. Sube esa carpeta igual que subes el resto de archivos del proyecto
   (arrastrando en GitHub, o con `git add . / commit / push` si sigues la
   guía de Git). No hace falta editar ningún archivo de código.
5. Al buscar ese punto en la web (pestaña "Por punto"), las fotos
   aparecerán solas debajo de su ficha, en una cuadrícula — clic en una
   para verla en grande.

## Importante

- **La numeración debe ser correlativa desde el 1**, sin saltos: si subes
  `1.jpg` y `3.jpg` pero no `2.jpg`, la web deja de buscar en el hueco y
  no encontrará la 3. Si borras una foto del medio, renumera las que
  queden.
- Puede haber hasta **12 fotos por punto** con la configuración actual.
  Si algún día hace falta más, es un solo número que cambiar en
  `js/app.js` (la constante `PHOTO_MAX_PER_POINT`).
- Si un punto no tiene ninguna carpeta o ninguna foto numerada
  correctamente, sencillamente no aparece la sección de fotos en su
  ficha — no da error ni hueco vacío.
- Cuantas más fotos y más pesadas, más tarda la página en cargar. Conviene
  no subir fotos de varios megapíxeles sin comprimir; con que se vean bien
  en pantalla es suficiente (unos 1000-1500px de ancho suele bastar).

## Ejemplo

Dentro de esta misma carpeta tienes `EJEMPLO-IG4/` a modo de plantilla de
cómo debería quedar la estructura (solo tienes que renombrarla al código
real del punto y meter tus fotos numeradas dentro; puedes borrar la que
no uses).
