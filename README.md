# AI Grid Learner

[Open the interactive learner](https://alexagriffith.github.io/ai-grid-learner/)

Explore how LiteLLM, Grid gateways and llm-d serving fit together.

- **Platform:** topology, components, resources and setup.
- **Request explorer:** follow a request or inspect gateway roles.
- **Helm walkthrough:** an automatically playing explanation of the serving installation, with Pause and Replay controls.

Choose a basic cluster, two combined clusters, a shared consumer or multiple entry gateways. Select components in the diagrams to inspect their roles and source-linked pseudocode.

## Run locally

No build or dependencies are needed. From this directory:

```sh
python3 -m http.server 8000 --bind localhost
```

Open [localhost:8000](http://localhost:8000/). You can also download and open `standalone.html` directly.

## Scope

This is an educational architecture learner. Configurations use documentation addresses and synthetic identities. Resource records are curated chart projections, not deployable manifests. The serving example uses CPU inference simulators.

The four-provider and five-entry diagrams illustrate larger topologies. They do not establish validation at that scale, production readiness or performance. Direct VM consumer integration also requires separate validation. The Helm walkthrough is a visual simulation and does not execute commands.

## Sources and license

Examples derive from [Grid v0.2.2](https://github.com/praxis-proxy/grid/tree/33cb906be2bb0ebdbaf253bd307939a44f41b37b) and the pinned [Grid/llm-d/LiteLLM demo](https://github.com/praxis-proxy/demos/tree/b37a9c95cea838ea8243a0d41f27bf4267eb1d60/demos/grid-llmd-litellm). Inspectors link to additional pinned component sources. See [NOTICE](NOTICE), [LICENSE](LICENSE), and the learner's collapsed Sources and license section.

`manifest.json` records SHA-256 hashes for the reviewed learner assets and standalone export. GitHub Pages serves this directory from `main`.
