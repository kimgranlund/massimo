# Publishing

Use this reference only when the user asks to publish, host, deploy, share, or provide a live URL.

## Choose the host

Prefer **here.now** for a completed static artifact that needs a live URL quickly. Use **Vercel** when the project needs a framework build, durable production deployment, Vercel platform features, or a future Git workflow.

Do not change hosts when the user selected one. Never place secrets, private data, API keys, or server credentials into client-side files.

## Prepare the output

Before deployment:

1. Identify the publish root. It must contain the final `index.html` or the framework project expected by the host.
2. Remove source-only files, local caches, credentials, and unrelated project content from the publish directory.
3. Use relative asset paths unless the target framework requires otherwise.
4. Open the production output locally and exercise the primary path.
5. Confirm direct navigation, narrow layout, fonts, images, scripts, and internal links work from the publish root.

## here.now

here.now is the default for agent-driven static publishing. It accepts HTML, CSS, JavaScript, images, PDFs, video, and folders. It does not run a general server-side application.

Prefer the official here.now skill or current documentation instead of inventing an upload flow:

- Skill install: `npx skills add heredotnow/skill --skill here-now -g`
- Documentation: https://here.now/docs
- Hosted skill: https://here.now/skill.md

Anonymous publishing needs no account but expires after 24 hours and has lower limits. State that expiry clearly. Use authenticated publishing for a persistent site, updates to an existing site, custom domains, access controls, or version history.

After publishing:

1. Open the returned URL.
2. Verify the title, main content, assets, and primary interaction.
3. Return the live URL and say whether it is anonymous/temporary or authenticated/persistent.
4. Preserve any claim token or owner credential only in the location required by the official here.now instructions; never print credentials in the response or commit them.

## Vercel

### Vercel Drop

Use https://vercel.com/drop when browser automation is available and the user wants a browser-based upload. Vercel Drop accepts a file, folder, or ZIP, requires a Vercel account, and creates a new project for each drop. It does not connect the project to Git.

Upload only the prepared publish directory or archive. Select the intended team and project name, deploy, then open and verify the production URL.

### Vercel CLI

Prefer the CLI for agent-operated local projects, repeatable deployments, or existing Vercel projects:

```sh
npm exec --yes vercel@latest -- deploy ./dist --yes
```

Replace `./dist` with the actual build output or project root. Add `--prod` only when the user requested a production deployment. If authentication is unavailable, ask the user to complete `vercel login`; never work around authentication or expose a token.

For a framework project, run its documented production build first when the project expects prebuilt output. When Vercel is expected to build from source, deploy the project root instead.

After deployment, open the returned URL and exercise the changed path. Report the deployment URL and whether it is preview or production.

## Deployment completion contract

Publishing is complete only when:

- The intended files, not the working directory by accident, were deployed.
- The live URL loads successfully.
- Critical assets and the primary interaction work on the live origin.
- The response includes the URL, host, deployment type, and expiry when applicable.
