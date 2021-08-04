const commands = {
  checkout: "b",
  commit: "c",
  merge: "m",
  tag: "t",
}
// [fake commands]   $    git    command      argument
const rCommand = /^\$\s*git\s+([^\s]+)\s+([^$]+)$/

function displayGraph (commandsElement, createGraph) {
  const qs = commandsElement.textContent
    .trim()
    .split('\n')
    .map((line) => {
      const [command, arg] = (rCommand.exec(line.trim()) || [])
        .slice(1, 3)

      return [commands[command], arg.replaceAll('"', "")]
        .join('=')
    })
    .join('&')

  const figure = document.createElement("figure")

  figure.setAttribute("class", "gitGraph")
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
