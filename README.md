# HI ALL! This is the code base for mykoreanboo.com and onepieceai.chat
If you are looking for a good base of code for a AI companion website this project will offer you LLM, image generation, and subscription features for you.
Feel free to turn this code into your commercial website.(Please let me know if you actually made it to have healthy revenue because that'd make me sooooo proud!)
Contact me if you need more assitance with custom LLM/image generation.


## Run on your own

- Acquire [Clerk](https://clerk.com/) API Key and Secret Key. 
  - https://clerk.com/docs/quickstarts/nextjs
- Acquire PlanetScale DB API key.
- Acquire Cloudinary 'cloud name' and preset code. 
- Run `node scripts/seed.ts` first.
- After `pnpm i`, run `pnpx prisma generate` and `pnpx prisma db push`

We use [pnpm](https://pnpm.io/) for this project.

We use [shadcn/ui](https://ui.shadcn.com/) for components template.

...

For code format, we'll use prettier and only prettier to enforce code styling to avoid confusion.

**Visual Studio Code** is the recommended editor for this project.

`cp .env.example .env`, then put corresponding values to variables

Use `pnpm i` to install dependencies

Use `pnpm dev` to start dev mode

## Tech Stack 
NextJS

Deployed on Railway

Clerk: for user management

Pinecone

PlanetScale: Main SQL DB 

Cloudindary: Image hosting/store

Upstash: Redis

Replicate: run model

# mykoreanboo
code for mykoreanboo.com

