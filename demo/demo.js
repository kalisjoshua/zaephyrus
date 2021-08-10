(function () {
  const debounce = (fn, delay = 400, pending) => (...args) => {
    pending && clearTimeout(pending)

    pending = setTimeout(() => fn(...args), delay)
  }

  function buildEditor (figure) {
    const img = document.createElement("img")
    const obj = document.createElement("object")
    const pre = document.createElement("pre")
    const textarea = figure.querySelector("textarea")

    figure.appendChild(pre)
    figure.appendChild(img)
    // figure.appendChild(obj)
    // throw new Error("using the object is generating an error in the console")
    img.classList.add("zaephyrus--svg")
    obj.classList.add("zaephyrus--svg")
    obj.setAttribute("type", "image/svg+xml")
    pre.classList.add("demo")
    textarea.addEventListener("keydown", debounce(keydownHandler))
    textarea.img = img
    textarea.obj = obj
    textarea.pre = pre
    textarea.value = textarea.value.trim()

    keydownHandler({target: textarea})
  }

  function keydownHandler ({target}) {
    target.classList.remove("error")

    try {
      const clean = ({outerHTML}) => outerHTML
        .replace(/^</, "&lt;")
        .replace(/\s+class="[^"]+"/, "")
      const qs = encodeURI(zaephyrus.textToQS(target.value))

      target.img.src = `${window.location.href}graphs?${qs}`
      target.obj.setAttribute("data", target.img.src)
      target.pre.innerHTML = [
        "<code>",
        clean(target.img),
        "",
        "&lt;!-- or, using &lt;object> allow for interactivity such as :hover for animation -->",
        "",
        clean(target.obj),
        "</code>",
        "",
      ].join("\n")
    } catch (error) {
      target.classList.add("error")
    }
  }

  function init () {
    Array.from(document.querySelectorAll("figure[class=\"editor\"]"))
      .forEach(buildEditor)
  }

  window.addEventListener("DOMContentLoaded", () => setTimeout(init, 0))
}())
