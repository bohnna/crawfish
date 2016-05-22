# Crawfish

This is a command-line crawler meant for checking links and creating content inventories. I'm also using this as an opportunity to learn about node, npm, and javascript.

#### Currently it will return a list of links and 404 error pages

**To use:** simple run: crawfish [url]

**To output the JSON to a file:** crawfish [url] --file filename.json

##### Additional flags:

-v: verbose
-r: include referrers
-l: include links

#### Plans
- Output to CSV (with indentation and numbering)
- Output different content types sorted by link
- Screenshots via Electron


### TODO
- get rid of crawlback city
- refactor function that populates referrers/links
- actual tests
- actual error reporting
- progress animation that indicates the program hasn't frozen for large websites
