import os
import http
import tempfile
import uuid

from flask import Flask, request
from requests import Session
from telegram import Bot, Update, ChatAction
from telegram.ext import Dispatcher, CommandHandler

app = Flask(__name__)
bot = Bot(os.environ['A12N'])
requests = Session()
dispatcher = None


def on_command(bot, update):
  _, generator, quote = update.message.text.split(' ', 2)
  url = 'https://us-central1-%s.cloudfunctions.net/screenshot' % os.environ['GCP_PROJECT']
  params = dict(generator=generator, quote=quote)
  filename = os.path.join(tempfile.mkdtemp(), str(uuid.uuid4()))
  with requests.get(url, params=params, stream=True) as r:
    with open(filename, 'wb') as f:
      [f.write(b) for b in r.iter_content(8192) if b]
  message = update.message.reply_to_message or update.message
  message.reply_photo(photo=open(filename, 'rb'))
  os.remove(filename)


@app.before_first_request
def before_first_request():
  global dispatcher
  dispatcher = Dispatcher(bot=bot, update_queue=None, workers=0)
  dispatcher.add_handler(CommandHandler('death', on_command))
  bot.setWebhook(url='https://%s.appspot.com/telegram' % os.environ['GCP_PROJECT'])


@app.route('/telegram', methods=['POST'])
def telegram():
  dispatcher.process_update(
    Update.de_json(request.get_json(force=True), bot))
  return '', http.HTTPStatus.NO_CONTENT
