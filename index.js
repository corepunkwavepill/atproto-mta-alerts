import bsky from '@atproto/api'
import * as dotenv from 'dotenv'
import axios from 'axios'
import fs from 'fs'

const { BskyAgent, RichText } = bsky
dotenv.config()

async function retrieveAndPostMTAStatus() {
  // Read current progress from json file.
  var progress = {
    currentAlertId: 0,
    currentPlannedWorkId: 0
  }
  const jsonString = fs.readFileSync('progress.json')
  var progress = JSON.parse(jsonString)
  console.log('Progress: ', progress)

  // Get MTA Feed
  const mtaFeed = (await axios.get(
    'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json',
    {
       headers: { 'x-api-key': process.env.MTA_API_KEY }
    }
  )).data.entity.sort((a, b) => { return b.id.localeCompare(a.id) })
  const alertsFeed = mtaFeed.filter(entity => /^lmm:alert:\d+$/.test(entity.id))
  const plannedWorkFeed = mtaFeed.filter(entity => /^lmm:planned_work:\d+$/.test(entity.id))

  var alertMessage = ""
  if (alertsFeed.length > 0 && alertsFeed[0].id.localeCompare(progress.currentAlertId) > 0) {
    const alert = alertsFeed[0].alert
    if (alert.header_text) {
      alertMessage += alert.header_text.translation[0].text
    }
    /*if (alert.description_text) {
      alertMessage += '\n' + alert.description_text.translation[0].text
    }*/

    console.log("Alert message: ", alertMessage)
    console.log("Alert: ", alert)
    progress.currentAlertId = alertsFeed[0].id
  }

  var plannedWorkMessage = ""
  if (plannedWorkFeed.length > 0 && plannedWorkFeed[0].id.localeCompare(progress.currentPlannedWorkId) > 0) {
    const alert = plannedWorkFeed[0].alert
    if (alert.header_text) {
      plannedWorkMessage += alert.header_text.translation[0].text
    }
    /*if (alert.description_text) {
      plannedWorkMessage += '\n' + alert.description_text.translation[0].text
    }*/

    console.log("Planned work message: ", plannedWorkMessage)
    console.log("Planned work alert: ", alert)
    progress.currentPlannedWorkId = plannedWorkFeed[0].id
  }

  // Log into bluesky and post
  const agent = new BskyAgent({ service: 'https://bsky.social/' })
  await agent.login({ identifier: process.env.BLUESKY_ACCOUNT, password: process.env.BLUESKY_PASSWORD})

  if (alertMessage) {
    const alertRichText = new RichText({ text: alertMessage })
    await alertRichText.detectFacets(agent)
    agent.post({
      text: alertRichText.text,
      facets: alertRichText.facets
    })
  }

  if (plannedWorkMessage) {
    const plannedWorkRichText = new RichText({ text: plannedWorkMessage })
    await plannedWorkRichText.detectFacets(agent)
    agent.post({
      text: plannedWorkRichText.text,
      facets: plannedWorkRichText.facets
    })
  }

  // Write update to progress file
  fs.writeFileSync('progress.json', JSON.stringify(progress))
}

var three_minutes = 3 * 60 * 1000
setInterval(async () => {
  console.log("Running MTA Subway Script");
  await start()
}, three_minutes)
