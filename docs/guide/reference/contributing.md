# Improve this guide

Change an article with a Markdown edit and a pull request.

## Find the source

Each article lives under `docs/guide/` in the [Web-IDE repository](https://github.com/csound/web-ide/tree/develop/docs/guide). Its folder groups it with related topics. The **Edit this page** link below each article takes you straight to its source.

Fix wording, add an example you have tried, or explain a step that was hard to find. You do not need to edit React to change an article.

## Add an article

Create a Markdown file in the right folder and add its slug, title, and short description to `navigation.json`. The slug is its path without `.md`. That entry puts the page in the contents and search.

Use one level-one heading for the title. Plain-text level-two and level-three headings form the article outline. Use fenced code blocks with a language name, and give images useful alternative text.

## Keep links portable

Link to another article with a relative Markdown path, such as `../tools/sample-editor.md`. Those links work in the repository and the site rewrites them to article URLs. Section links use the heading text in lowercase, with spaces changed to hyphens.

Use HTTPS URLs for outside sources. Raw HTML is not rendered. Prefer Markdown tables and ordinary links so contributors can read the source without extra tooling.

## Check the change

Run the documentation tests and open `/documentation` locally. Check the article, its section links, and the narrow layout before sending a pull request. The contributor README in `docs/guide` lists the commands.
