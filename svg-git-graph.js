const gitGraph = (function () {
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

  function gitGraph (figure) {
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
    console.log(JSON.stringify(moments, null, 4))

    sourceElement.innerHTML = sourceContent.join('\n')
  }

  return gitGraph
}())
