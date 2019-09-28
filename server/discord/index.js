import Discord from 'discord.js';
import {
  getRollValueFromMessage
} from './message-handler'

export function registerDiscordBot() {
  const client = new Discord.Client();

  client.once('ready', () => {
    console.log('Bot is running...')
  })


  client.on('message', (msg) => {
    try {
      const values = getRollValueFromMessage(msg.content)
      if (!values) {
        return
      }

      const reply = createReply(values)
      msg.reply(reply)
    } catch (err) {
      msg.reply(err.message)
    }

  })

  client.login(process.env.DISCORD_BOT_TOKEN)
}

function createReply({
  total,
  dice,
  modifier,
}) {
  let reply = ''

  const rolls = dice.reduce((formattedRolls, d, i, arr) => formattedRolls + `[${d}]${arr.length > 1 && i < arr.length - 1 ? ' + ' : ''}`, '')

  reply += ` ${rolls}`

  if (modifier !== 0) {
    reply += ` ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}`
  }

  reply += ` = \`${total}\``

  return reply
}