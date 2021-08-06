function displayGraph (commandsElement, createGraph) {
  const figure = document.createElement("figure")
  const qs = zaephyrus.textToQS(commandsElement.textContent)

  figure.setAttribute("class", "zaephyrus--svg")
  figure.innerHTML = createGraph(qs)

  commandsElement.after(figure)
  commandsElement.remove()
}

module.exports = {
  init: (createGraph) => {
    window.addEventListener("DOMContentLoaded", () => {
      Array.from(document.querySelectorAll('[lang="zaephyrus"]'))
        .forEach((el) => displayGraph(el, createGraph))
    })
  }
}
