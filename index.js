import bsky from '@atproto/api'
import * as dotenv from 'dotenv'

const { BskyAgent } = bsky
dotenv.config()

async function start() {
    const agent = new BskyAgent({ service: 'https://bsky.social/' })
    await agent.login({ identifier: process.env.BLUESKY_ACCOUNT, password: process.env.BLUESKY_PASSWORD})
    console.log("Agent DID: ", agent.session.did)

    const feed = await agent.getAuthorFeed({
        actor: agent.session.did
    })
    console.log("Feed: ", feed)
}

await start()
