/* Flota: dos filas de autos. Al bajar, la primera fila se desliza hacia la derecha y la segunda
   hacia la izquierda, así los 16 autos caben en una sola pantalla.
   Además, mientras la sección está a la vista las filas se mecen solas, despacio (aunque no se haga scroll),
   y el movimiento del scroll se suaviza para que no se note a saltos.
   Si se elige una categoría en los filtros, se deja de deslizar y se muestran juntos. */
(function () {
  "use strict";
  var EV = ["scroll", "wheel", "touchmove", "keydown"], hecho = false;
  var arrancar = function (e) {
    if (hecho || (e && e.type === "scroll" && window.scrollY < 40)) return;
    hecho = true;
    EV.forEach(function (n) { window.removeEventListener(n, arrancar); });
    if (window.requestIdleCallback) requestIdleCallback(iniciar, { timeout: 500 }); else setTimeout(iniciar, 50);
  };
  EV.forEach(function (n) { window.addEventListener(n, arrancar, { passive: true }); });
  window.addEventListener("load", function () { if (window.scrollY > 40) arrancar(); });

  function iniciar() {
    var sec = document.querySelector(".flota-desliza");
    if (!sec || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { if (sec) sec.classList.add("filtrado"); return; }
    var filas = [].slice.call(sec.querySelectorAll(".fila"));
    var sobra = [0, 0], vaiven = 0, suave = -1, reloj = 0, previo = 0, cuadro = 0, aLaVista = true;
    var PERIODO = 14000; /* milisegundos que tarda en ir y volver el vaivén */

    /* cuánto le sobra a cada fila respecto del ancho de la pantalla, y cuánto se puede mecer */
    var medir = function () {
      filas.forEach(function (f, i) { f.style.transform = ""; sobra[i] = Math.max(0, f.scrollWidth - sec.clientWidth); });
      vaiven = Math.min(window.innerWidth < 760 ? 46 : 80, Math.min(sobra[0], sobra[1]) / 2);
      suave = -1; seguir();
    };
    var avance = function () {
      var r = sec.getBoundingClientRect(), largo = sec.offsetHeight - window.innerHeight;
      return largo > 0 ? Math.min(1, Math.max(0, -r.top / largo)) : 0;
    };
    var corriendo = function () { return aLaVista && !document.hidden && !sec.classList.contains("filtrado"); };

    var paso = function (ahora) {
      cuadro = 0;
      if (!corriendo()) { previo = 0; return; }
      var dt = previo ? Math.min(ahora - previo, 50) : 16; previo = ahora;
      reloj += dt;
      /* el scroll no se aplica de golpe: la fila lo alcanza en unos 150 ms */
      var p = avance();
      suave = suave < 0 ? p : suave + (p - suave) * (1 - Math.exp(-dt / 150));
      var d = vaiven * Math.sin(reloj / PERIODO * 2 * Math.PI);
      /* fila 1: avanza a la derecha · fila 2: avanza a la izquierda; el vaivén va en sentidos opuestos */
      if (filas[0]) filas[0].style.transform = "translate3d(" + (-vaiven - (sobra[0] - 2 * vaiven) * (1 - suave) + d).toFixed(1) + "px,0,0)";
      if (filas[1]) filas[1].style.transform = "translate3d(" + (-vaiven - (sobra[1] - 2 * vaiven) * suave - d).toFixed(1) + "px,0,0)";
      cuadro = requestAnimationFrame(paso);
    };
    var seguir = function () { if (!cuadro && corriendo()) { previo = 0; cuadro = requestAnimationFrame(paso); } };

    /* solo se anima mientras la sección se ve */
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { aLaVista = es[0].isIntersecting; seguir(); }).observe(sec);
    document.addEventListener("visibilitychange", seguir);

    /* filtros: con una categoría elegida, los autos se muestran juntos sin deslizar */
    [].forEach.call(document.querySelectorAll(".chip"), function (c) {
      c.addEventListener("click", function () {
        var todos = c.dataset.f === "todos", antes = sec.getBoundingClientRect().top;
        sec.classList.toggle("filtrado", !todos);
        /* cuántos autos quedaron: el CSS adapta el tamaño de las tarjetas */
        sec.dataset.n = [].filter.call(sec.querySelectorAll(".auto"), function (a) { return !a.hidden; }).length;
        filas.forEach(function (f) { f.style.transform = ""; });
        /* la sección cambia de alto: se deja el inicio de la flota a la vista para que la página no salte */
        if (antes < 0) window.scrollTo({ top: sec.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
        if (todos) requestAnimationFrame(medir);
      });
    });
    var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(medir, 150); });
    medir();
  }
})();
