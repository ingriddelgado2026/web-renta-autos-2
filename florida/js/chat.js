/* Cómo funciona: la conversación de WhatsApp se escribe (o se borra) según cuánto bajas.
   Antes de cada respuesta del asesor aparece "escribiendo…", y el paso de la derecha se ilumina. */
(function () {
  "use strict";
  var sec = document.querySelector(".chat-sec");
  if (!sec || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var msgs = [].slice.call(sec.querySelectorAll(".msg:not(.escribe)"));
  var escribe = sec.querySelector(".msg.escribe");
  var pasos = [].slice.call(sec.querySelectorAll(".chat-pasos li"));
  var N = msgs.length, pedido = false, ultimo = -2, fotoLista = false;

  var avance = function () {
    var r = sec.getBoundingClientRect(), largo = sec.offsetHeight - window.innerHeight;
    return largo > 0 ? Math.min(1, Math.max(0, -r.top / largo)) : 1;
  };
  var pintar = function () {
    pedido = false;
    var r = sec.getBoundingClientRect();
    if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
    /* la foto del auto del chat se pide recién cuando la sección está cerca */
    if (!fotoLista) { fotoLista = true; [].forEach.call(sec.querySelectorAll("img[data-src]"), function (i) { i.src = i.dataset.src; i.removeAttribute("data-src"); }); }
    /* los mensajes aparecen entre el 4% y el 88% del recorrido */
    var p = avance(), x = (p - .04) / .84 * N, n = Math.max(0, Math.min(N, Math.floor(x + .0001)));
    var resto = x - Math.floor(x), sig = msgs[n];
    var tecleando = n < N && x >= 0 && sig && sig.classList.contains("in") && resto > .45;
    var clave = n * 2 + (tecleando ? 1 : 0);
    if (clave === ultimo) return; ultimo = clave;
    msgs.forEach(function (m, i) { m.classList.toggle("ver", i < n); });
    escribe.classList.toggle("ver", !!tecleando);
    var actual = n ? +msgs[n - 1].dataset.paso : 0;
    if (tecleando) actual = Math.max(actual, +sig.dataset.paso);
    pasos.forEach(function (li) { var k = +li.dataset.paso; li.classList.toggle("on", k === actual); li.classList.toggle("hecho", k < actual); });
  };
  var pedir = function () { if (!pedido) { pedido = true; requestAnimationFrame(pintar); } };
  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", pedir);
})();
