import asyncio
import websockets
import json
import sys

from logger import Log
from client import Client

log = Log()

dev_mode = True

whosesocket = {}
client = None
songs = [] # A list of song dictionaries
preferences = None
browser_pid = None
application = None
importer = None
search_db = None

async def notify_browser(websocket, msg_dict):
	json_obj = json.dumps(msg_dict)
	try:
		await websocket.send(json_obj)
	except:
		# About the only exception is a dropped connection (close)
		pass

async def register(websocket):
	whosesocket[websocket] = 'unknown'
	await notify_browser(websocket, {"type": 'identify'})

async def initializeApplication(websocket):
	global client, songs, application, search_db

	application = websocket

	if client == None:
		client = Client()	 # Launches initization stuff.
	# Get splash configuration
	splash = client.getSplashConfiguration()
	await notify_browser(websocket, splash)
	organizer = client.getPresentationFiles();
	await notify_browser(websocket, {'type': 'organizer', 'organizer': organizer})
	selected_book = client.preferences.database.default
	dbook = {'type': 'books', 'books': client.books, 'selected': selected_book}
	await notify_browser(websocket, dbook)
	client.db.getAllSongs(songs)
	client.songs = songs
	dsong = {'type': 'songs', 'songs': songs}
	await notify_browser(websocket, dsong)
	# Send preferences to browser. Must occur AFTER client created
	prefs = client.preferences.getDict();
	await notify_browser(websocket, {'type': 'config', 'preferences': prefs})
	editor_dict = client.getEditorInitialData()
	await notify_browser(websocket, editor_dict)
	search_db = selected_book

async def initializeImporter(websocket):
	global client, importer, search_db

	importer = websocket

	# Send preferences to browser. Must occur AFTER client created
	if client == None:
		client = Client()
	prefs = client.preferences.getDict();
	await notify_browser(websocket, {'type': 'config', 'preferences': prefs})
	dbook = {'type': 'books', 'books': client.books, 'selected': search_db}
	await notify_browser(websocket, dbook)

async def finishUpload(response):
	global client, importer, application

	# Change the book to which the search page is pointing
	newsong = response['song']
	book = newsong['book']
	dbook = {'type': 'books', 'books': client.books, 'selected': book}
	await notify_browser(application, dbook)
	songs = client.songs 	# Client got these at end of upload.
	log.debug("Sending command to browser to update the song list")
	# Send command to update the song list
	await notify_browser(application, {'type': 'songs', 'songs': songs})
	# Send command to app browser: switch to search and scroll to song.
	await notify_browser(application, response)


async def unregister(websocket):
	global whosesocket, dev_mode, importer
	log.info('Server::unregister:', whosesocket[websocket], "disconnected.")
	if websocket == application:
		try:
			await notify_browser(importer, {'type': 'session_close'})
		except:
			pass
		client.cleanupTempFiles()
		asyncio.get_event_loop().stop()


async def controller(websocket, path):
	global whosesocket, client, songs, importer, application, search_db
	await register(websocket)
	try:
		async for message in websocket:
			data = json.loads(message)
			if websocket in whosesocket:
				log.debug("Server::Request from:", whosesocket[websocket], 'data:', data)
			else:
				log.info("Server::Register:", data)
				socket = websocket
			if data['action'] == 'identify':
				whosesocket[websocket] = data['name']
				if data['name'] == 'app':
					await initializeApplication(websocket);
				else:
					await initializeImporter(websocket)
			elif data["action"] == "getAllSongs":
				songs = []
				client.db.getAllSongs(songs, data['filter'])
				client.songs = songs
				dsong = {'type': 'songs', 'songs': songs}
				await notify_browser(websocket, dsong)
			elif data["action"] == "change_book":
				book = data['book']
				if websocket == application:
					search_db = book
				client.db.open('../database/' + book + '.db3')
				songs = []
				client.db.getAllSongs(songs)
				client.songs = songs
				dsong = {'type': 'songs', 'songs': songs}
				await notify_browser(websocket, dsong)
			elif data["action"] == "stanzas":
				response = client.getVerseAndPages(data)
				log.debug('Server::Response stanzas:', response['values'])
				await notify_browser(websocket, response)
			elif data["action"] == "pages": # Request for image generation
				paths = client.getPageImagesForSong(data['pages'])
				# Send a single message containing the list of file paths
				# Note: the data['tgt'] is either arranger or parts so that
				#       when browser gets this it knows how to display it.
				pages = {'type': 'pages', 'paths': paths, 'tgt': data['tgt']}
				await notify_browser(websocket, pages)
			elif data['action'] == "audio": # Request for midi or mp3 file.
				path = client.getAudio(data['media_id'])
			elif data['action'] == "display":	# (a presentation file)
				client.launchPresenter(data['path'])
			elif data['action'] == "generate":
				if data['type'] == 'song':
					response = client.createSongPresentation(data['ids'], data['pages'], data['ratio'])
				if response is not None:
					await notify_browser(websocket, response)
			elif data['action'] == 'bible_rqst':
				response = client.getBibleVerse(data)
				await notify_browser(websocket, response)
			elif data['action'] == 'bible_pres':
				response = client.createScripturePresentation(data)
				await notify_browser(websocket, response)
			elif data['action'] == 'delete': # Organizer file delete confirm
				status = client.deleteFile(data['path'])
				await notify_browser(websocket, {'type': 'delete', 'status': status})
			elif data['action'] == "org_update":
				client.saveOrganizerSequence(data['items'])
			elif data['action'] == 'read_org_cache':
				pres_paths_dict = client.getPresentationFiles()
				await notify_browser(websocket, {'type': 'organizer', 'organizer': pres_paths_dict})
			elif data['action'] == 'browse':
				response = client.getFolder(data['start'])
				if response != None:
					await notify_browser(websocket, response)
					await notify_browser(application, response)
			elif data['action'] == 'delete_hymn':
				response = client.db.deleteSong(data['id']);
				# The browser app will make a getAllSongs request
				# after receiving this notification (on success)
				rdict = {'type': 'delete_hymn', 'status': response}
				await notify_browser(websocket, rdict);
			elif data['action'] == "upload":
				response = client.uploadHymn(data['song'])
				await finishUpload(response)
				# Message to Importer: type is 'upload'.
				response['type'] = 'session_close'
				await notify_browser(importer, response)
			elif data['action'] == 'sync_session':
				client.updateSessionData(data['session'])
			elif data['action'] == 'quit':	# Browser is quitting
				sys.exit()
			else:
				if 'action' in data.keys():
					logging.error("Unsupported event type:", data['action'])
				else:
					logging.error("unsupported event: {}", data)

	finally:
		await unregister(websocket)


def startServer():

	# Create a stack of river tiles.
	ip = "127.0.0.1"
	port = 8099
	start_server = websockets.serve(controller, ip, port)

	try:
		asyncio.get_event_loop().run_until_complete(start_server)
		#log.info("Server::start on:", ip + ':' + str(port))
		asyncio.get_event_loop().run_forever()
	except KeyboardInterrupt:
		log.info("Server exit")
		sys.exit()

def setBrowserHandle(handle):
	global browser_handle
	browser_handle = handle

if __name__ == '__main__':
	dev_mode = True
	startServer()