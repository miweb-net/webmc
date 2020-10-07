''' The client module for the Mountain Island Media Center Web is defined
	in this module.	This class initializes and maintains the information.
	pertaining to actions the browser user is taking.
'''
import glob, os, sys
import subprocess	# Used to launch external programs
import copy # For making copies of objects (session<preferences)
from database import Database
from preferences import Preferences
from presenter import Presenter

from logger import Log

try:
	if log == None:
		print('Not sure why')
except:
	log = Log()

class Client():

	def __init__(self, path="../database"):

		self. session_files = []

		self.books = self.getBooks(path)

		self.preferences = Preferences()
		self.preferences.readConfig()
		self.session = copy.deepcopy(self.preferences)

		self.db = Database()
		self.openDefaultDatabase()

		self.presenter = Presenter()

		self.songs = []
		self.uploaded_song = {}


	def getBooks(self, path):
		pattern = path + "/*.db3"
		files = []
		for file in glob.glob(pattern):
			files.append(file.replace('\\', '/'))
		log.config(files)
		return files


	def openDefaultDatabase(self):
		for book in self.books:	# database paths
			if self.preferences.database.default in book:
				self.db.open(book)
				return

	def updateSessionData(self, session_obj):
		self.session = session_obj

	# Calls database object to create image files for each page in the song.
	# Returns the list of file paths where the images have been stored.
	def getPageImagesForSong(self, page_ids):

		paths = []
		# Make a database request for each page id,
		for page_id in page_ids:
			file_path = "../tmp/image" + str(page_id) + ".png"
			# Database object writes the png file.
			# If the file is already written (arranger can do this)
			# don't re-write the file.
			if file_path not in paths:
				self.db.getImageData(page_id, file_path)
			# But we need redundant paths returned for arranger's sake.
			paths.append(file_path)

		self.session_files.extend(paths)

		return paths

	# Get the audio stream from the database and create a file.
	# Play the audio stream through the configured player.
	def getAudio(self, media_id):

		file_prefix = "../tmp/audio" + str(media_id)
		# The database will add the appropriate extension based on data type.
		audio_file = self.db.writeAudioData(media_id, file_prefix)

		if audio_file.endswith("mid"):
			xternal = self.preferences.external.midi
		elif audio_file.endswith("mp3"):
			xternal = self.preferences.external.mp3
		else:
			xternal = self.preferences.external.web
			link = audio_file
			command = xternal.replace('<link>', link)
			command = command.split(',')
			log.info("Client::getAudio External audio process:", command)
			p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
			return

		log.info("Client::getAudio Database wrote audio file:", audio_file)

		command = []
		for subcmd in xternal.split(','):
			if subcmd == '<file>':
				subcmd = audio_file
			command.append(subcmd)

		log.info("Client::getAudio External audio process:", command)
		p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		self.session_files.append(audio_file)


	def getSplashConfiguration(self):

		splash = {'type': 'splash', 'label1': self.preferences.splash.label1,
					'label2': self.preferences.splash.label2}
		return splash


	# Read the presentations/hymn, /scripture, /other folders (dive deep)
	# and return the list of html files found with their relative paths.
	def getPresentationFiles(self):

		# Get a list of just the paths of files in the org cache.
		org_cache = []
		paths = getOrganizerCache()
		for dictionary in paths:
			org_cache.append(dictionary['path'])

		all_files = getFilesInDir(self.preferences.presentation.path)

		for path in all_files:
			if path in org_cache:
				continue	# Already in the paths list.
			if '/hymn/' in path:
				ptype = "hymn"
			elif '/scripture/' in path:
				ptype = 'scripture'
			else:
				ptype = 'other'
			paths.append({'type': ptype, 'path': path})

		log.info('Client::getPresentationFiles Found', len(paths), 'files in:', self.preferences.presentation.path)

		self.saveOrganizerSequence(paths)
		return paths

	# Start the presenter external program as per preference configuration.
	def launchPresenter(self, path):

		dot = path.rfind('.')
		extension = path[dot+1:]
			
		external = getattr(self.preferences.external, extension)
		command = []
		for arg in external.split(','):
			if '<file>' in arg:
				arg = arg.replace('<file>', path)
			command.append(arg)

		if sys.platform == "linux":
			my_env = os.environ.copy()
			my_env['LD_LIBRARY_PATH'] = '/usr/lib/libreoffice/program'
			p = subprocess.Popen(command, env=my_env)
		elif sys.platform == "win32":
			command[-1] = command[-1].replace('/', '\\')
			log.info("Launching presenter:", command)
			p = subprocess.Popen(command)


	# Get a list of verses and pages for give song
	def getVerseAndPages(self, data):

		song_id = int(data['id'])
		idx = data['idx']
		for song in self.songs:
			if int(song['id']) == song_id:
				log.debug("Client::getVerseAndPages found song id:", song_id)
				break
	
		stanzas = {}
		log.debug('Client->database::getVerseAndPages verse id:', song['music'])
		status = self.db.getVerseAndPages(song['music'], stanzas)
		if status == "error":
			return None

		pres_file = '../presentations/hymn/' + song['title'] + '.pptx'

		result = {'type': 'stanzas', 'id': song['music']}
		result['values'] = stanzas
		result['idx'] = idx
		result['path'] = pres_file
		if os.path.exists(pres_file):
			result['exists'] = True
		else:
			result['exists'] = False

		return result


	# Creates a song presentation from a supplied dict
	def createSongPresentation(self, song_id_list, page_list, ratio):

		song = None
		if len(song_id_list) > 1:
			song = self.compileMedley(song_id_list)
		else:
			for hymn in self.songs:
				if hymn['id'] == song_id_list[0]:
					song = hymn
					song['type'] = 'single'
					break

		if song == None:
			return None

		# Remove redundant page_ids from page_list ('set' does this)
		unique_page_ids = list(set(page_list))
		if not len(unique_page_ids):
			return None

		unique_paths = self.getPageImagesForSong(unique_page_ids)

		# Build a path list that contains any duplicates because
		# Chorus elements often need to be pasted twice in the
		# presentation file.
		pres_file = '../presentations/hymn/' + song['title'] + '.pptx'
		pres_file = pres_file.replace('?', '')
		log.info("Creating song presentation:", pres_file)

		paths = []
		for pg_id in page_list:
			index = unique_page_ids.index(pg_id)
			paths.append(unique_paths[index])
		if self.presenter.createSongFile(pres_file, song, paths, self.preferences, ratio):
			if os.path.exists(pres_file):
				exists = True
			else:
				exists = False
			response = {'type': 'icon', 'icon_type': 'hymnal',
						'path': pres_file, 'exists': exists}
			return response
		else:
			return None

	def compileMedley(self, song_id_list):

		# Medley: Find each song object and create a unique
		# medley object compilation to send to presenter.
		medley = {}
		for hymn in self.songs: # Only go through all songs once.
			for id in song_id_list: # This is a list of unique ids.
				if hymn['id'] == id:
					# Found a matching id. If medley not initialized...
					if len(medley) == 0:
						# Copy the first hymn converting each key to list
						for key,item in hymn.items():
							medley[key] = [item] # Make a list of each item
					else:
						# Append each item to its key in dict.
						for key,item in hymn.items():
							medley[key].append(item)

		medley['type'] = 'medley'
		medley['titles'] = medley['title']
		medley['title'] = 'Medley-'
		for number in medley['number']:
			medley['title'] += str(number) + ','

		medley['title'] = medley['title'][:-1]
		return medley


	# Create a scripture presentation from data dictionary
	def createScripturePresentation(self, data):

		ref = data['ref']
		font_sz = data['font_sz']
		text = data['text']
		version = data['version']
		ratio = data['ratio']
		text += "\n(" + version + ")"
		path = "../presentations/scripture/" + ref.replace(':', '_') + ".pptx"
		if os.path.exists(path):
			exists = True
		else:
			exists = False
		self.presenter.createScriptureFile(path, font_sz, ref, text,
										 self.preferences, ratio)
		response = {'type': 'icon', 'icon_type': 'bible', 'path': path,
					'exists': exists}
		return response


	def getEditorInitialData(self):
		versions = self.getAvailableBibleVersions()
		log.config('Client::getEditorInitialData Available bible versions:', ', '.join(versions))
		rtn_dict = {'type': 'editor', 'bibles': versions}
		return rtn_dict


	# Get the available bible versions on this system.
	def getAvailableBibleVersions(self):

		version_path  = self.preferences.bible.sword_path

		log.info('Client::getAvailableBibleVersions searching ', version_path)
		version_names = []
		version_configs = glob.glob(version_path + "/*.conf")
		for file in version_configs:
			if "globals.conf" in file:
				continue

			# Open file and read first line.
			with open(file, 'r') as vfile:
				line = vfile.readline()
			vname = line[1:-2]

			version_names.append(vname)
	
		version_names.sort()
		return version_names

	# Look up a scripture in a particular version of the bible.
	# The data object has 2 pertinent attributes:
	#	 data.version -- the version of the bible to look up:
	#    data.passage -- the passage (e.g. Acts 2:38)
	def getBibleVerse(self, data):

		external = self.preferences.external.bible
		command = []
		for arg in external.split(','):
			if '<version>' in arg:
				arg = arg.replace('<version>', data['version'])
			elif '<passage>' in arg:
				arg = arg.replace('<passage>', data['ref'])
			command.append(arg)

		log.info('Client::getBibleVerse Request:', command)

		try:
			p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
			log.info('Client::getBibleVerse Successful command execution.')
		except:
			log.error("Client::getBibleVerse Unexpected error:", sys.exc_info()[0])
			
		''' Diatheke output is: <book> <chapter>:<verse>: <verse text>EOL
			and continues until the last verse is printed. Then it prints
			another EOL, a ": " and repeats the (last) verse, then another EOL
			and prints the (<bible_version>).
		'''
		if p.returncode != 0 and p.returncode != None:
			#log.error('Client::getBibleVerse', p.stderr.decode())
			log.error('Client::getBibleVerse Scripture not found:', data['ref'])
			try:
				log.error('Client::getBibleVerse', p.stdout.read().decode())
			except:
				log.error('Client::getBibleVerse unable to read stdout')
				pass
			return {'type': 'scripture', 'status': 'error',
					'command': external, 'code': p.returncode}
	
		try:
			raw_result = p.stdout.read().decode()
			
			# Remove the duplicate scripture (rfind(':')) and convert to list.
			delim = '\n'
			if sys.platform == "win32":
				scripture = raw_result.replace('\r', '').split(delim)[0:-2]
			else:
				scripture = raw_result.split(delim)[0:-3]
			log.info(raw_result)
		except:
			log.error('Client::getBibleVerse unable to process stdout')

		# To preemptively let the browser know whether the file exists
		# so that it can display an Are You Sure dialog without sending
		# multiple messages to get it done.
		path = "../presentations/scripture/" + data['ref'] + ".pptx"
		if os.path.exists(path):
			exists = True
			log.warning('Client::getBibleVerse File exists:', path)
		else:
			exists = False

		result = {'type': 'scripture', 'status': 'ok', 'text': scripture,
				  'command': external, 'passage': data['ref'],
				  'version': data['version'], 'exists': exists, 'path': path}
		return result

	# Organizer confirm file (in browser) causes this to be called.
	def deleteFile(self, path):
		if os.path.exists(path):
			log.info('Client::deleteFile Organizer request to delete file:', path)
			try:
				os.remove(path)
				log.info('Client::deleteFile Deleted file:', path)
				return "ok"
			except:
				log.warn('Client::deleteFile Failed to delete file:', path)
				return "fail"
		else:
			log.error('Client::deleteFile File does not exist:', path)
			return "does not exist"

	# Update the .organizer file with the current sequence of files
	# that were displayed at the time. The items argument is a list
	# of dicts with 'path' and 'icon' keys sent from the browser.
	def saveOrganizerSequence(self, items):
		with open("../cache/.organizer.txt", 'w') as organizer:
			for item in items:
				organizer.write('type=' + item['type'] + '\n')
				organizer.write('path=' + item['path'] + '\n\n')
		log.info('Client::saveOrganizerSequence Saved', len(items), 'presentation paths to organizer cache.')


	# Clean up the temporary image and media files created this session.
	def cleanupTempFiles(self):
		count = 0
		for file in set(self.session_files):
			count += 1
			if os.path.exists(file):
				try:
					os.remove(file)
					count += 1
				except:
					log.warning('Unable to delete file:', file)
					pass
		log.info('Client::cleanupTempFiles Deleted', count, 'temporary session files.')

	# Opens a process to select a folder. Returns the folder
	# image files (.png) as a list.
	def getFolder(self, starting = ''):
		command = self.preferences.external.browse_folder
		if len(starting):
			command = command.replace('<file>', starting)
		command = command.split(',')

		log.info('Client::getFolder Browsing for folder command:', command)
		p = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
		
		folder = p.stdout.read().decode().strip()
		# Stdout will be blank if cancel was pressed. We return nothing.
		if len(folder) < 2:
			log.info('Client::getFolder Browsing for folder dialog was canceled by user.')
			return None

		image_files = glob.glob(folder + '/*.png')
		audio_files = glob.glob(folder + '/*.mid')
		for file in glob.glob(folder + '/.mp3'):
			audio_files.append(file)

		image_files.sort()
		audio_files.sort()

		result = {'type': 'folder', 'folder': folder}
		result['image_files'] = image_files
		result['audio_files'] = audio_files
		log.info('Client::getFolder Found:', len(image_files), 'and', len(audio_files), 'in', folder)
		return result

	# The song argument is a dictionary received from the browser.
	# It contains everything necessary to create a new hymn record
	# in the database.
	def uploadHymn(self, song):

		# Need to connect to the database (book) indicated in song dict.
		# Save the current one in case of error (we'll reset).
		reconnect = None
		log.info('Client::uploadHymn request:', song)
		if song['book'] not in self.db.file:
			for book in self.books:
				if song['book'] in book:
					reconnect = self.db.file  	# Current connection
					self.db.open(book)			# New connection
					break

		# Upload each page, making sure each is successful.
		pageid_list = []
		for path in song['paths']:
			page_id = self.db.uploadPage(path)
			if page_id == None:
				if reconnect != None:
					self.db.open(reconnect)
				message = "Error uploading " + path
				log.error(message)
				return {'type': 'upload', 'status': 'error', 'message': message}
			# Save the page ids to for mapping (next loop)
			pageid_list.append(page_id)

		# Create a verse record. Required format to send to database is
		# a stanza comma-separated string for the SEQUENCE of part names.
		stanzas = ','.join(song['sequence'])

		# Use the pageid_list list created above with the song['verses'] and the
		# song['sequence'] to create a page string that represents the
		# full arrangement.
		page_sequence = ""
		for verse in song['sequence']:
			page_string = ""
			for index in song[verse]:
				page_string += "," + str(pageid_list[index])
			page_sequence += "|" + page_string[1:]	# Strip the first ,
		page_sequence = page_sequence[1:]	# Strip the first |

		# Commit the verse record to the database.
		verse_id = self.db.newVerseRecord(stanzas, page_sequence)
		if verse_id == None:
			if reconnect != None:
				self.db.open(reconnect)
			message = "Client::uploadHymn Error creating verse record."
			log.error(message, stanzas, page_sequence)
			return {'type': 'upload', 'status': 'error', 'message': message}

		# Create the audio record. Database figures out the type based
		# on the extension.
		media_id = self.db.newAudioRecord(song['audio'])
		if media_id == None:
			if reconnect != None:
				self.db.open(reconnect)
			message = "Client::uploadHymn Error uploading media file."
			log.error(message, song['audio'])
			return {'type': 'upload', 'status': 'error', 'message': message}

		# Create author records for lyricist and composer. The database
		# will return either a new record id (not a duplicate name), an
		# existing record id (matches exactly a name already there), or
		# None if it has trouble creating the record.
		lyricist_id = self.db.newAuthorRecord(song['lyricist'])
		if lyricist_id == None:
			if reconnect != None:
				self.db.open(reconnect)
			message = "Client::uploadHymn Error creating lyricist record."
			log.error(message, song['lyricist'])
			return {'type': 'upload', 'status': 'error', 'message': message}

		composer_id = self.db.newAuthorRecord(song['composer'])
		if composer_id == None:
			if reconnect != None:
				self.db.open(reconnect)
			message = "Client::uploadHymn Error creating composer record."
			log.error(message, song['composer'])
			return {'type': 'upload', 'status': 'error', 'message': message}

		# Create the meta record, which is basically a container of all
		# of the record ids for the inserts above (and a little more).
		meta = self.db.newMetaRecord(song['number'], song['title'],
					lyricist_id, song['ldate'], composer_id,
					song['mdate'], song['copyright'], verse_id, media_id)

		if meta == None:
			if reconnect != None:
				self.db.open(reconnect)
			message = "Client::uploadHymn Error creating meta record."
			log.error(message)
			return {'type': 'upload', 'status': 'error', 'message': message}

		# Successful upload has occurred. Leave the database connected,
		# since the next thing that will be done is to get 

		self.uploaded_song = song
		songs = []
		self.db.getAllSongs(songs)

		return {'type': 'upload', 'status': 'success', 'song': song}


