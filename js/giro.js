/* Auto en 3D con el scroll: las imágenes del video avanzan (o retroceden) según cuánto bajas.
   Las imágenes se descargan solo cuando la sección está cerca, para no frenar la portada. */
(function () {
  "use strict";
  var sec = document.querySelector(".giro");
  if (!sec) return;
  var lienzo = sec.querySelector(".giro-lienzo"), ctx = lienzo.getContext("2d");
  var puntos = [].slice.call(sec.querySelectorAll(".giro-puntos li"));
  var barra = sec.querySelector(".giro-barra i");
  var TOTAL = +sec.dataset.total || 95, raiz = sec.dataset.raiz || "";
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var movil = function () { return window.innerWidth < 760; };
  var carpeta = movil() ? "movil" : "pc";
  var fotos = [], cargadas = 0, actual = -1, pedido = false, empezado = false;
  var FONDO = "#050c1a"; // azul marino del estudio del video

  var ruta = function (i) { return raiz + "img/giro/" + carpeta + "/" + ("00" + (i + 1)).slice(-3) + ".webp"; };

  /* Lienzo con la nitidez de la pantalla */
  var ajustar = function () {
    var r = window.devicePixelRatio > 1 ? Math.min(window.devicePixelRatio, 2) : 1;
    lienzo.width = Math.round(lienzo.clientWidth * r); lienzo.height = Math.round(lienzo.clientHeight * r);
    actual = -1; pintar();
  };

  /* Dibuja la imagen más cercana que ya esté descargada */
  var dibujar = function (n) {
    var img = fotos[n], k = n;
    while (!(img && img.complete && img.naturalWidth) && k > 0) img = fotos[--k];
    if (!(img && img.complete && img.naturalWidth)) return;
    var W = lienzo.width, H = lienzo.height, iw = img.naturalWidth, ih = img.naturalHeight, s, w, h, x, y;
    ctx.fillStyle = FONDO; ctx.fillRect(0, 0, W, H);
    if (movil()) { s = Math.min(W / iw, H * .62 / ih); w = iw * s; h = ih * s; x = (W - w) / 2; y = H * .5 - h / 2; }
    else { s = Math.max(W / iw, H / ih); w = iw * s; h = ih * s; x = (W - w) / 2; y = (H - h) / 2; }
    ctx.drawImage(img, x, y, w, h);
    if (movil()) { /* bordes de arriba y abajo difuminados con el azul del estudio */
      var f = h * .18, g = ctx.createLinearGradient(0, y, 0, y + f);
      g.addColorStop(0, FONDO); g.addColorStop(1, "rgba(5,12,26,0)"); ctx.fillStyle = g; ctx.fillRect(0, y - 1, W, f);
      g = ctx.createLinearGradient(0, y + h - f, 0, y + h);
      g.addColorStop(0, "rgba(5,12,26,0)"); g.addColorStop(1, FONDO); ctx.fillStyle = g; ctx.fillRect(0, y + h - f, W, f + 1);
    }
  };

  var avance = function () {
    var r = sec.getBoundingClientRect(), largo = sec.offsetHeight - window.innerHeight;
    return largo > 0 ? Math.min(1, Math.max(0, -r.top / largo)) : 1;
  };

  function pintar() {
    pedido = false;
    var p = quieto ? 1 : avance(), n = Math.round(p * (TOTAL - 1));
    if (n !== actual) { actual = n; dibujar(n); }
    puntos.forEach(function (li) { li.classList.toggle("on", p >= +li.dataset.desde); });
    if (barra) barra.style.transform = "scaleX(" + p + ")";
    sec.classList.toggle("empezo", p > .02);
  }
  var pedir = function () { if (!pedido) { pedido = true; requestAnimationFrame(pintar); } };

  /* Descarga: primero algunas repartidas (para que se pueda mover enseguida), luego el resto */
  var cargar = function () {
    if (empezado) return; empezado = true;
    var orden = [], i;
    for (i = 0; i < TOTAL; i += 8) orden.push(i);
    for (i = 0; i < TOTAL; i++) if (orden.indexOf(i) < 0) orden.push(i);
    orden.push(TOTAL - 1);
    var siguiente = 0, activos = 0;
    var bajar = function () {
      while (activos < 6 && siguiente < orden.length) {
        var n = orden[siguiente++]; if (fotos[n]) continue;
        var img = new Image(); img.decoding = "async"; activos++;
        img.onload = img.onerror = function () { activos--; cargadas++; actual = -1; pedir(); bajar(); };
        img.src = ruta(n); fotos[n] = img;
      }
    };
    bajar();
  };

  if (quieto) { sec.classList.add("quieto"); }
  /* Las imágenes se piden recién cuando el visitante empieza a bajar y la sección está cerca:
     así la portada carga igual de rápido */
  var vigilar = function () {
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) cargar(); }, { rootMargin: "100% 0px" }).observe(sec);
    } else cargar();
  };
  if (window.scrollY > 0) vigilar();
  else ["scroll", "touchstart", "keydown"].forEach(function (ev) { window.addEventListener(ev, function una() {
    ["scroll", "touchstart", "keydown"].forEach(function (e) { window.removeEventListener(e, una); }); vigilar();
  }, { passive: true }); });

  window.addEventListener("scroll", pedir, { passive: true });
  var t; window.addEventListener("resize", function () {
    clearTimeout(t); t = setTimeout(function () {
      var c = movil() ? "movil" : "pc";
      if (c !== carpeta) { carpeta = c; fotos = []; empezado = false; cargar(); }
      ajustar();
    }, 150);
  });
  ajustar();
})();
