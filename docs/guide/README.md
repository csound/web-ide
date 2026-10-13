# Guide source

The site serves these articles at `/documentation`. Edit Markdown to change the copy. Each article loads when the reader opens it.

- `projects/`: README behavior, files, and saving.
- `editor/`: playback, inputs, previews, and code help.
- `tools/`: one article per tool, plus a task index.
- `reference/`: shortcuts, WebMCP, and contribution help.
- `navigation.json`: ordered groups with article paths, titles, and search descriptions.

To add a page, create `folder/name.md` and add `folder/name` to the navigation file. Use one `#` title and plain-text `##` or `###` headings. The reader builds section links from those headings. Avoid raw HTML. Markdown links such as `../tools/mixer.md` work on GitHub and on the site.

Explain a task with the names shown in the interface. Try examples before adding them. Say when an output stays local and when a step saves it to the cloud. Keep the Csound language reference in the manual and link to it where useful.

Run these from the repository root:

```sh
npm run test:ci -- src/components/site-documents
npm run typecheck
npm run start
```

Open `/documentation`, follow the new links, and check a narrow screen as well as both light and dark themes. This README is for contributors and is not in the site's contents.