# Reads the organizer cache file to get the files that were there
# at previous program exit. Returns a list of dictionaries. Returns
# [{'type': 'hymn', 'path': '<path>'},
#  {'type': 'scripture': 'path' '<path>'}, ...]
def getOrganizerCache():

	# Read the .organizer.txt file in the ../cache folder
	paths = []

	with open("../cache/.organizer.txt", 'r') as organizer:
		lines = organizer.read()

	for line in lines.split('\n'):
		if len(line) == 0:
			continue
		elif line.startswith("#"):
			continue
		else:
			key,value = line.split('=')
			if key == 'type':
				ptype = value
			else:
				path = value
				if os.path.exists(path):
					paths.append({'type': ptype, 'path': path})
	return paths


# Recursively retrieves file names starting a dir and returns a list of all paths.
def getFilesInDir(dir):

	all_files = []

	for file in glob.glob(dir + "/*.pptx"):
		all_files.append(file.replace('\\', '/'))
	for path in glob.glob(dir + '/*'):
		if os.path.isdir(path):
			more_files = []
			more_files = getFilesInDir(path)

			for file in more_files:
				all_files.append(file.replace('\\', '/'))

	return all_files

if __name__ == '__main__':

	app = Client()
	app.db.getAllSongs(app.songs)
	app.getVerseAndPages({'id': 154, 'idx': 52})
	#print(app.getFolder('/home/ron/Hymnbook/Hymns/Our King Immanuel/ScreenFormat'))