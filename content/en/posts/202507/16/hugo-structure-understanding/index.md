---
title: "Notes on Customizing Hugo Blogs"
date: 2025-07-16
tags: ["Hugo"]
description: "A simple guide to understanding Hugo templates and customizing your blog."
---

I built this blog using Hugo, a static site generator written in Go. If you're building your own blog, you'll naturally want to customize the design to your liking. So I've documented what I learned about Hugo's basic structure as a memo. It might look a bit complex at first, but once you get used to it, it's actually quite simple.

Note that at the time of writing this article, I'm using Hugo v0.148.0.

## Basic Directory Structure of Hugo

In Hugo, all articles (md files) are stored in the `content/` directory. This directory serves as the starting point for all content on your site. The most basic structure looks like this:

```text
<Project Root>
├── content/ # All articles
├── themes/<theme-name>/layouts # Templates provided by the theme
├── layouts/ # Custom templates to override the theme
├── public/ # Built site output
```

In the generated site, the directory structure under `content/` directly becomes the URL structure of your site. For example, `content/posts/article.md` can be accessed at the URL `/posts/article/`.

Hugo generates pages for individual articles (.md files) or directories. In other words, you can place .md files, or for directories, place an `_index.md` file to generate a page for the corresponding URL.

## About Themes

Templates are used when converting articles and directories into pages. Templates are basically provided by themes. If you're satisfied with the design and functionality provided by the theme, you don't need to do anything. However, if you want to change the design of specific pages or add new functionality, you need to customize templates.

While it's possible to directly edit templates within the theme, it's better to create custom templates and implement only the differences. To use custom templates, simply create a `layouts` directory directly under the project root and place templates there. This allows you to override theme templates precisely.

Adopting this differential implementation approach makes it easy to keep up with theme updates (though you can directly update the theme if you don't care about staying current).

## Template Selection Rules

Hugo automatically selects templates based on the type of page. Initially, I was enthusiastic about perfectly explaining template selection rules in this article, but it turned out to be more difficult to write than I thought, so I quickly gave up. Here I'll only explain the basic rules. For details, please refer to the [official documentation](https://gohugo.io/templates/lookup-order/). For building simple sites like this blog, the knowledge written here should be sufficient.

Templates basically have their filenames determined by specification according to template type, and you can't assign arbitrary names (strictly speaking, directories directly under `content` are called "sections" and section templates can have template files with the same name as the section name, but I won't cover that here. You probably don't need to know this for blog construction. Maybe).

This blog uses the following templates:

- `index.html` : Site's top page
- `list.html` : Article list pages
- `single.html` : Individual article pages
- `terms.html` : Taxonomy list pages
- `baseof.html` : Common template

※Taxonomy is an important feature, so I'll explain it later

For example, when generating article list pages, `list.html` is used, but:

- Search for `list.html` in custom templates and use it if found
- If not found, search for `list.html` in theme templates and use it if found

This is a two-step process for template searching. Each step follows rules for searching, but since I've decided to omit section explanations on this page, you can think of it as searching with the following rules:

- Search for `list.html`
- Search for `_default/list.html`

Note that to generate list pages using `list.html`, you need to place `_index.md` in the directory (as already mentioned), but for section directories, list pages using `list.html` are automatically generated even without placing `_index.md`.

## Article Classification with Taxonomies

Hugo has a mechanism called Taxonomy for classifying and organizing articles (a system for easily implementing article classification using tags and categories common in blogs). To use taxonomies, you first need to define what classifications to use in the configuration file (`hugo.toml`).

```text
[taxonomies]
tag = 'tags'
category = 'categories'
```

Specify the key name used in frontmatter on the left side of =, and the value that becomes the URL path on the right side. In article frontmatter, you specify classifications like this:

```text
---
tags: ["hugo", "blog"]
categories: ["tech"]
---
```

Then, Hugo automatically generates the following pages:

- `/tags/` - List of all tags (uses `terms.html`)
- `/tags/hugo/` - List of articles with "hugo" tag (uses `list.html`)
- `/tags/blog/` - List of articles with "blog" tag (uses `list.html`)
- `/categories/` - List of all categories (uses `terms.html`)
- `/categories/tech/` - List of articles in "tech" category (uses `list.html`)

What's interesting is that you can generate each list page using only the generic `list.html` without creating separate `list.html` for tag lists and `list.html` for category lists. However, there are cases where you want to apply independent designs to specific list pages. For example, if you want to create a custom design only for tag list pages, you can create a template at the following path:

- `layouts/tags/list.html`

This allows you to generate only tag list pages with a custom design.

To briefly explain how generic `list.html` generates individual list pages, Hugo achieves this by setting up a list of articles with specific tags or categories in the template variable `.Pages` before starting the build process.

## Common Layout with baseof Template

The template that is commonly called by all pages is `layouts/_default/baseof.html`. This is like a Layout component in React, where you can define the common layout for the entire site, such as headers and footers, in one place.

Looking inside `baseof.html`, you'll find descriptions like this:

```text
<main>{{ block "main" . }}{{ end }}</main>
```

This `{{ block "main" . }}{{ end }}` is a slot for inserting content specific to each page, declaring that it uses main as the slot name. And for example, looking at the top page template `index.html`:

```text
{{ define "main" }}
...Top page content...
{{ end }}
```

This way, the top page content is given the name `main`. This is how the top page content gets inserted into the `baseof.html` slot.

## Reusing Components with partials

Templates have another useful feature. There's a mechanism called `partial` for extracting commonly reusable templates.

```text
{{ partial "head.html" . }}
```

Like this, you can reuse common components such as headers and footers in multiple places. This eliminates code duplication and improves maintainability. As a side note, the `.` that appears in the code introduced so far is notation for passing page context to templates. With this, you can access information like page titles, creation dates, and frontmatter information within templates.

## Shortcode

Hugo has a useful feature called shortcodes. This is a convenient mechanism for easily embedding complex content that's difficult to express with markdown notation alone. While templates are components for designers to use, shortcodes are common components for article writers to use.

For example, to embed a YouTube video:

```text
{{</* youtube "video-id" */>}}
```

To insert figures:

```text
{{</* figure src="image.jpg" title="Figure title" */>}}
```

You can create your own shortcodes by placing template files in the `layouts/shortcodes/` directory. For example, if you create `layouts/shortcodes/note.html`:

```text
{{</* note */>}}
Note content here
{{</* /note */>}}
```

You can use it like this (Hugo also provides built-in shortcodes for YouTube, X, Instagram, etc.).

## Conclusion

I've summarized the basic structure of Hugo and templates, covering the knowledge needed to actually build a blog. I didn't go into detail about template syntax, but I think you can look that up when you actually have specific areas you want to customize. It's good to start by copying theme templates and trying various changes.

By the way, Hugo templates don't use Hugo-specific syntax but rather Go language's standard template syntax. However, you don't need Go language knowledge to create templates, so don't worry. The template syntax itself is simple, and you can customize sufficiently by learning HTML and a little variable notation.

Well, that's about it. Good luck with building your Hugo blog.
