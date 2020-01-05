---
name: 'post'
description: 'create new article'
message: 'Please enter slug text.'
root: 'content/blog'
output: '**/*'
ignore: []
---

# {{ input }}/index.md`

```markdown
---
title: TITLE
date: '{{ 'new Date().toISOString()' | eval }}'
path: /posts/{{ input | kebab }}/
description: ''
tags:
  - note
---

```