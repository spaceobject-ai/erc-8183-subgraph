# ERC-8183 subgraph

Indexes an ERC-8183 Agentic Commerce contract. Ethereum Sepolia is the
default chain. `chain.config.json` also ships Ethereum, Base, Base Sepolia,
Arc, and Arc Testnet as examples you can copy.

The contract has no canonical address. Set the Agentic Commerce address and
deployment block separately for every chain before deploying.

## Install

Install the [Vite+ CLI](https://viteplus.dev/guide/). It installs the pinned
Bun version and uses it as this project's package manager.

```sh
curl -fsSL https://vite.plus | bash
vp install
```

## Deploy to a chain

1. Add the deployed contract address and start block to `chain.config.json`.
2. Create a Subgraph Studio project for that chain and copy its slug.
3. Authenticate once with your deploy key.

   ```sh
   bunx graph auth YOUR_DEPLOY_KEY
   ```

   Keep the key in your password manager or shell environment. Do not commit
   it.

4. Run the deploy script with `chain=slug`.

   ```sh
   bun run deploy -- sepolia=your-studio-slug --version v0.1.0
   ```

   This generates the chain's manifest, runs codegen, builds it, and pushes
   it to Studio. Version defaults to `dev` if you skip `--version`.

Deploy to several chains at once. Each needs its own Studio project and
Agentic Commerce address.

```sh
bun run deploy -- \
  mainnet=your-mainnet-slug \
  base=your-base-slug \
  --version v0.1.0
```

If one build or deploy fails, the script stops there. Fix that target and
run the command again.

To build a manifest without deploying, drop the slug and add `--build-only`.

```sh
bun run deploy -- sepolia --build-only
```

Running `vp run build` does the same thing for Sepolia. For build-only
commands, an unset `0x` address becomes the zero address because codegen and
the AssemblyScript compiler do not query the chain. Deployment commands
reject unset addresses.

## Add a new chain

Open `chain.config.json` and add an entry. Copy an existing one and change
the values.

```json
{
  "your-chain": {
    "network": "the-graph-network-id",
    "chainId": 123,
    "contracts": {
      "agenticCommerce": {
        "address": "0x...",
        "startBlock": 100
      }
    }
  }
}
```

- `network` is the id from The Graph's
  [supported networks page](https://thegraph.com/docs/en/supported-networks/).
- `address` is that chain's Agentic Commerce deployment.
- `startBlock` should be the deployment block. Zero works, but makes the
  indexer scan history it does not need.

Build it before deploying anything.

```sh
bun run deploy -- your-chain --build-only
```

## Testing

```sh
vp run test
```

Matchstick tests cover pure ID logic, the shared admin pause mutation, and
early-return guards. Saving entities with GraphQL `Timestamp` fields still crashes Matchstick's test runner
([LimeChain/matchstick#433](https://github.com/LimeChain/matchstick/issues/433)).
The complete handlers are compiled by `graph build`.

## Quality checks

```sh
vp check
```

Before opening a pull request, run everything:

```sh
vp run ready
```

This formats and lints the project, typechecks `scripts/`, builds the Sepolia
subgraph, and runs Matchstick.

## Notes on the schema and handlers

These are working notes, not a spec. Read `schema.graphql` and `src/` before
depending on a detail.

- `AgenticCommerce`, `Account`, `Job`, `Claim`, and the allowlist entries are
  mutable. `JobEvent` is the immutable escrow audit log. Reverse lookups use
  `@derivedFrom`, so parent entities do not store growing arrays.
- `JobCreated` does not emit the description or initial provider agent ID.
  Its handler uses the manifest's declared `getJob` call to store both.
- Claim handlers retain the submitted claim, its resolver, and the resolution
  transaction. Job fields also track cumulative settlement, provider payment,
  fees, and refunds.

If a note disagrees with the mapping, trust the mapping. These notes drift.
