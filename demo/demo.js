(function () {
  const style = document.createElement("style")

  style.textContent = `
    .editor {
      margin: 0;
      padding: 0;
    }

    .editor textarea {
      height: 10em;
      width: 100%;
    }
  `

  const debounce = (fn, delay = 400, pending) => (...args) => {
    pending && clearTimeout(pending)

    pending = setTimeout(() => fn(...args), delay)
  }

  function editor (figure) {
    const img = document.createElement("img")
    const pre = document.createElement("pre")
    const textarea = figure.querySelector("textarea")

    figure.appendChild(pre)
    figure.appendChild(img)
    pre.classList.add("demo")
    textarea.addEventListener("keydown", debounce(editorChange))
    textarea.img = img
    textarea.pre = pre
    textarea.value = textarea.value.trim()

    editorChange({target: textarea})
  }

  function editorChange ({target}) {
    const qs = encodeURI(zaephyrus.textToQS(target.value))

    target.img.src = `${window.location.href}graphs?${qs}`
    target.pre.innerHTML = `<code>\n&lt;img src="${target.img.src}" />\n\n</code>`
  }

  function init () {
    Array.from(document.querySelectorAll("figure[class=\"editor\"]"))
      .forEach(editor)
  }

  document.head.appendChild(style)

  window.addEventListener("DOMContentLoaded", () => setTimeout(init, 0))
}())
