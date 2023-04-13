import KeyvRedis from '@keyv/redis'
import { ChatGPTAPI } from 'chatgpt'
import Keyv from 'keyv'

async function main() {
  const redisUrl = process.env.REDIS_URL || '127.0.0.1:6379'
  const store = new KeyvRedis(redisUrl)
  const messageStore = new Keyv({ store, namespace: 'chatgpt-demo' })
  let id = '';
  {
    if (process.env.OPENAI_API_KEY === undefined) {
      return;
    }
    // create an initial conversation in one client
    const api = new ChatGPTAPI({
      apiKey: process.env.OPENAI_API_KEY,
      messageStore
    })

    const prompt = 'What are the top 5 anime of all time?'

    const res1 = await api.sendMessage(prompt);
    console.log('\n' + res1.text + '\n')
    console.log('\n' + res1.id + '\n')
    id = res1.id;
  }

  {
    // follow up with a second client using the same underlying redis store
    const api = new ChatGPTAPI({
      apiKey: process.env.OPENAI_API_KEY,
      messageStore
    })

    const prompt = 'Can you give 5 more?'

    messageStore.get('id')

    const res = await api.sendMessage(prompt, {
        parentMessageId: id
      })
    console.log('\n' + res.text + '\n')
    console.log('')
  }

  // wait for redis to finish and then disconnect
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      messageStore.disconnect()
      resolve()
    }, 1000)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})