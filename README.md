# Zaephyrus

A utility API for various things.

## TODO

  * [ ] Animate the graph timeline
  * [ ] Make `docs/index.html` a usable playground for building graphs and getting usable links


## /graphs

The `/graphs` resource will generate an SVG Git history graph for use as images in documentation; e.g. in markdown documents on GitHub (the initial use case).

``` html
<img src="https://zaephyrus.herokuapp.com/graphs?b=main&c=&t=v1.0.0&t=latest&t=release-candidate&t=stable&b=story-313&c=make%20it%20work&c=make%20it%20better&c=make%20it%20fast&b=main&m=story-313&t=v1.1.0&t=latest&t=release-candidate" />
```

``` markdown
![](https://zaephyrus.herokuapp.com/graphs?b=main&c=&t=v1.0.0&t=latest&t=release-candidate&t=stable&b=story-313&c=make%20it%20work&c=make%20it%20better&c=make%20it%20fast&b=main&m=story-313&t=v1.1.0&t=latest&t=release-candidate)
```

![](https://zaephyrus.herokuapp.com/graphs?b=main&c=&t=v1.0.0&t=latest&t=release-candidate&t=stable&b=story-313&c=make%20it%20work&c=make%20it%20better&c=make%20it%20fast&b=main&m=story-313&t=v1.1.0&t=latest&t=release-candidate)

### Syntax

The query string of the resource URL should contain the Git history that should be built and displayed using a very terse and limited grammar:

  * b - branch
  * c - commit
  * m - merge
  * t - tag

**Example 1**

The simplest graph would include only one branch with one commit on that branch.

  1. b=main - create the first branch and name it "main"
  2. c=initial commit - add the first commit to the current branch ("main") with the message "initial commit"

*For use in markdown the url should be URL encoded; e.g. spaces in the values of the query string will not work.*

```
![](https://zaephyrus.herokuapp.com/graphs?b=main&c=initial%20commit)
```

![](https://zaephyrus.herokuapp.com/graphs?b=main&c=initial%20commit)


## /graphs/script.js

To use the graphs generator in a web application request the script.

``` html
<script defer src="https://zaephyrus.herokuapp.com/graphs/zaephyrus.js"></script>
<script defer>
  const svg = zaephyrus.createGraph('b=main&c=initial commit')
</script>
```
