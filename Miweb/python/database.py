''' The database module for the Mountain Island Media Center Web is defined
	in this module.	All calls throughout the program leverage this class and
	the methods it contains.
'''
import sqlite3
import base64

from logger import Log

log = Log()

class Database():

	def __init__(self):
		self.conn = None
		self.cursor = None
		self.file = None

	# Opens a connection to a database. Closes any open connection first.
	def open(self, file):
		if self.conn != None:
			self.conn.close()
			log.info('Database::open closed database:', self.file)

		try:
			self.conn = sqlite3.connect(file)
			self.cursor = self.conn.cursor()
			self.file = file
			log.info('Database::open opened database:', self.file)
		except sqlite3.Error as e:
			self.cursor = None
			log.error("Database::open Failed to connect to:", file)

		return self.cursor

	# Fills a list of songs that match the partial_title. Note this method
	# first deletes all songs in the list. Then it repopulates the list.
	# The list is comprised of song dicts.
	def getAllSongs(self, songs, partial_title=''):

		songs.clear()
		query = "SELECT meta.id, meta.number, meta.title, l.name, meta.ldate, \n"
		query += "       c.name, meta.mdate, meta.copyright, meta.music, meta.media \n"
		query += "    FROM meta \n"
		query += "    INNER JOIN author AS l ON meta.lyricist = l.id \n"
		query += "    INNER JOIN author AS c ON meta.composer = c.id \n"

		if len(partial_title):
			query += "AND LOWER(meta.title) LIKE LOWER('%" + partial_title + "%') \n"

		query += "    ORDER BY meta.number ASC;"
		#print(query)
		fields = ['id', 'number', 'title', 'lyricist', 'ldate', 'composer',
				  'cdate', 'copyright', 'music', 'media']
		try:
			self.cursor.execute(query)
			for song in self.cursor.fetchall():
				song_dict = {}
				for i,field in enumerate(fields):
					song_dict[field] = str(song[i])
				songs.append(song_dict)
			log.debug("Database found", len(songs), "hymns in", self.file)
		except sqlite3.Error as e:
			log.error("Database::getAllSongs query failed:\n", '"' + query + '"')


	# Returns a list containing the verse and pages columns for the
	# given hymn record in the stanza table
	def getVerseAndPages(self, verse_id, stanzas):
		stanzas.clear()

		query = "SELECT stanza,pages FROM verse WHERE id = " + str(verse_id)
		try:
			log.debug("Database::getVerseAndPages query:", query)
			self.cursor.execute(query)
			verses,page_string = self.cursor.fetchall()[0]
			pages = page_string.split('|')
			stanzas['sequence'] = verses.split(',')
			for i,verse in enumerate(verses.split(',')):
				stanzas[verse] = pages[i]

			return "ok"
		except sqlite3.Error as e:
			log.error("Database::getVerseAndPages query failed:\n", '"' + query + '"')
			return "error"


	# Method to retrieve image bytes from the database, given a record id.
	def getImageData(self, page_id, file_path):

		image_query = "SELECT image FROM page WHERE id = " + str(page_id) + ";"

		try:
			self.cursor.execute(image_query)
			ibytes = self.cursor.fetchone()[0]
			#print("Number of bytes for", page_id, "is", len(ibytes))
		except sqlite3.Error as e:
			log.error("Database::getImageData query failed:\n", '"' + image_query + '"')
			return

		# Write the image bytes to a file.
		with open(file_path, 'wb') as output:
			output.write(ibytes)


	# Method to retrieve audio data bytes from the database given record id.
	# Writes the data to a file provided by file_path
	def writeAudioData(self, media_id, file_path):

		query = "SELECT type,data FROM media WHERE id = " + str(media_id)
		log.info('Database media query:', query)
		try:
			self.cursor.execute(query)
			media_type,data = self.cursor.fetchall()[0]
			log.debug('Media query successful. Type:', media_type)
			if media_type == 'web':
				return data
		except sqlite3.Error as e:
			log.error("Database::writeAudioData query failed:\n", '"' + query + '"')

		# Write the image bytes to a file.
		actual_path = file_path + "." + media_type
		with open(actual_path, 'wb') as output:
			output.write(data)

		return actual_path


	def getMaxId(self, table):

		query = "SELECT MAX(id) FROM " + table
		try:
			self.cursor.execute(query)
			last_id = self.cursor.fetchall()[0]
			return last_id[0]
		except sqlite3.Error as e:
			log.error("Database::getMaxId query failed:\n", '"' + query + '"')

	def uploadPage(self, path):

		max_id = self.getMaxId("page")
		with open(path, 'rb') as png_in:
			img_data = png_in.read()

		query = "INSERT INTO page (id,image) VALUES (?,?)"
		try:
			self.cursor.execute(query, (max_id + 1, img_data))
			self.conn.commit()
			return max_id + 1
		except sqlite3.Error as e:
			log.error("Database::uploadPage query failed:\n", '"' + query + '"')

	def newVerseRecord(self, stanza, pages):

		max_id = self.getMaxId("verse")

		query = "INSERT INTO verse (id,stanza,pages) VALUES(?,?,?)"

		try:
			self.cursor.execute(query, (max_id + 1, stanza, pages))
			self.conn.commit()
			return max_id + 1
		except sqlite3.Error as e:
			log.error("Database::newVerseRecord query failed:\n", '"' + query + '"')

	def newAudioRecord(self, path):

		max_id = self.getMaxId("media")
		with open(path, 'rb') as audio_in:
			audio_data = audio_in.read()

		query = "INSERT INTO media (id,data,type) VALUES (?,?,?)"
		try:
			suffix = path[-3:]
			self.cursor.execute(query, (max_id + 1, audio_data, suffix))
			self.conn.commit()
			return max_id + 1
		except sqlite3.Error as e:
			log.error("Database::newAudioRecord query failed:\n", '"' + query + '"')

	def newAuthorRecord(self, name):

		# Check for duplicate author names
		query = "SELECT id FROM author WHERE name = ?"
		try:
			self.cursor.execute(query, (name,))
			id = self.cursor.fetchall()
		except sqlite3.Error as e:
			print("Error occurred while executing:\n", '"' + query + '"')

		if ( len(id) == 0 ):
			id = self.getMaxId("author")
		else:
			id = id[0][0]
			return id

		query = "INSERT INTO author (id,name) VALUES (?,?)"
		try:
			self.cursor.execute(query, (id + 1, name))
			self.conn.commit()
			return id + 1
		except sqlite3.Error as e:
			log.error("Database::newAuthorRecord query failed:\n", '"' + query + '"')

	def newMetaRecord(self, num, title, lyricist_id, ldate, composer_id,
					  mdate, copyright, verse_id, audio_id):

		max_id = self.getMaxId("meta")

		query = "INSERT INTO meta (id,number,title,lyricist,ldate,composer"
		query += ",mdate,copyright,music,media) VALUES (?,?,?,?,?,?,?,?,?,?)"

		try:
			data = (max_id + 1,num,title,lyricist_id,ldate,composer_id,
					mdate,copyright,verse_id,audio_id)
			self.cursor.execute(query, (data))
			self.conn.commit()
			return max_id + 1
		except sqlite3.Error as e:
			log.error("Database::newMetaRecord query failed:\n", '"' + query + '"')

	def deleteSong(self, meta_id):

		query = "SELECT meta.lyricist, meta.composer, meta.media, "
		query += "meta.music, v.pages \n"
		query += "FROM meta \n"
		query += "INNER JOIN verse AS v ON meta.music = v.id \n"
		query += "WHERE meta.id = " + str(meta_id)

		try:
			self.cursor.execute(query)
			lyricist,composer,media,verses,pages = self.cursor.fetchall()[0]
			print(lyricist, composer, media, verses, pages)
			# Replace | with commas in the pages variable, then split on
			# commas to make a list. Finally, make a Set out of the list
			# resulting from the split, and then join the string back
			# together with a comma-separator. Result is 100,120,115,...
			pages = ','.join(set(pages.replace('|',',').split(',')))
			self.deleteAuthor('lyricist', lyricist)
			self.deleteAuthor('composer', composer)
			self.deleteRows("media", "id", media)
			self.deleteRows("page", "id", pages)
			self.deleteRows("verse", "id", verses)
			self.deleteRows("meta", "id", str(meta_id))
			log.warning("Database::deleteSong deleted hymn from database", self.file, "with id", meta_id)
			return "ok"
		except sqlite3.Error as e:
			log.error("Database::deleteSong failed to find hymn information:\n", '"' + query + '"')
			return "error"


	def deleteAuthor(self, field, id):

		# Check to see whether this author is linked to any other song(s)
		query = "SELECT COUNT(key) FROM meta WHERE key = " + str(id)
		query = query.replace("key", field)
		try:
			self.cursor.execute(query)
			count = self.cursor.fetchall()[0][0]
			if count > 1:
				return
		except sqlite3.Error as e:
			log.error("Database::deleteAuthor failed to get a count of", field, "in meta table.")
			return

		self.deleteRows('author', 'id', str(id))
		log.info('Database::deleteAuthor deleted author', id)


	# Generic method to delete matching ids within table
	def deleteRows(self, table, field, str_ids):

		str_ids = str(str_ids)
		query = "DELETE FROM " + table + "\n"
		query += "WHERE " + field + " IN (" + str_ids + ")"
		try:
			self.cursor.execute(query)
			self.conn.commit()
		except sqlite3.Error as e:
			log.error("Database::deleteRows query failed:\n", '"' + query + '"')

