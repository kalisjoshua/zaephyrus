(function () {
  const debounce = (fn, delay = 400, pending) => (...args) => {
    pending && clearTimeout(pending)

    pending = setTimeout(() => fn(...args), delay)
  }

  function buildEditor (figure) {
    const img = document.createElement("img")
    const pre = document.createElement("pre")
    const textarea = figure.querySelector("textarea")

    figure.appendChild(pre)
    figure.appendChild(img)
    img.classList.add("zaephyrus--svg")
    pre.classList.add("demo")
    textarea.addEventListener("keydown", debounce(keydownHandler))
    textarea.img = img
    textarea.pre = pre
    textarea.value = textarea.value.trim()

    keydownHandler({target: textarea})
  }

  function keydownHandler ({target}) {
    target.classList.remove("error")

    try {
      const qs = zaephyrus.textToQS(target.value)

      target.img.src = `${window.location.href}graphs?${encodeURI(qs)}`
      target.pre.innerHTML = `<code>\n&lt;img src="${target.img.src}" />\n\n</code>`
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
