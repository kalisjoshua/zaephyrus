const gitGraph = (function () {
  const defaults = {
    colors: [
      "#603AA1",
      "#1C6EF2",
      "#298540",
      "#D47500",
      "#C8102E",
    ],
    gridSize: 40,
    pointSize: 10,
    strokeWidth: 8,
  }

  const setAttributes = (el, list) => list
    .forEach(([key, value]) => el.setAttribute(key, value))
  const shape = (type) => document.createElementNS("http://www.w3.org/2000/svg", type)

  function buildHistory ({branches, head, log, moments, objects, tags}, matches) {
    const id = Math.random().toString(36).slice(2, 7).toUpperCase()
    const [command, option, argument] = matches
    let stateChange = true

    switch (command.toLowerCase()) {
      case 'checkout':
        if (option === '-b') {
          branches[argument] = {
            head: null,
            links: branches[head] ? [branches[head].head] : null,
          }
        } else if (!branches[argument]) {
          throw new Error(`Branch '${argument}' not available.`)
        }

        stateChange = false

        head = argument
        break
      case 'commit':
        objects[id] = {
          branch: head,
          comment: argument.replace(/^"|"$/g, ""),
          links: branches[head].head
            ? [branches[head].head]
            : branches[head].links,
        }
        branches[head].head = id
        log.push(id)
        break
      case 'merge':
        objects[id] = {
          branch: head,
          comment: `Merge branch '${argument}' into '${head}'`,
          links: [branches[head].head, branches[argument].head],
        }
        branches[head].head = id
        log.push(id)
        break
      case 'tag':
        if (tags[argument]) {
          objects[tags[argument]].tags = objects[tags[argument]].tags
            .filter((tag) => tag !== argument)
        }

        (function (current) {
          current.tags = (current.tags || [])
            .concat(argument)
        }(objects[branches[head].head]))

        tags[argument] = branches[head].head
        break
      default:
        throw new Error(`Unrecognized git command '${[command, option, argument].filter(Boolean).join(' ')}'`)
        break
    }

    if (stateChange) {
      moments.push(JSON.stringify({branches, head, log, objects, tags}))
    }

    return {branches, head, log, moments, objects, tags}
  }

  function gitGraph (figure, options = {}) {
    options = {...defaults, ...options}

    //                  $   git   command    [options]       argument
    const rCommand = /^\$\s*git\s+([^\s]+)\s+(?:(-[\w]+)\s+)?([^$]+)$/
    const sourceElement = figure.querySelector("pre")
    const sourceContent = sourceElement.innerHTML
      .trim()
      .split('\n')
      .map((line) => line.trim())
    const gitCommands = sourceContent
      .map((line) => rCommand.exec(line))
      .filter(Boolean)
      .map((results) => results.slice(1))
    const {moments, ...repo} = gitCommands
      .reduce(buildHistory, {
        branches: {},
        head: null,
        log: [],
        moments: [],
        objects: {},
        tags: {},
      })
    // console.log(JSON.stringify(repo.log, null, 4))

    const branchNames = Array.from(new Set(repo.log
      .map((sha) => repo.objects[sha].branch)))
    const branchColumn = (name) => branchNames.indexOf(name) + 1
    const visualElement = figure.querySelector("svg")

    sourceElement.innerHTML = sourceContent.join('\n')

    visualElement.style.height = (repo.log.length + 1) * options.gridSize

    repo.log
      .reduce((acc, sha, index) => {
        const object = repo.objects[sha]

        const dot = shape("circle")
        const cx = options.gridSize * branchColumn(object.branch)
        const cy = options.gridSize * (repo.log.length - index)
        const fill = options.colors[branchColumn(object.branch) - 1]

        if (object.links) {
          object.links
            .forEach((sha, index) => {
              const parent = acc.filter((el) => el.dataset.sha === sha)[0]
              const line = shape("line")
              const strokeColor = object.links.length === 2
                ? parent.getAttribute("fill")
                : fill

              setAttributes(line, [
                ["x1", cx],
                ["y1", cy],
                ["x2", parent.getAttribute("cx")],
                ["y2", parent.getAttribute("cy")],
                ["stroke", strokeColor],
                ["stroke-width", options.strokeWidth],
              ])

              acc.unshift(line)
            })
        }

        setAttributes(dot, [
          ["cx", cx],
          ["cy", cy],
          ["r", options.pointSize],
          ["fill", fill],
        ])
        dot.dataset.sha = sha

        const text = shape("text")

        setAttributes(text, [
          ["x", options.gridSize * (branchNames.length + 1)],
          ["y", options.gridSize * (repo.log.length - index) + options.pointSize / 2],
          ["class", "graphText"],
        ])
        text.innerHTML = object.comment

        // TODO:
        // display: branch names, and tags

        acc.push(dot)
        acc.push(text)

        return acc
      }, [])
      .map((el) => visualElement.appendChild(el))
  }

  return gitGraph
}())
